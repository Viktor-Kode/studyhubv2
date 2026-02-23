
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
    twilio: {
        accountSid: () => getEnv('TWILIO_ACCOUNT_SID'),
        authToken: () => getEnv('TWILIO_AUTH_TOKEN'),
        whatsappNumber: () => getEnv('TWILIO_WHATSAPP_NUMBER', 'whatsapp:+14155238886'),
        contentSid: () => getEnv('TWILIO_CONTENT_SID'),
    },
    aloc: {
        accessToken: () => getEnv('ALOC_ACCESS_TOKEN'),
    },
    isProd: process.env.NODE_ENV === 'production',
};
