'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/lib/store/authStore'
import { useState } from 'react'
import { paymentApi } from '@/lib/api/paymentApi'

interface AdBannerProps {
  dataAdSlot?: string
  dataAdFormat?: string
  dataFullWidthResponsive?: boolean
  className?: string
}

const AdBanner = ({ 
  dataAdSlot, 
  dataAdFormat = 'auto', 
  dataFullWidthResponsive = true,
  className = ""
}: AdBannerProps) => {
  const { user } = useAuthStore()
  const [isPremium, setIsPremium] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    // 1. Ads should not appear to any user who has an active or expired paid plan
    // 2. Remove all advertisement placements from the logged-in student dashboard
    
    const isDashboard = typeof window !== 'undefined' && window.location.pathname.startsWith('/dashboard');

    if (user) {
      // Check roles first - admins and teachers don't see ads
      if (user.role === 'admin' || user.role === 'teacher') {
        setIsPremium(true)
        return
      }

      // Check subscription status
      // We check both the store and the API for accuracy
      paymentApi.getStatus()
        .then(status => {
          if (status?.success) {
            const sub = status.subscription;
            // If plan is not 'free' OR status is 'active' or 'expired', it's a paid user (ever)
            const hasEverPaid = sub?.plan !== 'free' || sub?.status === 'active' || sub?.status === 'expired';
            
            if (hasEverPaid || isDashboard) {
              setIsPremium(true)
            }
          }
        })
        .catch(err => {
          console.error('Error checking subscription for ads:', err)
          // Fallback: if on dashboard, hide ads anyway
          if (isDashboard) setIsPremium(true)
        })
    } else {
       // Public/landing pages - ads are allowed unless explicitly disabled
       setIsPremium(false)
    }
  }, [user, user?.role])

  useEffect(() => {
    if (!isPremium && !isLoaded) {
      try {
        // @ts-ignore
        const adsbygoogle = window.adsbygoogle || []
        adsbygoogle.push({})
        setIsLoaded(true)
      } catch (err) {
        // Only log error in development
        if (process.env.NODE_ENV === 'development') {
          console.warn('AdSense notice:', err)
        }
      }
    }
  }, [isPremium, isLoaded])

  if (isPremium) return null

  return (
    <div className={`w-full overflow-hidden my-4 text-center min-h-[100px] flex items-center justify-center bg-gray-50/50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-200 dark:border-gray-700 ${className}`}>
      {/* If no slot is provided, this could be a placeholder or Auto Ads will find its own place, 
          but usually AdSense requires the ins tag for manual placement */}
      {dataAdSlot ? (
        <ins
          className="adsbygoogle"
          style={{ display: 'block' }}
          data-ad-client="ca-pub-6986605854364658"
          data-ad-slot={dataAdSlot}
          data-ad-format={dataAdFormat}
          data-full-width-responsive={dataFullWidthResponsive.toString()}
        />
      ) : (
        <div className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">
          Advertisement
        </div>
      )}
    </div>
  )
}

export default AdBanner
