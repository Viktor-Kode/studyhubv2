'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Share, Plus, X, Download, Smartphone } from 'lucide-react'
import { usePWA } from '@/hooks/usePWA'

export default function InstallBanner() {
  const { isInstallable, isInstalled, installApp } = usePWA()
  const [show, setShow] = useState(false)
  const [showInstructions, setShowInstructions] = useState(false)
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
  }

  const handleInstall = () => {
    if (isInstallable) {
      installApp()
    } else {
      setShowInstructions((prev) => !prev)
    }
  }

  if (!show || isInstalled) return null

  return (
    <aside
      aria-label="Install App Banner"
      className="fixed bottom-4 right-4 z-[9999] w-[calc(100%-2rem)] max-w-sm sm:bottom-6 sm:right-6 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border border-[#E9E5F8] dark:border-gray-800 rounded-2xl p-4 sm:p-5 shadow-[0_20px_50px_rgba(40,30,100,0.18)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-all animate-in fade-in slide-in-from-bottom-4 duration-300"
    >
      {/* Close button */}
      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Dismiss banner"
        className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        <X size={15} />
      </button>

      {/* App branding */}
      <div className="flex items-center gap-3 pr-6 mb-3.5">
        <div className="w-11 h-11 rounded-xl overflow-hidden flex-shrink-0 border border-purple-100 dark:border-purple-900/40 shadow-sm bg-white flex items-center justify-center">
          <Image
            src="/apple-touch-icon.png"
            alt="StudyHelp"
            width={44}
            height={44}
            className="w-full h-full object-contain"
          />
        </div>
        <div className="min-w-0">
          <h4 className="font-bold text-[15px] text-gray-900 dark:text-white leading-tight">
            StudyHelp App
          </h4>
          <p className="text-[12px] text-gray-500 dark:text-gray-400 mt-0.5 leading-snug">
            Fast, offline-ready practice on your phone or PC
          </p>
        </div>
      </div>

      {/* Action / Install Button */}
      <div className="space-y-2">
        <button
          type="button"
          onClick={handleInstall}
          className="w-full py-2.5 px-4 bg-gradient-to-r from-[#2F6BFF] to-[#6D3BF2] hover:opacity-95 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-md shadow-purple-500/25 transition-all text-sm cursor-pointer"
        >
          <Download size={15} />
          Install App
        </button>

        {platform === 'ios-safari' ? (
          <div className="bg-[#F8F7FF] dark:bg-gray-800/60 border border-[#E9E5F8] dark:border-gray-700/60 rounded-xl p-2.5 text-xs space-y-1.5 text-gray-700 dark:text-gray-300">
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-[#6D3BF2] text-white flex items-center justify-center font-bold text-[9px] flex-shrink-0">
                1
              </span>
              <span className="text-[11.5px]">
                Tap the <Share size={12} className="inline text-[#2F6BFF] mx-0.5" /> <strong>Share</strong> button in Safari
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-[#6D3BF2] text-white flex items-center justify-center font-bold text-[9px] flex-shrink-0">
                2
              </span>
              <span className="text-[11.5px]">
                Scroll and tap <Plus size={12} className="inline text-[#6D3BF2] mx-0.5" /> <strong>Add to Home Screen</strong>
              </span>
            </div>
          </div>
        ) : platform === 'ios-chrome' ? (
          <div className="bg-[#F8F7FF] dark:bg-gray-800/60 border border-[#E9E5F8] dark:border-gray-700/60 rounded-xl p-2.5 text-xs space-y-1 text-gray-700 dark:text-gray-300">
            <p className="font-semibold text-gray-900 dark:text-white text-[11.5px]">
              Install on iPhone via Safari
            </p>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-snug">
              Tap the menu &rarr; <strong>&quot;Open in Safari&quot;</strong>, then tap Share &rarr; Add to Home Screen.
            </p>
          </div>
        ) : (showInstructions || !isInstallable) ? (
          <div className="flex items-center gap-2 bg-[#F8F7FF] dark:bg-gray-800/60 border border-[#E9E5F8] dark:border-gray-700/60 rounded-xl p-2 text-xs text-gray-600 dark:text-gray-300">
            <Smartphone size={15} className="text-[#6D3BF2] flex-shrink-0" />
            <span className="text-[11px] leading-tight">
              Open your browser menu (⋮) &amp; choose <strong>&quot;Add to Home Screen&quot;</strong> or <strong>&quot;Install&quot;</strong>.
            </span>
          </div>
        ) : null}
      </div>

      {/* Dismiss subtle button */}
      <button
        type="button"
        onClick={handleDismiss}
        className="w-full text-center text-xs font-semibold text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors py-1.5 mt-2.5"
      >
        Maybe later
      </button>
    </aside>
  )
}
