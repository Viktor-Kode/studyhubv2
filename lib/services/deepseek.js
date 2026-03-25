import { apiClient } from '@/lib/api/client'

/**
 * Ask StudyHelp questions using the existing DeepSeek-backed endpoint.
 * The backend currently exposes this via POST /api/backend/ai/chat.
 */
export async function deepseekAsk({ message, systemPrompt, chatHistory = [] }) {
  const payloadChatHistory = Array.isArray(chatHistory)
    ? chatHistory.map((m) => ({ role: m.role, content: m.content }))
    : []

  const res = await apiClient.post('/ai/chat', {
    message,
    context: systemPrompt || '',
    chatHistory: payloadChatHistory,
  })

  return res.data?.reply || res.data?.message || ''
}

