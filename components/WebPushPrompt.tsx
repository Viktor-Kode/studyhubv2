'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/store/authStore';

export default function WebPushPrompt() {
  const { user } = useAuthStore();
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    if (!user) return;
    if (!('Notification' in window) || !('serviceWorker' in navigator)) return;

    // Only show if permission is default (not asked yet)
    if (Notification.permission !== 'default') return;

    // Show after 30 seconds
    const timer = setTimeout(() => {
      setShowPrompt(true);
    }, 30000);

    return () => clearTimeout(timer);
  }, [user]);

  const handleEnable = async () => {
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        const registration = await navigator.serviceWorker.ready;
        const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        
        if (!vapidKey) {
          console.error('VAPID public key not found');
          return;
        }

        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey)
        });

        // send subscription to backend to save
        const { apiClient } = await import('@/lib/api/client');
        await apiClient.post('/notifications/subscribe', subscription);
      }
      setShowPrompt(false);
    } catch (err) {
      console.error('Error enabling notifications:', err);
      setShowPrompt(false);
    }
  };

  const handleNotNow = () => {
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-24 right-4 z-[100] max-w-sm w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="v3-card shadow-2xl border-2 border-indigo-500/50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-6">
        <div className="flex items-start gap-4">
          <div className="text-3xl">🔔</div>
          <div className="flex-1">
            <h3 className="font-bold text-slate-900 dark:text-white text-lg leading-tight">
              Get study reminders so you never miss a session
            </h3>
            <div className="mt-4 flex gap-3">
              <button
                onClick={handleEnable}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-xl transition-all active:scale-95 text-sm"
              >
                Enable Notifications
              </button>
              <button
                onClick={handleNotNow}
                className="bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold py-2 px-4 rounded-xl transition-all text-sm"
              >
                Not now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
