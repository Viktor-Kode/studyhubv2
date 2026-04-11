import { extractPDFText } from './pdfExtractor';
import mammoth from 'mammoth';

export interface FileExtractionResult {
    success: boolean;
    text?: string;
    error?: string;
    fileType?: string;
}

/**
 * Main file extraction coordinator supporting PDF, DOCX, TXT, and MD.
 */
export async function extractTextFromFile(file: File): Promise<FileExtractionResult> {
    const extension = file.name.split('.').pop()?.toLowerCase();

    try {
        switch (extension) {
            case 'pdf':
                console.log('Extracting PDF (client-side)...');
                const pdfResult = await extractPDFText(file);
                
                if (pdfResult.success) {
                    return {
                        ...pdfResult,
                        fileType: 'PDF'
                    };
                }

                // If client-side fails (common on mobile), try server-side fallback
                console.warn('Client-side PDF extraction failed, attempting server-side fallback...', pdfResult.error);
                
                try {
                    const formData = new FormData();
                    formData.append('file', file);
                    
                    const response = await fetch('/api/extract-pdf', {
                        method: 'POST',
                        body: formData,
                    });

                    if (response.ok) {
                        const data = await response.json();
                        console.log('Server-side PDF extraction successful');
                        return {
                            success: true,
                            text: data.text,
                            fileType: 'PDF'
                        };
                    } else {
                        const errorData = await response.json().catch(() => ({}));
                        
                        // Handle scanned PDFs (422) with helpful advice
                        if (response.status === 422) {
                            return {
                                success: false,
                                error: errorData.error || 'This PDF appears to be a scanned image with no readable text layer.',
                                fileType: 'PDF'
                            };
                        }

                        console.error('Server-side PDF extraction failed:', errorData.error);
                        
                        // Return the actual server error to the UI
                        return {
                            success: false,
                            error: errorData.error || 'The server could not read this PDF. Please try converting it to .docx or .txt.',
                            fileType: 'PDF'
                        };
                    }
                } catch (fallbackError: any) {
                    console.error('PDF fallback error:', fallbackError);
                    return {
                        success: false,
                        error: 'Network error during PDF processing. Please check your connection.',
                        fileType: 'PDF'
                    };
                }

            case 'docx':
                console.log('Extracting DOCX...');
                const arrayBuffer = await file.arrayBuffer();
                const result = await mammoth.extractRawText({ arrayBuffer });

                if (!result.value || result.value.trim().length < 50) {
                    return {
                        success: false,
                        error: 'Word document appears to be empty or contains too little text.',
                        fileType: 'DOCX'
                    };
                }

                return {
                    success: true,
                    text: result.value.trim(),
                    fileType: 'DOCX'
                };

            case 'ppt':
            case 'pptx':
                console.log('Extracting Presentation...');
                const formData = new FormData();
                formData.append('file', file);

                try {
                    const response = await fetch('/api/extract-ppt', {
                        method: 'POST',
                        body: formData,
                    });

                    if (!response.ok) {
                        const errorData = await response.json().catch(() => ({}));
                        throw new Error(errorData.error || errorData.message || 'Failed to extract text via API');
                    }

                    const data = await response.json();

                    if (!data.text || data.text.trim().length < 50) {
                        return {
                            success: false,
                            error: 'Presentation appears empty or contains too little text.',
                            fileType: extension.toUpperCase()
                        };
                    }

                    return {
                        success: true,
                        text: data.text.trim(),
                        fileType: extension.toUpperCase()
                    };
                } catch (apiError: any) {
                    console.error('PPT API Error:', apiError);
                    return {
                        success: false,
                        error: apiError.message || 'Failed to process presentation file.',
                        fileType: extension.toUpperCase()
                    };
                }

            case 'txt':
            case 'md':
                console.log('Extracting text file...');
                const text = await file.text();

                if (!text || text.trim().length < 50) {
                    return {
                        success: false,
                        error: 'Text file appears to be empty or too short.',
                        fileType: extension.toUpperCase()
                    };
                }

                return {
                    success: true,
                    text: text.trim(),
                    fileType: extension.toUpperCase()
                };

            default:
                return {
                    success: false,
                    error: `Unsupported file format: .${extension}. Please use PDF, DOCX, TXT, or MD files.`,
                    fileType: extension?.toUpperCase()
                };
        }
    } catch (error: any) {
        console.error('File extraction error:', error);
        return {
            success: false,
            error: error.message || 'Failed to extract text from file.',
            fileType: extension?.toUpperCase()
        };
    }
}
