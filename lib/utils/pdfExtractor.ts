import * as pdfjsLib from 'pdfjs-dist';

// Configure worker - MUST be done before any PDF operations
if (typeof window !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
}

interface ExtractionResult {
    success: boolean;
    text?: string;
    error?: string;
    pageCount?: number;
}

/**
 * Robust PDF text extraction using pdfjs-dist.
 */
export async function extractPDFText(file: File): Promise<ExtractionResult> {
    try {
        console.log('Starting PDF extraction for:', file.name);

        // Read file as ArrayBuffer
        const arrayBuffer = await file.arrayBuffer();
        console.log('File read successfully, size:', arrayBuffer.byteLength);

        // Convert to Uint8Array
        const uint8Array = new Uint8Array(arrayBuffer);

        // Load PDF document with specific options
        const loadingTask = pdfjsLib.getDocument({
            data: uint8Array,
            cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/cmaps/`,
            cMapPacked: true,
            standardFontDataUrl: `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/standard_fonts/`,
            verbosity: 0,
        });

        console.log('Loading PDF document...');
        const pdf = await loadingTask.promise;
        console.log('PDF loaded successfully, pages:', pdf.numPages);

        let fullText = '';
        const pageTexts: string[] = [];

        // Extract text from each page
        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            try {
                const page = await pdf.getPage(pageNum);
                const textContent = await page.getTextContent();

                const pageText = textContent.items
                    .map((item: any) => {
                        // Handle both text items and whitespace
                        if ('str' in item) {
                            return item.str;
                        }
                        return '';
                    })
                    .join(' ')
                    .replace(/\s+/g, ' ') // Normalize whitespace
                    .trim();

                if (pageText) {
                    pageTexts.push(pageText);
                    fullText += pageText + '\n\n';
                }

                console.log(`Page ${pageNum} extracted: ${pageText.length} characters`);

            } catch (pageError) {
                console.error(`Error extracting page ${pageNum}:`, pageError);
                // Continue with other pages
            }
        }

        // Clean up
        await pdf.destroy();

        const cleanedText = fullText.trim();
        console.log('Total extracted text length:', cleanedText.length);

        // Validate extraction
        if (!cleanedText || cleanedText.length < 100) {
            return {
                success: false,
                error: 'PDF contains insufficient readable text. This may be a scanned document or image-based PDF. Please try:\n1. Converting to .txt or .docx \n2. Using OCR software first \n3. Copying and pasting the text directly',
                pageCount: pdf.numPages
            };
        }

        return {
            success: true,
            text: cleanedText,
            pageCount: pdf.numPages
        };

    } catch (error: any) {
        console.error('PDF extraction failed:', error);

        let errorMessage = 'Unable to read this PDF file. ';

        if (error.name === 'InvalidPDFException') {
            errorMessage += 'The file appears to be corrupted or not a valid PDF.';
        } else if (error.name === 'PasswordException') {
            errorMessage += 'This PDF is password-protected. Please remove the password first.';
        } else if (error.message?.includes('Missing PDF')) {
            errorMessage += 'The file may be corrupted.';
        } else {
            errorMessage += 'Please try converting to .txt or .docx format instead.';
        }

        return {
            success: false,
            error: errorMessage
        };
    }
}
