import { NextRequest, NextResponse } from 'next/server';
import { createRequire } from 'module';

/**
 * Server-side PDF extraction API route.
 * Optimized for v5, with magic-byte validation and scanned-document detection (422).
 */

const require = createRequire(import.meta.url);

// Polyfill DOMMatrix for PDF.js v5 in Node.js
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

        // 1. Validate magic bytes (%PDF)
        const isPDF = buffer.slice(0, 4).toString() === "%PDF";
        if (!isPDF) {
            return NextResponse.json({ error: "The uploaded file is not a valid PDF document." }, { status: 400 });
        }

        // Size guard (10MB)
        if (buffer.length > 10 * 1024 * 1024) {
            return NextResponse.json({ error: "PDF is too large for processing (Max 10MB)" }, { status: 413 });
        }

        // Load PDF.js (v5 compatible)
        let pdfjsLib;
        try {
            pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');
            pdfjsLib.GlobalWorkerOptions.workerSrc = ""; 
        } catch (e) {
            pdfjsLib = await import('pdfjs-dist');
            if (pdfjsLib.GlobalWorkerOptions) pdfjsLib.GlobalWorkerOptions.workerSrc = "";
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
                extractedText += pageText + ' ';
            } catch (err) {
                console.error(`Page ${pageNum} error:`, err);
            }
        }

        await pdfDocument.destroy();

        const cleanedText = extractedText.trim();
        
        // 2. Check for empty text (Scanned Document Detection)
        if (!cleanedText || cleanedText.length < 50) {
            return NextResponse.json(
                { 
                    error: "This PDF appears to be image-based (scanned) or has no extractable text layer.",
                    suggestion: "Please export as a standard .docx or .txt file, or use an online OCR tool before uploading.",
                    code: 'SCANNED_PDF'
                }, 
                { status: 422 }
            );
        }

        return NextResponse.json({
            success: true,
            text: cleanedText,
            pages: pdfDocument.numPages
        });

    } catch (err: any) {
        console.error("PDF API Error:", err?.message);
        return NextResponse.json(
            { error: "Server failed to process PDF. Try converting to .docx or .txt format." },
            { status: 500 }
        );
    }
}

export const dynamic = 'force-dynamic';
export const maxDuration = 60;
