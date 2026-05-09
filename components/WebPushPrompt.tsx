'use client';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/lib/store/authStore';

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

export default function WebPushPrompt() {
  const { user } = useAuthStore();

  useEffect(() => {
    if (!user) return;
    if (!('Notification' in window) || !('serviceWorker' in navigator)) return;
    
    // If already granted, we can just ensure subscription is active
    if (Notification.permission === 'granted') {
      subscribeUser();
      return;
    }

    if (Notification.permission !== 'default') return;

    const handleFirstInteraction = () => {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          subscribeUser();
        }
      });
      // Remove listeners after first interaction
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('keydown', handleFirstInteraction);
    };

    document.addEventListener('click', handleFirstInteraction);
    document.addEventListener('keydown', handleFirstInteraction);

    return () => {
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('keydown', handleFirstInteraction);
    };
  }, [user]);

  const subscribeUser = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey) throw new Error('No VAPID key found');
      
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });

      const { apiClient } = await import('@/lib/api/client');
      await apiClient.post('/notifications/register-web-push', { subscription });
    } catch (err) {
      console.error('Push subscription background failed:', err);
    }
  };

  return null;
}
