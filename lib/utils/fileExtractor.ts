export interface FileExtractionResult {
    success: boolean;
    text?: string;
    error?: string;
    fileType?: string;
}

/**
 * DEPRECATED: Client-side extraction is disabled in favor of backend processing.
 * Use server-side extraction via LibraryDocument instead.
 */
export async function extractTextFromFile(file: File): Promise<FileExtractionResult> {
    console.warn('[extractTextFromFile] Client-side extraction is deprecated. File:', file.name);
    return {
        success: false,
        error: 'Client-side extraction is disabled. Please use server-side processing.',
        fileType: 'DISABLED'
    };
}
