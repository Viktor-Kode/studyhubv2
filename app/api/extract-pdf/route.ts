import { NextRequest, NextResponse } from 'next/server';
import * as pdfjsLib from 'pdfjs-dist';

/**
 * Server-side PDF extraction API route.
 * Updated to use CDN-hosted worker source to avoid bundling issues on Vercel.
 * Uses the legacy build alias from next.config.js.
 */

// Configure PDF.js to use the CDN worker source
// This prevents the engine from trying to resolve local worker files during the build/execution
if (typeof pdfjsLib.GlobalWorkerOptions !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
}

// Polyfill DOMMatrix for PDF.js in Node.js
if (typeof global.DOMMatrix === 'undefined') {
    (global as any).DOMMatrix = class DOMMatrix {
        a = 1; b = 0; c = 0; d = 1; e = 0; f = 0;
        constructor() {}
        static fromFloat32Array() { return new DOMMatrix(); }
        static fromFloat64Array() { return new DOMMatrix(); }
        multiply() { return this; }
        translate() { return this; }
        scale() { return this; }
        rotate() { return this; }
        inverse() { return this; }
        toString() { return "matrix(1, 0, 0, 1, 0, 0)"; }
    };
}

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        const arrayBuffer = await file.arrayBuffer();
        const typedArray = new Uint8Array(arrayBuffer);

        // Load PDF document with workers disabled for server-side
        const loadingTask = pdfjsLib.getDocument({
            data: typedArray,
            disableWorker: true,
            useWorkerFetch: false,
            isEvalSupported: false,
            useSystemFonts: true,
        });

        const pdfDocument = await loadingTask.promise;
        let extractedText = '';

        for (let pageNum = 1; pageNum <= pdfDocument.numPages; pageNum++) {
            try {
                const page = await pdfDocument.getPage(pageNum);
                const textContent = await page.getTextContent();
                const pageText = textContent.items
                    .map((item: any) => item.str || '')
                    .join(' ');
                extractedText += pageText + '\n\n';
            } catch (err) {
                console.warn(`Skipping page ${pageNum} due to error:`, err);
            }
        }

        await pdfDocument.destroy();

        const cleanedText = extractedText.trim();
        if (!cleanedText || cleanedText.length < 50) {
            return NextResponse.json({ error: 'No readable text found in PDF.' }, { status: 400 });
        }

        return NextResponse.json({ success: true, text: cleanedText });

    } catch (error: any) {
        console.error('Server PDF Error:', error);
        return NextResponse.json(
            { error: `Server-side PDF processing failed: ${error.message || 'Unknown error'}` },
            { status: 500 }
        );
    }
}

export const dynamic = 'force-dynamic';
