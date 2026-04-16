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
    // If the user's plan is already loaded in the auth store, use it
    if (user?.plan === 'premium' || user?.plan === 'pro') {
      setIsPremium(true)
      return
    }

    // Fallback/Double check with API if user exists but plan is 'free' or unknown
    if (user) {
      paymentApi.getStatus()
        .then(status => {
          if (status?.success && (status.subscription?.plan === 'premium' || status.subscription?.plan === 'pro')) {
            setIsPremium(true)
          }
        })
        .catch(err => console.error('Error checking subscription for ads:', err))
    }
  }, [user, user?.plan])

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
