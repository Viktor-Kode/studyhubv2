import { NextRequest, NextResponse } from 'next/server';

/**
 * Server-side PDF extraction API route.
 * Includes polyfills for browser APIs (like DOMMatrix) required by PDF.js v4+ in Node environments.
 */

// Polyfill DOMMatrix for PDF.js v4+ in Node.js
if (typeof global.DOMMatrix === 'undefined') {
    (global as any).DOMMatrix = class DOMMatrix {
        a = 1; b = 0; c = 0; d = 1; e = 0; f = 0;
        constructor(arg?: any) {
            if (typeof arg === 'string') { /* parse matrix string if needed */ }
        }
        static fromFloat32Array(array: Float32Array) { return new DOMMatrix(); }
        static fromFloat64Array(array: Float64Array) { return new DOMMatrix(); }
        multiply() { return this; }
        translate() { return this; }
        scale() { return this; }
        rotate() { return this; }
        inverse() { return this; }
        toString() { return `matrix(${this.a}, ${this.b}, ${this.c}, ${this.d}, ${this.e}, ${this.f})`; }
    };
}

// Polyfill Path2D just in case some PDFs trigger rendering logic paths
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
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        // Dynamic import of pdfjs-dist legacy build
        const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');

        const arrayBuffer = await file.arrayBuffer();
        const typedArray = new Uint8Array(arrayBuffer);

        // Load PDF document with workers disabled (required for Node.js)
        const loadingTask = pdfjsLib.getDocument({
            data: typedArray,
            disableWorker: true,
            useWorkerFetch: false,
            isEvalSupported: false,
            useSystemFonts: true,
            standardFontDataUrl: `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/standard_fonts/`,
        });

        const pdfDocument = await loadingTask.promise;
        let extractedText = '';

        // Extract text from all pages
        for (let pageNum = 1; pageNum <= pdfDocument.numPages; pageNum++) {
            try {
                const page = await pdfDocument.getPage(pageNum);
                const textContent = await page.getTextContent();

                const pageText = textContent.items
                    .map((item: any) => {
                        if (item && 'str' in item) {
                            return item.str;
                        }
                        return '';
                    })
                    .join(' ');

                extractedText += pageText + '\n\n';
            } catch (pageError: any) {
                console.error(`Error on page ${pageNum}:`, pageError);
                // Continue with other pages if one fails
            }
        }

        // Clean up
        await pdfDocument.destroy();

        const cleanedText = extractedText.trim();

        if (!cleanedText || cleanedText.length < 50) {
            return NextResponse.json(
                {
                    error: 'PDF appears to be empty or scanned (image-only). No readable text was found on the server.'
                },
                { status: 400 }
            );
        }

        return NextResponse.json({
            success: true,
            text: cleanedText,
            pages: pdfDocument.numPages
        });

    } catch (error: any) {
        console.error('Server PDF extraction error:', error);

        return NextResponse.json(
            { error: `Unable to read this PDF on server: ${error.message || 'Processing error'}. Try converting to .txt or .docx format.` },
            { status: 500 }
        );
    }
}

export const dynamic = 'force-dynamic';
