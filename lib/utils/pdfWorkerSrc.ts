import { pdfjs } from 'react-pdf';

/**
 * PDF.js worker — using unpkg CDN for matching version to avoid bundling issues in serverless environments like Vercel.
 */
// Use dynamic version to prevent API vs Worker version mismatches
export const PDF_WORKER_PUBLIC_PATH = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;
