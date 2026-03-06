'use client'

import { useEffect } from 'react'
import { useUpgrade } from '@/context/UpgradeContext'
import { registerUpgradeHandler } from '@/lib/upgradeHandler'

/**
 * Registers the upgrade modal handler so apiClient 403 interceptor can trigger it.
 */
export default function UpgradeHandlerSetup() {
  const { showUpgrade } = useUpgrade()

  useEffect(() => {
    registerUpgradeHandler((codeOrFeature) => {
      showUpgrade(codeOrFeature as any)
    })
  }, [showUpgrade])

  return null
}
