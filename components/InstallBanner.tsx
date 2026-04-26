'use client'

import { useState, useEffect } from 'react'
import { Share, Plus, X, Download } from 'lucide-react'
import { usePWA } from '@/hooks/usePWA'

export default function InstallBanner() {
  const { isInstallable, isInstalled, installApp } = usePWA()
  const [show, setShow] = useState(false)
  const [platform, setPlatform] = useState<'ios-safari' | 'ios-chrome' | 'android-chrome' | 'other' | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent)
    const isChrome = /CriOS/i.test(navigator.userAgent)
    const isAndroid = /android/i.test(navigator.userAgent)

    if (isInstalled) {
      setShow(false)
      return
    }

    // Set platform for specific instructions
    if (isIOS) {
      setPlatform(isChrome ? 'ios-chrome' : 'ios-safari')
    } else if (isAndroid || isInstallable) {
      setPlatform('android-chrome')
    } else {
      setPlatform('other')
    }

    // Show after a short delay
    const timer = setTimeout(() => setShow(true), 3000)
    return () => clearTimeout(timer)
  }, [isInstalled, isInstallable])

  const handleDismiss = () => {
    setShow(false)
    // We don't save to localStorage because the user wants it to "keep popping up" 
    // for all users in the browser until they actually install it.
  }

  if (!show || isInstalled) return null

  return (
    <div className="ios-banner">
      <button
        type="button"
        className="ios-banner-close"
        onClick={handleDismiss}
        aria-label="Close"
      >
        <X size={16} />
      </button>

      <div className="ios-banner-content">
        <img
          src="/android-chrome-192x192.png"
          alt="StudyHelp"
          className="ios-banner-icon"
        />
        <div className="ios-banner-text">
          <strong>Install StudyHelp</strong>
          <p>Add to your home screen for the best experience</p>
        </div>
      </div>

      <div className="mt-4">
        {platform === 'android-chrome' && isInstallable ? (
          <button
            onClick={installApp}
            className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors shadow-lg"
          >
            <Download size={18} />
            Install Now
          </button>
        ) : platform === 'ios-chrome' ? (
          <div className="ios-banner-steps">
            <p className="ios-chrome-intro">
              To install StudyHelp on your iPhone, you need to open this page in{' '}
              <strong>Safari</strong>.
            </p>
            <div className="ios-step">
              <div className="ios-step-num">1</div>
              <p>Tap the <strong>three dots</strong> menu at the bottom right</p>
            </div>
            <div className="ios-step">
              <div className="ios-step-num">2</div>
              <p>Tap <strong>&quot;Open in Safari&quot;</strong></p>
            </div>
          </div>
        ) : platform === 'ios-safari' ? (
          <div className="ios-banner-steps">
            <div className="ios-step">
              <div className="ios-step-num">1</div>
              <p>
                Tap the <Share size={14} className="inline-icon" /> Share button at
                the bottom
              </p>
            </div>
            <div className="ios-step">
              <div className="ios-step-num">2</div>
              <p>
                Scroll down and tap{' '}
                <strong>&quot;Add to Home Screen&quot;</strong>{' '}
                <Plus size={13} className="inline-icon" />
              </p>
            </div>
          </div>
        ) : (
          <div className="ios-banner-steps">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
              To install: Open your browser menu and choose <strong>&quot;Add to Home Screen&quot;</strong>.
            </p>
          </div>
        )}
      </div>

      <button type="button" className="ios-banner-got-it" onClick={handleDismiss}>
        Maybe Later
      </button>
    </div>
  )
}
