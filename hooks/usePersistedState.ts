import { useState, useEffect, useCallback } from 'react'

/**
 * Persists state to localStorage. Survives page refresh.
 * Values must be JSON-serializable (no functions, Set, Map, etc.).
 */
export function usePersistedState<T>(key: string, defaultValue: T): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  const [state, setState] = useState<T>(() => {
    if (typeof window === 'undefined') return defaultValue
    try {
      const saved = localStorage.getItem(key)
      if (saved == null) return defaultValue
      return JSON.parse(saved) as T
    } catch {
      return defaultValue
    }
  })

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      if (state === null || state === undefined) {
        localStorage.removeItem(key)
      } else {
        localStorage.setItem(key, JSON.stringify(state))
      }
    } catch {
      // storage full or unavailable — fail silently
    }
  }, [key, state])

  const clearState = useCallback(() => {
    localStorage.removeItem(key)
    setState(defaultValue)
  }, [key, defaultValue])

  return [state, setState, clearState]
}
