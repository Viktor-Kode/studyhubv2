'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/store/authStore';

export default function WebPushPrompt() {
  const { user } = useAuthStore();
  const [showPrompt, setShowPrompt] = useState(false);
  const [iosInstallHint, setIosInstallHint] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    if (!('Notification' in window) || !('serviceWorker' in navigator)) return;
    const userKey = user.uid || (user as any)._id || 'student';
    const firstNodeKey = `studyhelp_first_node_completed_at:${userKey}`;
    const dismissedKey = `studyhelp_push_prompt_dismissed_at:${userKey}`;
    const checkPrompt = async (isNodeComplete = false) => {
      if (isNodeComplete) localStorage.setItem(firstNodeKey, new Date().toISOString());
      if (!localStorage.getItem(firstNodeKey)) return;
      if (Notification.permission === 'denied') return;
      const dismissedAt = Number(localStorage.getItem(dismissedKey) || 0);
      if (dismissedAt && Date.now() - dismissedAt < 7 * 24 * 60 * 60 * 1000) return;
      try {
        const { apiClient } = await import('@/lib/api/client');
        const response = await apiClient.get('/settings');
        if (response.data?.notificationPrefs?.studyReminders) return;
      } catch { /* keep the prompt available if preferences cannot be loaded */ }

      const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent)
        || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      const isInstalled = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true;
      setIosInstallHint(isIOS && !isInstalled);
      setShowPrompt(true);
    };
    void checkPrompt();
    const onFirstNodeComplete = () => { void checkPrompt(true); };
    window.addEventListener('studyhelp:first-node-completed', onFirstNodeComplete);
    return () => window.removeEventListener('studyhelp:first-node-completed', onFirstNodeComplete);
  }, [user]);

  const handleEnable = async () => {
    setLoading(true);
    try {
      const permission = Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission();
      if (permission !== 'granted') return;
      const registration = await navigator.serviceWorker.ready;
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey) throw new Error('VAPID public key not found');

      let subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey)
        });
      }

      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Africa/Lagos';
      const { apiClient } = await import('@/lib/api/client');
      await apiClient.post('/notifications/subscribe', { subscription, timezone });
      await apiClient.put('/settings', { notificationPrefs: { studyReminders: true, timezone } });
      setShowPrompt(false);
      const userKey = user?.uid || (user as any)?._id || 'student';
      localStorage.removeItem(`studyhelp_push_prompt_dismissed_at:${userKey}`);
    } catch (err) {
      console.error('Error enabling notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleNotNow = () => {
    const userKey = user?.uid || (user as any)?._id || 'student';
    localStorage.setItem(`studyhelp_push_prompt_dismissed_at:${userKey}`, String(Date.now()));
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
              {iosInstallHint ? 'Add StudyHelp to your Home Screen for reminders' : 'Want a reminder for your next study step?'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              {iosInstallHint
                ? 'In Safari, tap Share, then Add to Home Screen. You can enable study reminders from Settings afterward.'
                : 'We’ll send an occasional reminder with the next lesson in your map. You can choose the time or turn it off in Settings.'}
            </p>
            <div className="mt-4 flex gap-3">
              {!iosInstallHint && <button
                onClick={handleEnable}
                disabled={loading}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-xl transition-all active:scale-95 text-sm disabled:opacity-60"
              >
                {loading ? 'Enabling…' : 'Turn on'}
              </button>}
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
