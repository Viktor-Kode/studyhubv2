import { NextRequest, NextResponse } from 'next/server';
import { createRequire } from 'module';

/**
 * Server-side PDF extraction API route.
 * Uses CommonJS require for pdfjs-dist to avoid ESM worker bundling issues on Vercel.
 */

const require = createRequire(import.meta.url);

// Polyfill DOMMatrix for PDF.js v4+ in Node.js
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

        // Use CommonJS build which is often more stable for Node/Vercel environments
        // and doesn't trigger the ESM worker-loader issues as easily
        let pdfjsLib;
        try {
            pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');
        } catch (e) {
            // Fallback to MJS if CJS fails
            pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
        }

        const arrayBuffer = await file.arrayBuffer();
        const typedArray = new Uint8Array(arrayBuffer);

        // Explicitly disable workers for server-side
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
            { error: `Server-side PDF error: ${error.message || 'Unknown error'}` },
            { status: 500 }
        );
    }
}

export const dynamic = 'force-dynamic';
