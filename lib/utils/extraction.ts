/**
 * Utility to extract text from various file formats.
 * Handles PDF, DOCX, TXT, and MD.
 */

export const extractTextFromPDF = async (file: File): Promise<string> => {
    try {
        // Lazy load pdfjs-dist
        const pdfjsLib = await import('pdfjs-dist');

        // Use unpkg path for worker logic for better compatibility
        const PDFJS_VERSION = '3.11.174';
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${PDFJS_VERSION}/build/pdf.worker.min.js`;

        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({
            data: arrayBuffer,
            verbosity: 0,
        }).promise;

        let fullText = '';

        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            const page = await pdf.getPage(pageNum);
            const textContent = await page.getTextContent();
            const pageText = textContent.items
                .map((item: any) => {
                    if ('str' in item) return item.str;
                    return '';
                })
                .join(' ');
            fullText += pageText + '\n';
        }

        if (fullText.trim().length < 100) {
            throw new Error('PDF contains insufficient text. It may be scanned or image-based.');
        }

        return fullText.trim();
    } catch (error: any) {
        console.error('PDF Error:', error);

        if (error.message.includes('insufficient text')) {
            throw new Error('This PDF appears to be scanned. Please convert to .txt or .docx, or use OCR software first.');
        }

        throw new Error('Unable to read this PDF. Try using .txt or .docx format instead.');
    }
};

export const extractTextFromDOCX = async (file: File): Promise<string> => {
    try {
        const mammoth = await import('mammoth');
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        return result.value;
    } catch (error) {
        console.error('DOCX extraction error:', error);
        throw new Error('Unable to read Word document. Please ensure it\'s a valid .docx file.');
    }
};

export const extractTextFromText = async (file: File): Promise<string> => {
    try {
        return await file.text();
    } catch (error) {
        console.error('Text extraction error:', error);
        throw new Error('Unable to read file. Please check the file encoding.');
    }
};

export const extractTextFromFile = async (file: File): Promise<string> => {
    const extension = file.name.split('.').pop()?.toLowerCase();

    switch (extension) {
        case 'pdf':
            return await extractTextFromPDF(file);
        case 'docx':
            return await extractTextFromDOCX(file);
        case 'txt':
        case 'md':
            return await extractTextFromText(file);
        default:
            throw new Error('Unsupported file format');
    }
};
