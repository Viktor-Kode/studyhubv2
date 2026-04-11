import { NextRequest, NextResponse } from 'next/server';

/**
 * Server-side PDF extraction API route.
 * Uses pdfjs-dist/legacy with workers disabled for Node.js environment.
 */
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
            disableWorker: true, // MUST be true for standard Node.js environments
            useWorkerFetch: false,
            isEvalSupported: false,
            useSystemFonts: true,
        });

        const pdfDocument = await loadingTask.promise;
        let extractedText = '';

        // Extract text from all pages
        for (let pageNum = 1; pageNum <= pdfDocument.numPages; pageNum++) {
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

        let errorMessage = 'Failed to extract text from PDF on server.';

        if (error.message?.includes('Invalid PDF')) {
            errorMessage = 'This file appears to be corrupted or not a valid PDF.';
        } else if (error.message?.includes('password')) {
            errorMessage = 'This PDF is password-protected. Please unlock it first.';
        } else {
            // Include details if available to help user debug
            errorMessage = `Unable to read this PDF on server: ${error.message || 'Unknown error'}. Try converting to .txt or .docx format.`;
        }

        return NextResponse.json(
            { error: errorMessage },
            { status: 500 }
        );
    }
}

export const dynamic = 'force-dynamic';
