'use client'

import { createContext, useContext, useState, useCallback } from 'react'
import UpgradeModal from '@/components/UpgradeModal'

type UpgradeFeature =
  | 'cbt'
  | 'ai'
  | 'flashcard'
  | 'analytics'
  | 'mock'
  | 'notes'
  | 'postutme'
  | 'quiz'
  | 'default'

interface UpgradeContextValue {
  showUpgrade: (feature?: UpgradeFeature) => void
  hideUpgrade: () => void
}

const UpgradeContext = createContext<UpgradeContextValue | null>(null)

export function UpgradeProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<{ show: boolean; feature: UpgradeFeature }>({
    show: false,
    feature: 'default'
  })

  const showUpgrade = useCallback((feature: UpgradeFeature = 'default') => {
    setState({ show: true, feature })
  }, [])

  const hideUpgrade = useCallback(() => {
    setState(prev => ({ ...prev, show: false }))
  }, [])

  return (
    <UpgradeContext.Provider value={{ showUpgrade, hideUpgrade }}>
      {children}
      {state.show && (
        <UpgradeModal
          feature={state.feature}
          onClose={hideUpgrade}
        />
      )}
    </UpgradeContext.Provider>
  )
}

export function useUpgrade() {
  const ctx = useContext(UpgradeContext)
  if (!ctx) {
    throw new Error('useUpgrade must be used inside UpgradeProvider')
  }
  return ctx
}
