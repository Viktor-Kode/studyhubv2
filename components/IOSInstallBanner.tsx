'use client'

import { useState, useEffect } from 'react'
import { Share, Plus, X } from 'lucide-react'

type IosBannerMessage = 'chrome' | 'safari' | null

export default function IOSInstallBanner() {
  const [show, setShow] = useState(false)
  const [message, setMessage] = useState<IosBannerMessage>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent)
    const isChrome = /CriOS/i.test(navigator.userAgent)
    const isInstalled =
      (window.navigator as { standalone?: boolean }).standalone === true ||
      window.matchMedia('(display-mode: standalone)').matches
    const dismissed = localStorage.getItem('iosBannerDismissed')

    if (isIOS && !isInstalled && !dismissed) {
      setMessage(isChrome ? 'chrome' : 'safari')
      const timer = setTimeout(() => setShow(true), 3000)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleDismiss = () => {
    setShow(false)
    localStorage.setItem('iosBannerDismissed', 'true')
  }

  if (!show || !message) return null

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

      {message === 'chrome' ? (
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
          <div className="ios-step">
            <div className="ios-step-num">3</div>
            <p>
              Then tap Share <Share size={14} className="inline-icon" /> and{' '}
              <strong>&quot;Add to Home Screen&quot;</strong>{' '}
              <Plus size={13} className="inline-icon" />
            </p>
          </div>
        </div>
      ) : (
        <div className="ios-banner-steps">
          <div className="ios-step">
            <div className="ios-step-num">1</div>
            <p>
              Tap the <Share size={14} className="inline-icon" /> Share button at
              the bottom of Safari
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
          <div className="ios-step">
            <div className="ios-step-num">3</div>
            <p>Tap <strong>&quot;Add&quot;</strong> in the top right corner</p>
          </div>
        </div>
      )}

      <button type="button" className="ios-banner-got-it" onClick={handleDismiss}>
        Got it
      </button>
    </div>
  )
}
