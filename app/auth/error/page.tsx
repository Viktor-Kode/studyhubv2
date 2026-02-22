export default function ErrorPage({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) {
  const error = typeof searchParams?.error === 'string' ? searchParams.error : ''
  return (
    <div style={{ maxWidth: 480, margin: '80px auto', padding: 24 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>Authentication Error</h1>
      <p style={{ marginBottom: 8 }}>{error || 'An error occurred during sign in.'}</p>
      <ul style={{ margin: '12px 0', paddingLeft: 18 }}>
        <li>Ensure Google OAuth credentials are configured.</li>
        <li>Set NEXTAUTH_URL to your site URL.</li>
        <li>Set NEXTAUTH_SECRET.</li>
        <li>Google callback URL: /api/auth/callback/google</li>
      </ul>
      <a href="/auth/login" style={{ color: '#2563eb' }}>Back to login</a>
    </div>
  )
}

