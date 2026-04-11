import { NextRequest, NextResponse } from 'next/server';
import { createRequire } from 'module';

/**
 * Server-side PDF extraction API route.
 * Optimized for pdfjs-dist v4/v5 which moved legacy paths.
 */

const require = createRequire(import.meta.url);

// Polyfill DOMMatrix for PDF.js v5 in Node.js (Mandatory for text extraction in v5)
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
        const buffer = Buffer.from(arrayBuffer);

        // Size guard (10MB)
        if (buffer.length > 10 * 1024 * 1024) {
            return NextResponse.json({ error: "File too large (Max 10MB)" }, { status: 413 });
        }

        // Use standard import pattern for v4/v5
        let pdfjsLib;
        try {
            // Try to load the module directly
            pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');
        } catch (e) {
            // Fallback for different build systems
            pdfjsLib = await import('pdfjs-dist');
        }

        // Disable worker server-side
        if (pdfjsLib.GlobalWorkerOptions) {
            pdfjsLib.GlobalWorkerOptions.workerSrc = "";
        }

        const loadingTask = pdfjsLib.getDocument({
            data: new Uint8Array(buffer),
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
                console.error(`Page ${pageNum} error:`, err);
            }
        }

        await pdfDocument.destroy();

        const cleanedText = extractedText.trim();
        if (!cleanedText || cleanedText.length < 50) {
            return NextResponse.json({ error: 'No readable text found.' }, { status: 400 });
        }

        return NextResponse.json({ success: true, text: cleanedText });

    } catch (err: any) {
        console.error("PDF extraction error:", err?.message, err?.stack);
        return NextResponse.json(
            { error: "PDF extraction failed on server. Try converting to .txt/docx." },
            { status: 500 }
        );
    }
}

export const dynamic = 'force-dynamic';
export const maxDuration = 60;
