/**
 * User-specific localStorage utility
 * Ensures data isolation between users
 */

import { useAuthStore } from '@/lib/store/authStore'

export const userStorage = {
    // Get key with user ID prefix
    getUserKey: (key: string): string => {
        const user = useAuthStore.getState().user
        if (!user?.id) return key
        return `${user.id}_${key}`
    },

    // Set item for current user
    setItem: (key: string, value: string): void => {
        const userKey = userStorage.getUserKey(key)
        localStorage.setItem(userKey, value)
    },

    // Get item for current user
    getItem: (key: string): string | null => {
        const userKey = userStorage.getUserKey(key)
        return localStorage.getItem(userKey)
    },

    // Remove item for current user
    removeItem: (key: string): void => {
        const userKey = userStorage.getUserKey(key)
        localStorage.removeItem(userKey)
    },

    // Clear all items for current user
    clearUserData: (): void => {
        const user = useAuthStore.getState().user
        if (!user?.id) return

        const keysToRemove: string[] = []
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i)
            if (key?.startsWith(`${user.id}_`)) {
                keysToRemove.push(key)
            }
        }

        keysToRemove.forEach(key => localStorage.removeItem(key))
    }
}
