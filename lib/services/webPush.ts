import { apiClient } from '@/lib/api/client'

type PushConfig = { pushConfigured?: boolean; publicKey?: string | null }

export async function getWebPushPublicKey(): Promise<string> {
  const { data } = await apiClient.get<PushConfig>('/notifications/config')
  if (!data?.pushConfigured || !data.publicKey) {
    throw new Error('Push notifications are not configured on the server.')
  }
  return data.publicKey
}

export function base64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  return Uint8Array.from(rawData, (character) => character.charCodeAt(0))
}
