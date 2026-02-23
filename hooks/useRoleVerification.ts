import { useEffect, useState } from 'react'
import { useAuthStore } from '@/lib/store/authStore'

/**
 * Hook to verify user role from backend
 * This ensures the role stored in frontend matches the backend
 */
export function useRoleVerification() {
  const { user, setUser } = useAuthStore()
  const [isVerifying, setIsVerifying] = useState(true)
  const [isVerified, setIsVerified] = useState(false)

  useEffect(() => {
    const verifyRole = async () => {
      // Import getFirebaseToken dynamically or use the exported one
      const { getFirebaseToken } = await import('@/lib/store/authStore')
      const token = await getFirebaseToken()

      if (!user || !token) {
        setIsVerifying(false)
        return
      }

      try {
        // Verify role from Firestore
        const { fetchAppUser } = await import('@/lib/firebase-auth')
        const appUser = await fetchAppUser(user.uid)
        const role = appUser?.role

        // Update user role if it differs from local store
        if (role && role !== user.role) {
          setUser({ ...user, role })
        }

        setIsVerified(true)
      } catch (error) {
        // If verification fails, log but don't block access
        // The backend will enforce role-based access on API calls
        console.warn('Role verification failed, using stored role:', error)
        setIsVerified(true)
      } finally {
        setIsVerifying(false)
      }
    }

    verifyRole()
  }, [user, setUser])

  return { isVerifying, isVerified }
}
