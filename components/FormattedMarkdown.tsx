'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

/**
 * Pre-processes markdown text to ensure table rows collapsed into a single line
 * (e.g. '| col1 | col2 | |---|---| | val1 | val2 |') get expanded with newlines.
 */
export function formatMarkdownTables(content: string): string {
  if (!content) return ''
  let text = content
  // 1. Replace consecutive row boundaries like '| |' or '|  |' with '|\n|'
  text = text.replace(/\|\s*\|/g, '|\n|')
  // 2. Ensure newline before header divider row like '|---|---|' if missing
  text = text.replace(/([^\n])\s*(\|(?:[\s:-]*\|)+)/g, '$1\n$2')
  // 3. Ensure newline after header divider row if missing
  text = text.replace(/(\|(?:[\s:-]*\|)+)\s*([^\n])/g, '$1\n$2')
  return text
}

export const markdownComponents = {
  table: ({ node, ...props }: any) => (
    <div className="overflow-x-auto my-6 rounded-xl border border-gray-200 dark:border-gray-700/80 shadow-sm bg-white dark:bg-gray-800/90">
      <table className="w-full text-left border-collapse border-spacing-0" {...props} />
    </div>
  ),
  thead: ({ node, ...props }: any) => (
    <thead className="bg-gray-100 dark:bg-gray-700/90 text-gray-900 dark:text-white font-extrabold text-xs uppercase tracking-wider border-b border-gray-200 dark:border-gray-700" {...props} />
  ),
  tbody: ({ node, ...props }: any) => (
    <tbody className="divide-y divide-gray-200 dark:divide-gray-700/60" {...props} />
  ),
  tr: ({ node, ...props }: any) => (
    <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors" {...props} />
  ),
  th: ({ node, ...props }: any) => (
    <th className="px-4 py-3 sm:px-5 sm:py-3.5 font-extrabold text-gray-900 dark:text-white border-r last:border-r-0 border-gray-200 dark:border-gray-700 text-xs sm:text-sm" {...props} />
  ),
  td: ({ node, ...props }: any) => (
    <td className="px-4 py-3 sm:px-5 sm:py-3.5 text-gray-700 dark:text-gray-300 border-r last:border-r-0 border-gray-100 dark:border-gray-800 text-xs sm:text-sm font-medium leading-relaxed" {...props} />
  ),
}

interface FormattedMarkdownProps {
  content: string
  className?: string
}

export default function FormattedMarkdown({ content, className = '' }: FormattedMarkdownProps) {
  const formatted = formatMarkdownTables(content)
  return (
    <div className={className}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
        {formatted}
      </ReactMarkdown>
    </div>
  )
}
