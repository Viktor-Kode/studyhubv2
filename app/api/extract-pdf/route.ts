import { NextRequest, NextResponse } from 'next/server';

/**
 * Server-side File Extraction Pipeline.
 * Handles PDF, DOCX, and TXT.
 * Uses dynamic import for pdfjs-dist v5 to avoid CJS/ESM requirement errors on Vercel.
 */

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

/**
 * Normalize and clean extracted text.
 */
function normalizeText(text: string) {
    return text
        .replace(/\r\n/g, "\n")
        .replace(/[^\S\n]+/g, " ")  // collapse multiple spaces
        .replace(/\n{3,}/g, "\n\n") // collapse excessive newlines
        .trim();
}

export async function POST(request: NextRequest) {
    let stage = "receiving_file";
    try {
        stage = "parsing_formdata";
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            throw new Error("No file was provided in the request.");
        }

        stage = "reading_buffer";
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        if (buffer.length === 0) {
            throw new Error("The uploaded file is empty.");
        }

        // 10MB Size Guard
        if (buffer.length > 10 * 1024 * 1024) {
            return NextResponse.json(
                { error: "File too large for server-side processing (Max 10MB)" }, 
                { status: 413 }
            );
        }

        const fileName = file.name.toLowerCase();
        let extractedText = "";

        if (fileName.endsWith('.pdf')) {
            stage = "validating_pdf";
            const isPDF = buffer.slice(0, 4).toString() === "%PDF";
            if (!isPDF) throw new Error("File has mismatching extension; headers do not match %PDF magic bytes.");

            stage = "loading_pdf_engine";
            // Use dynamic import for ESM module compatibility on Vercel
            const pdfjsLib = await import('pdfjs-dist');
            
            // Disable worker for server-side execution
            if (pdfjsLib.GlobalWorkerOptions) {
                pdfjsLib.GlobalWorkerOptions.workerSrc = "";
            }

            stage = "extracting_pdf_text";
            const loadingTask = pdfjsLib.getDocument({
                data: new Uint8Array(buffer),
                disableWorker: true,
                useWorkerFetch: false,
                isEvalSupported: false,
                useSystemFonts: true,
            });

            const pdfDocument = await loadingTask.promise;
            
            for (let pageNum = 1; pageNum <= pdfDocument.numPages; pageNum++) {
                const page = await pdfDocument.getPage(pageNum);
                const textContent = await page.getTextContent();
                extractedText += textContent.items.map((item: any) => item.str || '').join(' ') + '\n\n';
            }
            await pdfDocument.destroy();

        } else if (fileName.endsWith('.docx')) {
            stage = "extracting_docx_text";
            const mammoth = await import('mammoth');
            const result = await mammoth.extractRawText({ buffer });
            extractedText = result.value;

        } else if (fileName.endsWith('.txt') || fileName.endsWith('.md')) {
            stage = "reading_plain_text";
            extractedText = buffer.toString('utf-8');

        } else {
            return NextResponse.json({ error: "Unsupported file type for server-side extraction." }, { status: 400 });
        }

        stage = "normalizing_text";
        const cleanedText = normalizeText(extractedText);

        if (!cleanedText || cleanedText.length < 20) {
            return NextResponse.json(
                { 
                    error: "No readable text found in document.",
                    suggestion: "The file might be a scan/image or corrupted.",
                    code: 'EMPTY_TEXT'
                }, 
                { status: 422 }
            );
        }

        console.log(`Pipeline success: Extracted ${cleanedText.length} characters from ${fileName}`);

        return NextResponse.json({
            success: true,
            text: cleanedText,
            fileName
        });

    } catch (err: any) {
        console.error(`Pipeline failed at stage [${stage}]:`, err?.message, err?.stack);
        
        return NextResponse.json(
            { 
                error: `Server failed during ${stage}: ${err?.message || 'Unknown processing error'}.`,
                details: err?.message 
            },
            { status: 500 }
        );
    }
}

export const dynamic = 'force-dynamic';
export const maxDuration = 60;
