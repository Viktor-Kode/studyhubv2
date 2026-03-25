'use client'

export default function QuickReplies({ replies, onPick }) {
  if (!replies || replies.length === 0) return null

  return (
    <div className="mt-3 flex max-w-full gap-2 overflow-x-auto pb-1">
      {replies.map((r) => (
        <button
          key={r}
          type="button"
          onClick={() => onPick?.(r)}
          className="whitespace-nowrap rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition select-none"
        >
          {r}
        </button>
      ))}
    </div>
  )
}

