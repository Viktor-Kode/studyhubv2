/**
 * Copy pdf.worker.min.mjs next to the app so GlobalWorkerOptions can use a same-origin URL.
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const src = path.join(root, 'node_modules', 'pdfjs-dist', 'build', 'pdf.worker.min.mjs')
const dest = path.join(root, 'public', 'pdf.worker.min.mjs')

if (!fs.existsSync(src)) {
  console.warn('[copy-pdf-worker] Skip: pdfjs-dist not installed yet (run npm install).')
  process.exit(0)
}

fs.mkdirSync(path.dirname(dest), { recursive: true })
fs.copyFileSync(src, dest)
console.log('[copy-pdf-worker] Copied pdf.worker.min.mjs to public/')
