import { NextRequest, NextResponse } from 'next/server';

/**
 * Server-side PDF extraction API route.
 * Uses pdfjs-dist/legacy for better compatibility in server environments.
 */
export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        // Dynamic import of pdfjs-dist for server-side
        // Note: Using the legacy build is crucial for Node.js environments
        const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.js');

        const arrayBuffer = await file.arrayBuffer();
        const typedArray = new Uint8Array(arrayBuffer);

        // Load PDF document
        const loadingTask = pdfjsLib.getDocument({
            data: typedArray,
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
                    if ('str' in item) {
                        return item.str;
                    }
                    return '';
                })
                .join(' ');

            extractedText += pageText + '\n\n';
        }

        // Clean up
        await pdfDocument.destroy();

        if (!extractedText.trim() || extractedText.trim().length < 50) {
            return NextResponse.json(
                {
                    error: 'PDF appears to be empty or scanned. No readable text found. Please convert to .txt or .docx format.'
                },
                { status: 400 }
            );
        }

        return NextResponse.json({
            success: true,
            text: extractedText.trim(),
            pages: pdfDocument.numPages
        });

    } catch (error: any) {
        console.error('PDF extraction error:', error);

        let errorMessage = 'Failed to extract text from PDF.';

        if (error.message?.includes('Invalid PDF')) {
            errorMessage = 'This file appears to be corrupted or not a valid PDF.';
        } else if (error.message?.includes('password')) {
            errorMessage = 'This PDF is password-protected. Please unlock it first.';
        } else {
            errorMessage = 'Unable to read this PDF. Try converting to .txt or .docx format.';
        }

        return NextResponse.json(
            { error: errorMessage, details: error.message },
            { status: 500 }
        );
    }
}

// Next.js API route config
export const dynamic = 'force-dynamic';
