/**
 * PDF.js worker must be same-origin: iOS Safari and some mobile browsers block or fail
 * loading workers from third-party CDNs (e.g. unpkg), while desktop Chrome often allows it.
 * The file is copied from `pdfjs-dist` into `/public/pdf.worker.min.mjs` on `npm install`.
 */
export const PDF_WORKER_PUBLIC_PATH = '/pdf.worker.min.mjs'
