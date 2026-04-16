'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { sendEmail } from '@/lib/emailClient';
import { useAuthStore } from '@/lib/store/authStore';
import ProtectedRoute from '@/components/ProtectedRoute';
import BackButton from '@/components/BackButton';
import { Mail, Send, CheckCircle2, AlertCircle, ShieldCheck, Zap } from 'lucide-react';

export default function AdminEmailTestPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Strict Admin Check
  useEffect(() => {
    if (user && user.role !== 'admin') {
      router.push('/dashboard');
    }
  }, [user, router]);

  if (!user || user.role !== 'admin') {
    return null; // Or a loading spinner
  }

  const handleTestEmail = async (useTemplate: boolean) => {
    setLoading(true);
    setStatus(null);

    try {
      const result = await sendEmail({
        to: user.email,
        subject: useTemplate ? 'Admin Debug: Resend Template Test' : 'Admin Debug: Plain Text Test',
        text: 'System heartbeat test - Resend integration is active.',
        // @ts-ignore
        template: useTemplate ? 'welcome' : undefined,
        templateProps: useTemplate ? { name: user.name || 'Admin' } : undefined,
      });

      setStatus({ type: 'success', message: 'Admin test email dispatched successfully!' });
    } catch (err: any) {
      console.error('Email failed:', err);
      setStatus({ type: 'error', message: err.message || 'Disptach failed. Check Resend logs.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <BackButton />
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
                <ShieldCheck className="text-primary" size={32} />
                System Email Debugger
              </h1>
              <p className="text-gray-500 dark:text-gray-400">Admin Control Panel • Resend Infrastructure</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 border border-gray-200 dark:border-gray-700 shadow-xl shadow-blue-500/5">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Zap size={20} className="text-amber-500" />
                Live Connection Test
              </h2>
              
              <p className="text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
                Trigger a manual email dispatch through the <strong>Resend API</strong> route. 
                This bypasses normal business logic and sends directly to your admin address:
                <br />
                <span className="inline-block mt-2 bg-primary/10 text-primary font-mono px-3 py-1 rounded-full text-sm">
                   {user.email}
                </span>
              </p>

              {status && (
                <div className={`mb-8 p-5 rounded-2xl flex items-start gap-4 animate-in fade-in slide-in-from-top-4 duration-300 ${
                  status.type === 'success' ? 'bg-green-500/10 text-green-700 dark:text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-700 dark:text-red-400 border border-red-500/20'
                }`}>
                  {status.type === 'success' ? <CheckCircle2 className="shrink-0 mt-1" size={20} /> : <AlertCircle className="shrink-0 mt-1" size={20} />}
                  <span className="font-medium">{status.message}</span>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => handleTestEmail(false)}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-bold py-5 px-8 rounded-2xl transition-all active:scale-95 disabled:opacity-50"
                >
                  <Send size={20} />
                  {loading ? 'Dispatching...' : 'Plain Text'}
                </button>

                <button
                  onClick={() => handleTestEmail(true)}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white font-bold py-5 px-8 rounded-2xl shadow-lg shadow-primary/30 transition-all active:scale-95 disabled:opacity-50"
                >
                  <Mail size={20} />
                  {loading ? 'Dispatching...' : 'Send Template'}
                </button>
              </div>
            </div>

            <div className="bg-amber-500/5 border border-amber-500/10 rounded-3xl p-8">
               <h3 className="text-amber-700 dark:text-amber-400 font-bold mb-4 flex items-center gap-2">
                 <AlertCircle size={20} />
                 Infrastructure Summary
               </h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-1">
                    <p className="opacity-60">Auth System</p>
                    <p className="font-semibold">Firebase Admin SDK</p>
                  </div>
                  <div className="space-y-1">
                    <p className="opacity-60">SMTP Relay</p>
                    <p className="font-semibold">Resend (REST API)</p>
                  </div>
                  <div className="space-y-1">
                    <p className="opacity-60">Verified Domain</p>
                    <p className="font-semibold">studyhelp.site</p>
                  </div>
                  <div className="space-y-1">
                    <p className="opacity-60">Last Test Status</p>
                    <p className="font-semibold text-green-500">{status?.type === 'success' ? 'Functional' : 'Idle'}</p>
                  </div>
               </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-indigo-600 rounded-3xl p-8 text-white shadow-xl shadow-indigo-500/20">
              <h3 className="font-bold text-lg mb-2">Dev Tip</h3>
              <p className="text-white/80 text-sm leading-relaxed mb-4">
                You can view detailed delivery statistics and logs for all sent emails in the Resend Dashboard.
              </p>
              <a 
                href="https://resend.com/emails" 
                target="_blank" 
                className="inline-block bg-white/20 hover:bg-white/30 px-4 py-2 rounded-xl text-sm font-medium transition-colors"
                rel="noreferrer"
              >
                Open Resend Logs
              </a>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 border border-gray-200 dark:border-gray-700">
              <h3 className="font-bold mb-4">Current Config</h3>
              <div className="space-y-3 font-mono text-xs overflow-hidden">
                <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-xl">
                   <p className="text-gray-400">FROM_EMAIL</p>
                   <p className="truncate text-primary">notifications@studyhelp.site</p>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-xl">
                   <p className="text-gray-400">API_KEY Status</p>
                   <p className="text-green-500">Active (Loaded)</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .bg-primary { background-color: #275af5; }
        .bg-primary-dark { background-color: #1e46c7; }
        .text-primary { color: #275af5; }
        .shadow-primary\/30 { shadow-color: rgba(39, 90, 245, 0.3); }
      `}</style>
    </ProtectedRoute>
  );
}
