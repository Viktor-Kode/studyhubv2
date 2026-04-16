'use client';

import { useState } from 'react';
import { sendEmail } from '@/lib/emailClient';
import { useAuthStore } from '@/lib/store/authStore';
import ProtectedRoute from '@/components/ProtectedRoute';
import BackButton from '@/components/BackButton';
import { Mail, Send, CheckCircle2, AlertCircle } from 'lucide-react';

export default function EmailTestPage() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleTestEmail = async (useTemplate: boolean) => {
    if (!user?.email) return;
    setLoading(true);
    setStatus(null);

    try {
      const result = await sendEmail({
        to: user.email,
        subject: useTemplate ? 'Test: Welcome to StudyHelp' : 'Quick Test Email',
        text: 'This is a test email from your StudyHelp integration.',
        // @ts-ignore
        template: useTemplate ? 'welcome' : undefined,
        templateProps: useTemplate ? { name: user.name || 'Student' } : undefined,
      });

      console.log('Email sent:', result);
      setStatus({ type: 'success', message: 'Email sent successfully! Check your inbox (and spam folder).' });
    } catch (err: any) {
      console.error('Email failed:', err);
      setStatus({ type: 'error', message: err.message || 'Failed to send email' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="p-6 max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <BackButton />
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Mail className="text-primary" />
            Email Integration Test
          </h1>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700 shadow-sm">
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Use this page to verify that your <strong>Resend</strong> integration and <strong>API route</strong> are working correctly.
            The email will be sent to your account email: <code className="bg-gray-100 dark:bg-gray-900 px-2 py-1 rounded">{user?.email}</code>
          </p>

          {status && (
            <div className={`mb-6 p-4 rounded-xl flex items-start gap-3 ${
              status.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {status.type === 'success' ? <CheckCircle2 className="shrink-0 mt-0.5" size={18} /> : <AlertCircle className="shrink-0 mt-0.5" size={18} />}
              <p>{status.message}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => handleTestEmail(false)}
              disabled={loading}
              className="flex items-center justify-center gap-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-semibold py-4 px-6 rounded-xl transition-all disabled:opacity-50"
            >
              <Send size={18} />
              {loading ? 'Sending...' : 'Send Plain Text Test'}
            </button>

            <button
              onClick={() => handleTestEmail(true)}
              disabled={loading}
              className="flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white font-semibold py-4 px-6 rounded-xl shadow-lg shadow-primary/20 transition-all disabled:opacity-50"
            >
              <Mail size={18} />
              {loading ? 'Sending...' : 'Send Template Test'}
            </button>
          </div>

          <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
            <h4 className="text-blue-800 dark:text-blue-300 font-bold mb-2 flex items-center gap-2">
              <AlertCircle size={16} />
              Troubleshooting
            </h4>
            <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-2 list-disc ml-4">
              <li>Ensure <code>RESEND_API_KEY</code> is correctly set in <code>.env.local</code>.</li>
              <li>Restart your dev server (<code>npm run dev</code>) after updating environment variables.</li>
              <li>Verify that your <code>FROM_EMAIL</code> domain is verified in the Resend dashboard.</li>
              <li>Check the browser console and terminal logs for detailed error messages.</li>
            </ul>
          </div>
        </div>
      </div>

      <style jsx>{`
        .bg-primary { background-color: var(--primary-color, #275af5); }
        .bg-primary-dark { background-color: var(--primary-dark, #1e46c7); }
        .text-primary { color: var(--primary-color, #275af5); }
      `}</style>
    </ProtectedRoute>
  );
}
