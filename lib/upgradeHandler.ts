/**
 * Global upgrade handler — allows API layer to trigger upgrade modal
 * without direct access to React context.
 * Registered by UpgradeHandlerSetup component.
 */
let upgradeHandler: ((feature: string) => void) | null = null

export function registerUpgradeHandler(fn: (feature: string) => void) {
  upgradeHandler = fn
}

export function triggerUpgradeModal(codeOrFeature?: string) {
  if (upgradeHandler) {
    const featureMap: Record<string, string> = {
      CBT_LIMIT_REACHED: 'cbt',
      AI_LIMIT_REACHED: 'ai',
      FLASHCARD_LIMIT_REACHED: 'flashcard',
      SUBSCRIPTION_EXPIRED: 'default'
    }
    const feature = featureMap[codeOrFeature || ''] || codeOrFeature || 'default'
    upgradeHandler(feature)
  }
}
