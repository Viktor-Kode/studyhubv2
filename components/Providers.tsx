'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import AuthSync from './AuthSync'
import InstallBanner from './InstallBanner'
import NotifToast from '@/components/notifications/NotifToast'
import { UpgradeProvider } from '@/context/UpgradeContext'
import UpgradeHandlerSetup from './UpgradeHandlerSetup'
import OfflineBanner from '@/components/OfflineBanner'

/**
 * Providers
 * Minimal provider wrapper — we no longer need NextAuth's SessionProvider.
 * Firebase handles session persistence via IndexedDB/localStorage natively.
 */
import { useEffect } from 'react'
import { toast, Toaster } from 'react-hot-toast'

export default function Providers({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        staleTime: 5 * 60 * 1000,
                        gcTime: 15 * 60 * 1000,
                        retry: 1,
                        refetchOnWindowFocus: false,
                    },
                    mutations: {
                        retry: 1,
                    },
                },
            }),
    )

    useEffect(() => {
        const checkTimer = setInterval(() => {
            const endTimeStr = localStorage.getItem('examEndTime');
            const examActive = localStorage.getItem('examActive');

            if (!examActive || !endTimeStr) return;

            const endTime = parseInt(endTimeStr);
            const remaining = Math.floor((endTime - Date.now()) / 1000);

            // Fire warning alarm at 5 minutes left
            if (remaining === 300) {
                playAlarm('warning');
                toast('⚠️ 5 minutes remaining in your exam!', { icon: '⏳' });
            }

            // Fire final alarm when time is up
            if (remaining <= 0) {
                playAlarm('final');
                localStorage.removeItem('examEndTime');
                localStorage.removeItem('examActive');
                localStorage.removeItem('examId');
                toast.error('⏰ Time is up! Your exam has been submitted.');
                // Auto-submit logic is usually handled by the page, 
                // but we clear the timer so it doesn't keep screaming.
                clearInterval(checkTimer);
            }
        }, 1000);

        return () => clearInterval(checkTimer);
    }, []);

    useEffect(() => {
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', function () {
                navigator.serviceWorker.register('/sw.js').then(
                    function (registration) {
                        console.log('ServiceWorker registration successful with scope: ', registration.scope);
                    },
                    function (err) {
                        console.log('ServiceWorker registration failed: ', err);
                    }
                );
            });
        }
    }, []);

    /** When a push notification is clicked, Safari and some browsers lack WindowClient.navigate; the SW asks us to navigate. */
    useEffect(() => {
        if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return

        const onMessage = (event: MessageEvent) => {
            const d = event.data as { type?: string; url?: string }
            if (d?.type !== 'SW_NAVIGATE' || typeof d.url !== 'string') return
            try {
                const u = new URL(d.url, window.location.origin)
                if (u.origin !== window.location.origin) return
                window.location.assign(u.href)
            } catch {
                /* ignore */
            }
        }

        navigator.serviceWorker.addEventListener('message', onMessage)
        return () => navigator.serviceWorker.removeEventListener('message', onMessage)
    }, [])

    const playAlarm = (type: string) => {
        const audio = new Audio(
            type === 'final'
                ? '/sounds/alarm-final.mp3'
                : '/sounds/alarm-warning.mp3'
        );
        audio.play().catch(() => {
            if (type === 'final') toast.error('⏰ TIME IS UP!');
        });
    };

    return (
        <QueryClientProvider client={queryClient}>
            <UpgradeProvider>
                <AuthSync />
                <InstallBanner />
                <UpgradeHandlerSetup />
                <NotifToast />
                <OfflineBanner />
                <Toaster position="top-center" toastOptions={{ duration: 3200 }} />
                {children}
            </UpgradeProvider>
        </QueryClientProvider>
    )
}
