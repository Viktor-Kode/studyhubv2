/**
 * @deprecated All user data is now managed via Backend API.
 * This localStorage utility is deprecated and should not be used.
 */

export const userStorage = {
    getUserKey: (key: string): string => key,
    setItem: (key: string, value: string): void => { },
    getItem: (key: string): string | null => null,
    removeItem: (key: string): void => { },
    clearUserData: (): void => { }
}
