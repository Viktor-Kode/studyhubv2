import { getFirebaseToken } from '@/lib/store/authStore';

export interface EmailOptions {
  to: string;
  subject: string;
  html?: string;
  text?: string;
}

/**
 * Client-side helper to send emails via our authenticated proxy route.
 */
export async function sendEmail({
  to,
  subject,
  html,
  text,
}: EmailOptions) {
  // Wait for Firebase auth to be ready
  const token = await getFirebaseToken();
  if (!token) {
    throw new Error('Not authenticated');
  }

  const res = await fetch('/api/backend/send-email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ to, subject, html, text }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || 'Failed to send email');
  }

  return data;
}
