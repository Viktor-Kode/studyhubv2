
/**
 * Utility to safely access environment variables in Next.js (Server-side only)
 */
export const getEnv = (key: string, defaultValue?: string): string => {
    const value = process.env[key] || defaultValue;

    // Note: We don't log the value for security, just presence
    if (!value && defaultValue === undefined) {
        console.warn(`[Env Warning]: Environment variable ${key} is missing.`);
    }

    return value || '';
};

export const config = {
    ycloud: {
        apiKey: () => getEnv('YCLOUD_API_KEY'),
        whatsappNumber: () => getEnv('YCLOUD_WHATSAPP_NUMBER'),
    },
    aloc: {
        accessToken: () => getEnv('ALOC_ACCESS_TOKEN'),
    },
    isProd: process.env.NODE_ENV === 'production',
};
