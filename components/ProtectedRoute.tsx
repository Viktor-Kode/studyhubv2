'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store/authStore'
import { FiLoader } from 'react-icons/fi'

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: ('student' | 'teacher')[]
}

export default function ProtectedRoute({
  children,
  allowedRoles
}: ProtectedRouteProps) {
  const router = useRouter()
  const { user, isAuthenticated, token, logout, setLoading, login } = useAuthStore()
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      console.log('[ProtectedRoute] Starting auth check...');

      // 1. If we already have a user in the store, we're good
      if (isAuthenticated && user && token) {
        console.log('[ProtectedRoute] User already authenticated in store:', user.email);
        if (allowedRoles && !allowedRoles.includes(user.role)) {
          console.warn('[ProtectedRoute] Role mismatch, redirecting to dashboard');
          router.push('/dashboard');
          return;
        }
        setIsChecking(false);
        return;
      }

      // 2. Check for token in cookie
      const cookieMatch = typeof document !== 'undefined'
        ? document.cookie.match(/(^| )auth-token=([^;]+)/)
        : null;
      const cookieToken = cookieMatch ? decodeURIComponent(cookieMatch[2]) : null;

      if (!cookieToken) {
        console.warn('[ProtectedRoute] No auth-token cookie found');
        throw new Error('No token found');
      }

      console.log('[ProtectedRoute] Found cookie token, re-hydrating...');

      // 3. Re-hydrate from backend
      setLoading(true);
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

      const response = await fetch(`${API_URL}/users/me`, {
        headers: {
          'Authorization': `Bearer ${cookieToken}`,
          'Accept': 'application/json'
        },
      });

      if (response.ok) {
        const result = await response.json();
        const userData = result.data?.user || result.user;

        if (userData) {
          console.log('[ProtectedRoute] Successfully re-hydrated user:', userData.email);
          const normalizedUser = {
            id: userData._id || userData.id,
            email: userData.email,
            name: userData.name,
            role: userData.role || 'student',
            isVerified: userData.isVerified ?? true,
            avatar: userData.avatar,
            oauthProvider: userData.oauthProvider || null,
          };
          login(normalizedUser, cookieToken);

          if (allowedRoles && !allowedRoles.includes(normalizedUser.role)) {
            console.warn('[ProtectedRoute] Role mismatch post-hydration');
            router.push('/dashboard');
            return;
          }
          setIsChecking(false);
          return;
        }
      } else {
        const errData = await response.json().catch(() => ({}));
        console.error('[ProtectedRoute] Re-hydration fetch failed:', response.status, errData);
      }

      throw new Error(`Authentication failed (Status: ${response.status})`);

    } catch (error: any) {
      console.error('[ProtectedRoute] Auth check failed:', error.message);
      logout();
      router.push('/auth/login');
    } finally {
      setLoading(false);
      setIsChecking(false);
    }
  };

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <FiLoader className="animate-spin text-4xl text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    return null
  }

  return <>{children}</>
}
