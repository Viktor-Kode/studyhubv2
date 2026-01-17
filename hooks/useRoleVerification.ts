import { useEffect, useState } from 'react'
import { useAuthStore } from '@/lib/store/authStore'
import { authApi } from '@/lib/api/auth'

/**
 * Hook to verify user role from backend
 * This ensures the role stored in frontend matches the backend
 */
export function useRoleVerification() {
  const { user, setAuth, token } = useAuthStore()
  const [isVerifying, setIsVerifying] = useState(true)
  const [isVerified, setIsVerified] = useState(false)

  useEffect(() => {
    const verifyRole = async () => {
      if (!user || !token) {
        setIsVerifying(false)
        return
      }

      try {
        // Verify role from backend
        const response = await authApi.verifyRole()
        
        // Update user role if it differs from backend
        if (response.role && response.role !== user.role) {
          setAuth(
            { ...user, role: response.role },
            token
          )
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
  }, [user, setAuth, token])

  return { isVerifying, isVerified }
}
