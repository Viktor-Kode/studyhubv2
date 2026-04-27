import { pdfjs } from 'react-pdf';

/**
 * PDF.js worker — using unpkg CDN for matching version.
 * Next.js 15+ strict ESM resolution blocks local new URL() bundling for .mjs files.
 * The original 404 error occurred because it was requesting '.js' instead of '.mjs'.
 */
export const PDF_WORKER_PUBLIC_PATH = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
