import { NextRequest, NextResponse } from 'next/server';
import { createRequire } from 'module';

/**
 * Server-side PDF extraction API route.
 * Optimized for Vercel/Serverless environments with:
 * 1. Memory/Size Guard (10MB)
 * 2. CJS build of pdfjs-dist for stability
 * 3. Fully awaited buffer reading 
 * 4. Detailed error logging
 */

const require = createRequire(import.meta.url);

// Polyfill DOMMatrix and Path2D for PDF.js v4+ in Node.js
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
if (typeof global.Path2D === 'undefined') {
    (global as any).Path2D = class Path2D {
        addPath() {}
        closePath() {}
        moveTo() {}
        lineTo() {}
        bezierCurveTo() {}
        quadraticCurveTo() {}
        arc() {}
        arcTo() {}
        ellipse() {}
        rect() {}
    };
}

export async function POST(request: NextRequest) {
    try {
        // Read file from FormData
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        // 2. Fully await the file buffer reading
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // 4. Memory/Size guard
        if (buffer.length > 10 * 1024 * 1024) {
            return NextResponse.json(
                { error: "File too large for server-side extraction (Max 10MB)" }, 
                { status: 413 }
            );
        }

        // 3. Load pdfjs-dist legacy build with workers disabled
        let pdfjsLib;
        try {
            pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');
            // Disable worker - requested for same-process server execution
            pdfjsLib.GlobalWorkerOptions.workerSrc = ""; 
        } catch (e) {
            pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
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
                console.warn(`[PDF] Error on page ${pageNum}:`, err);
            }
        }

        await pdfDocument.destroy();

        const cleanedText = extractedText.trim();
        if (!cleanedText || cleanedText.length < 50) {
            return NextResponse.json(
                { error: 'PDF appears to be scanned or empty. No text found.' }, 
                { status: 400 }
            );
        }

        return NextResponse.json({
            success: true,
            text: cleanedText,
            pages: pdfDocument.numPages
        });

    } catch (err: any) {
        // 1. Detailed error logging
        console.error("PDF extraction error:", err?.message, err?.stack);
        
        return NextResponse.json(
            { 
                error: (err?.message || "PDF extraction failed").replace(/DOMMatrix is not defined/i, "System environment issue"),
                details: err?.message
            },
            { status: 500 }
        );
    }
}

export const dynamic = 'force-dynamic';
export const maxDuration = 60;
