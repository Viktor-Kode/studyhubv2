'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { useAuthStore } from '@/lib/store/authStore'
import { fetchAndApplyHelpWidgetPreferences, useHelpWidgetsStore } from '@/lib/store/helpWidgetsStore'
import HelpChatbot from './HelpChatbot'
import HelpButton from '../tour/HelpButton'
import OnboardingTour from '../tour/OnboardingTour'
import { getTourStepsForPathname } from '../tour/tourSteps'

export default function HelpWidgetLayer() {
  const pathname = usePathname()
  const { isAuthenticated, isLoading } = useAuthStore()
  const initFromStorage = useHelpWidgetsStore((s) => s.initFromStorage)
  const tourHidden = useHelpWidgetsStore((s) => s.tourHidden)
  const widgetsInitialized = useHelpWidgetsStore((s) => s.initialized)

  const [tourOpen, setTourOpen] = useState(false)
  const [tourSteps, setTourSteps] = useState([])

  const autoStartedRef = useRef(false)
  const prefsSyncedRef = useRef(false)

  useEffect(() => {
    initFromStorage()
  }, [initFromStorage])

  useEffect(() => {
    if (isLoading) return
    if (!isAuthenticated) {
      prefsSyncedRef.current = false
      return
    }
    if (prefsSyncedRef.current) return
    prefsSyncedRef.current = true
    void fetchAndApplyHelpWidgetPreferences()
  }, [isAuthenticated, isLoading])

  const startTourForCurrentPath = () => {
    const steps = getTourStepsForPathname(pathname)
    if (!steps || steps.length === 0) return
    setTourSteps(steps)
    setTourOpen(true)
  }

  useEffect(() => {
    if (isLoading) return
    if (!isAuthenticated) return
    if (!widgetsInitialized) return
    if (tourHidden) return
    if (autoStartedRef.current) return

    try {
      const completed = localStorage.getItem('studyhelp_tour_completed') === 'true'
      if (completed) return
    } catch {
      // ignore localStorage failures
    }

    const steps = getTourStepsForPathname(pathname)
    if (!steps || steps.length === 0) return

    autoStartedRef.current = true
    // Start after layout paints to ensure selectors exist.
    window.setTimeout(() => startTourForCurrentPath(), 600)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, isLoading, pathname, tourHidden, widgetsInitialized])

  if (isLoading || !isAuthenticated) return null

  return (
    <>
      <HelpButton onClick={startTourForCurrentPath} />
      <HelpChatbot />
      {tourOpen && (
        <OnboardingTour
          steps={tourSteps}
          onComplete={() => {
            setTourOpen(false)
          }}
        />
      )}
    </>
  )
}

