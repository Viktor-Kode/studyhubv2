/**
 * Utility to extract text from various file formats.
 * Handles PDF (Client-side and Server-side fallback), DOCX, TXT, and MD.
 */

/**
 * Client-side PDF extraction using pdfjs-dist.
 */
export const extractTextFromPDFClient = async (file: File): Promise<string> => {
    try {
        const pdfjsLib = await import('pdfjs-dist');

        // Use a reliable worker source from CDN to avoid build-time issues
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

        const arrayBuffer = await file.arrayBuffer();
        const typedArray = new Uint8Array(arrayBuffer);

        const loadingTask = pdfjsLib.getDocument({
            data: typedArray,
            useWorkerFetch: false,
            isEvalSupported: false,
            useSystemFonts: true,
        });

        const pdf = await loadingTask.promise;
        let fullText = '';

        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            const pageText = content.items
                .map((item: any) => item.str || '')
                .join(' ');
            fullText += pageText + '\n\n';
        }

        await pdf.destroy();

        const cleanText = fullText.trim();
        if (cleanText.length < 50) {
            throw new Error('PDF appears to be empty or scanned. No readable text found.');
        }

        return cleanText;
    } catch (error: any) {
        console.error('Client-side PDF extraction error:', error);
        throw error;
    }
};

/**
 * Server-side fallback for PDF extraction via API.
 */
export const extractTextFromPDFViaAPI = async (file: File): Promise<string> => {
    try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/extract-pdf', {
            method: 'POST',
            body: formData,
        });

        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
            throw new Error('Server returned an invalid response. Using client-side extraction instead.');
        }

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'PDF extraction failed');
        }

        return data.text;
    } catch (error: any) {
        console.error('PDF API extraction error:', error);
        throw error;
    }
};

/**
 * DOCX extraction using mammoth.
 */
export const extractTextFromDOCX = async (file: File): Promise<string> => {
    try {
        const mammoth = await import('mammoth');
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });

        if (!result.value || result.value.trim().length < 50) {
            throw new Error('DOCX file appears to be empty or contains no readable text');
        }

        return result.value;
    } catch (error: any) {
        console.error('DOCX extraction error:', error);
        throw new Error('Failed to extract text from Word document.');
    }
};

/**
 * Main entry point for file extraction.
 */
export const extractTextFromFile = async (file: File): Promise<string> => {
    const extension = file.name.split('.').pop()?.toLowerCase();

    switch (extension) {
        case 'pdf':
            try {
                // Try client-side first as it's faster and reduces server load
                return await extractTextFromPDFClient(file);
            } catch (err) {
                console.warn('Client-side extraction failed, falling back to API:', err);
                return await extractTextFromPDFViaAPI(file);
            }
        case 'docx':
            return await extractTextFromDOCX(file);
        case 'txt':
        case 'md':
            try {
                const text = await file.text();
                if (text.trim().length < 50) throw new Error('File content is too short');
                return text;
            } catch (err) {
                throw new Error('Unable to read text file');
            }
        default:
            throw new Error(`Unsupported format (.${extension}). Please use PDF, DOCX, TXT, or MD.`);
    }
};
