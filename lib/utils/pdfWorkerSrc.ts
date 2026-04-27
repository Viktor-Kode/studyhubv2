/**
 * PDF.js worker — dynamically imported and bundled locally by Webpack/Next.js
 * This guarantees the worker is always the exact same version as the installed react-pdf package,
 * and eliminates any external CDN dependency or 404/CORS errors.
 */
export const PDF_WORKER_PUBLIC_PATH = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();
