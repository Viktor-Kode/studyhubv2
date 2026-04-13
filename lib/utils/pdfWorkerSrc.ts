/**
 * PDF.js worker — using unpkg CDN for matching version to avoid bundling issues in serverless environments like Vercel.
 */
// Use hardcoded version matching package.json to prevent dynamic resolution failure loops
export const PDF_WORKER_VERSION = '5.6.205';
export const PDF_WORKER_PUBLIC_PATH = `https://unpkg.com/pdfjs-dist@${PDF_WORKER_VERSION}/build/pdf.worker.min.mjs`;
