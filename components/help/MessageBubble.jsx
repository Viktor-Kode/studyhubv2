'use client'

import React from 'react'
import ReactMarkdown from 'react-markdown'

export default function MessageBubble({ role, content }) {
  const isUser = role === 'user'

  return (
    <div className={`mb-3 flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={[
          'max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm',
          isUser
            ? 'bg-[#5B4CF5] text-white'
            : 'bg-gray-100 text-gray-900 border border-gray-200',
        ].join(' ')}
      >
        {isUser ? (
          <div className="whitespace-pre-wrap break-words">{content}</div>
        ) : (
          <div className="prose prose-sm max-w-none break-words">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  )
}

