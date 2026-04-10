import * as pdfjsLib from 'pdfjs-dist';
import type { PDFDocumentProxy } from 'pdfjs-dist';

// Configure worker — must match installed pdfjs-dist (cdnjs "pdf.js" path 404s for v5; use npm layout)
if (typeof window !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
}

interface ExtractionResult {
    success: boolean;
    text?: string;
    error?: string;
    pageCount?: number;
}

const PAGE_BATCH_SIZE = 6;

async function extractPageText(pdf: PDFDocumentProxy, pageNum: number): Promise<string> {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();

    const pageText = textContent.items
        .map((item: { str?: string }) => ('str' in item && item.str ? item.str : ''))
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();

    return pageText;
}

/**
 * Robust PDF text extraction using pdfjs-dist.
 * Pages are processed in small parallel batches so multi-page PDFs finish much faster than strict sequential extraction.
 */
export async function extractPDFText(file: File): Promise<ExtractionResult> {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);

        const loadingTask = pdfjsLib.getDocument({
            data: uint8Array,
            cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/cmaps/`,
            cMapPacked: true,
            standardFontDataUrl: `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/standard_fonts/`,
            verbosity: 0,
        });

        const pdf = await loadingTask.promise;
        const numPages = pdf.numPages;
        const pageTextsOrdered: string[] = new Array(numPages);

        for (let start = 1; start <= numPages; start += PAGE_BATCH_SIZE) {
            const end = Math.min(start + PAGE_BATCH_SIZE - 1, numPages);
            const batch = [];
            for (let p = start; p <= end; p++) {
                batch.push(
                    extractPageText(pdf, p).then((text) => {
                        pageTextsOrdered[p - 1] = text;
                    })
                );
            }
            await Promise.all(batch);
        }

        let fullText = '';
        for (let i = 0; i < pageTextsOrdered.length; i++) {
            const pageText = pageTextsOrdered[i];
            if (pageText) {
                fullText += pageText + '\n\n';
            }
        }

        await pdf.destroy();

        const cleanedText = fullText.trim();

        if (!cleanedText || cleanedText.length < 100) {
            return {
                success: false,
                error: 'PDF contains insufficient readable text. This may be a scanned document or image-based PDF. Please try:\n1. Converting to .txt or .docx \n2. Using OCR software first \n3. Copying and pasting the text directly',
                pageCount: numPages
            };
        }

        return {
            success: true,
            text: cleanedText,
            pageCount: numPages
        };

    } catch (error: unknown) {
        const err = error as { name?: string; message?: string };
        if (typeof console !== 'undefined' && console.error) {
            console.error('[pdfExtractor]', err?.name, err?.message, error);
        }

        let errorMessage = 'Unable to read this PDF file. ';

        if (err.name === 'InvalidPDFException') {
            errorMessage += 'The file appears to be corrupted or not a valid PDF.';
        } else if (err.name === 'PasswordException') {
            errorMessage += 'This PDF is password-protected. Please remove the password first.';
        } else if (err.message?.includes('Missing PDF')) {
            errorMessage += 'The file may be corrupted.';
        } else if (
            /worker|fetch|network|load|CORS|Failed to fetch/i.test(String(err.message || ''))
        ) {
            errorMessage +=
                'The PDF viewer worker could not load (network or browser restriction). Check your connection, disable strict blockers for this site, or try again.';
        } else {
            errorMessage += 'Please try converting to .txt or .docx format instead.';
        }

        return {
            success: false,
            error: errorMessage
        };
    }
}
