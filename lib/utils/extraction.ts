if (typeof globalThis.DOMMatrix === 'undefined') {
  globalThis.DOMMatrix = class DOMMatrix {
    constructor() {
      this.a = 1; this.b = 0;
      this.c = 0; this.d = 1;
      this.e = 0; this.f = 0;
    }
  };
}

if (typeof globalThis.DOMRect === 'undefined') {
  globalThis.DOMRect = class DOMRect {
    constructor(x = 0, y = 0, width = 0, height = 0) {
      this.x = x; this.y = y;
      this.width = width;
      this.height = height;
    }
  };
}

/**
 * Utility to extract text from various file formats.
 * All extraction happens client-side.
 */

import { PDF_WORKER_PUBLIC_PATH } from '@/lib/utils/pdfWorkerSrc';

/**
 * Client-side PDF extraction using pdfjs-dist.
 */
export const extractTextFromPDFClient = async (file: File): Promise<string> => {
    try {
        const pdfjsLib = await import('pdfjs-dist');

        pdfjsLib.GlobalWorkerOptions.workerSrc = PDF_WORKER_PUBLIC_PATH;

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
        if (cleanText.length < 10) {
            throw new Error('CLIENT_EMPTY_TEXT');
        }
        return cleanText;
    } catch (error: any) {
        console.error('Client-side PDF extraction error:', error);
        throw error;
    }
};

/**
 * Server-side fallback for PDF extraction via API.
 * @deprecated Prefer client-side extraction.
 */
export const extractTextFromPDFViaAPI = async (file: File): Promise<string> => {
    try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/extract-pdf', {
            method: 'POST',
            body: formData,
        });

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
        const mammothModule = await import('mammoth');
        const mammoth = (mammothModule as any).default || mammothModule;
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });

        return result.value;
    } catch (error: any) {
        console.error('DOCX extraction error:', error);
        throw new Error('Could not read this file. Try a different format or paste your text directly.');
    }
};

/**
 * PPTX extraction using JSZip.
 */
export const extractTextFromPPTX = async (file: File): Promise<string> => {
    try {
        const JSZip = (await import('jszip')).default;
        const arrayBuffer = await file.arrayBuffer();
        const zip = await JSZip.loadAsync(arrayBuffer);
        const slideFiles = Object.keys(zip.files).filter(f => f.includes('ppt/slides/slide'));
        
        let text = '';
        for (const slideFile of slideFiles) {
            const content = await zip.files[slideFile].async('text');
            const matches = content.match(/<a:t>(.*?)<\/a:t>/g) || [];
            text += matches.map(m => m.replace(/<\/?a:t>/g, '')).join(' ') + '\n';
        }

        return text;
    } catch (error: any) {
        console.error('PPTX extraction error:', error);
        throw new Error('Could not read this file. Try a different format or paste your text directly.');
    }
};

/**
 * Image OCR using Tesseract.js.
 */
export const extractTextFromImageOCR = async (file: File): Promise<string> => {
    try {
        const Tesseract = (await import('tesseract.js')).default;
        const { data: { text } } = await Tesseract.recognize(file, 'eng');

        return text;
    } catch (error: any) {
        console.error('OCR extraction error:', error);
        throw new Error('Could not read this file. Try a different format or paste your text directly.');
    }
};

/**
 * Main entry point for file extraction.
 */
export const extractTextFromFile = async (file: File): Promise<string> => {
    const extension = file.name.split('.').pop()?.toLowerCase();

    try {
        switch (extension) {
            case 'pdf':
                try {
                    return await extractTextFromPDFClient(file);
                } catch (clientErr) {
                    console.warn('Client-side PDF extraction failed, falling back to API...', clientErr);
                    return await extractTextFromPDFViaAPI(file);
                }
            case 'docx':
            case 'doc':
                return await extractTextFromDOCX(file);
            case 'pptx':
            case 'ppt':
                return await extractTextFromPPTX(file);
            case 'txt':
            case 'md':
                return await file.text();
            case 'jpg':
            case 'jpeg':
            case 'png':
            case 'webp':
                return await extractTextFromImageOCR(file);
            default:
                throw new Error(`Unsupported format (.${extension}).`);
        }
    } catch (err: any) {
        console.error(`Extraction failed for ${extension}:`, err);
        const msg = err.message || '';
        if (msg.includes('EMPTY_TEXT') || msg.includes('No readable text')) {
            throw new Error('This document appears to be empty or contains only images/scans. Please try a text-based PDF or paste your text directly.');
        }
        throw new Error(msg.includes('Could not read') ? msg : 'Could not read this file. Try a different format or paste your text directly.');
    }
};
