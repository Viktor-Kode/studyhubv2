'use client'

import AuthSync from './AuthSync'
import IOSInstallBanner from './IOSInstallBanner'
import { UpgradeProvider } from '@/context/UpgradeContext'
import UpgradeHandlerSetup from './UpgradeHandlerSetup'

/**
 * Providers
 * Minimal provider wrapper — we no longer need NextAuth's SessionProvider.
 * Firebase handles session persistence via IndexedDB/localStorage natively.
 */
import { useEffect } from 'react'
import { toast } from 'react-hot-toast'

export default function Providers({ children }: { children: React.ReactNode }) {
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
        <UpgradeProvider>
            <AuthSync />
            <IOSInstallBanner />
            <UpgradeHandlerSetup />
            {children}
        </UpgradeProvider>
    )
}
