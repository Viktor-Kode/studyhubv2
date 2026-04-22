import * as pdfjsLib from 'pdfjs-dist';
import type { PDFDocumentProxy } from 'pdfjs-dist';

// Use CDN-hosted worker — requested for Vercel/serverless stability
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
 * Includes OCR fallback for scanned/handwritten documents using Tesseract.js.
 */
export async function extractPDFText(file: File, onProgress?: (msg: string) => void): Promise<ExtractionResult> {
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

        onProgress?.(`Parsing ${numPages} PDF pages...`);

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

        const cleanedText = fullText.trim();

        // IF NO TEXT FOUND (SCANNED PDF), TRY OCR FALLBACK
        if (!cleanedText || cleanedText.length < 50) {
            onProgress?.('No text layer found. Attempting OCR (Optical Character Recognition)...');
            console.log('[pdfExtractor] No text found, starting OCR fallback...');
            
            const { createWorker } = await import('tesseract.js');
            const worker = await createWorker('eng');
            
            let ocrFullText = '';
            
            // Limit OCR to first 10 pages to avoid crashing/hanging on large scans
            const ocrLimit = Math.min(numPages, 10);
            
            for (let p = 1; p <= ocrLimit; p++) {
                onProgress?.(`Performing OCR on page ${p} of ${ocrLimit}...`);
                const page = await pdf.getPage(p);
                const viewport = page.getViewport({ scale: 2.0 }); // Higher scale for better OCR
                
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                canvas.height = viewport.height;
                canvas.width = viewport.width;

                if (context) {
                    await page.render({ canvasContext: context, viewport }).promise;
                    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
                    const result = await worker.recognize(dataUrl);
                    ocrFullText += result.data.text + '\n\n';
                }
            }
            
            await worker.terminate();
            await pdf.destroy();

            const cleanedOcrText = ocrFullText.trim();
            if (!cleanedOcrText || cleanedOcrText.length < 50) {
                return {
                    success: false,
                    error: 'This PDF appears to be a scan or handwritten document, and OCR could not read it clearly. Please try a clearer document.',
                    pageCount: numPages
                };
            }

            return {
                success: true,
                text: cleanedOcrText,
                pageCount: numPages
            };
        }

        await pdf.destroy();

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
