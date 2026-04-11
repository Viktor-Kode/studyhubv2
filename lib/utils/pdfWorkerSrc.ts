/**
 * PDF.js worker — using unpkg CDN for matching version to avoid bundling issues in serverless environments like Vercel.
 */
import { version } from 'pdfjs-dist'
export const PDF_WORKER_PUBLIC_PATH = `https://unpkg.com/pdfjs-dist@${version}/build/pdf.worker.min.mjs`
