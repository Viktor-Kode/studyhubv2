import { apiClient } from './client';

export const paymentApi = {
    initializePayment: async (plan: string) => {
        // Backend currently mounts payment routes under /api/payments/*
        const response = await apiClient.post('/payments/initialize', { plan });
        return response.data;
    },
    verifyPayment: async (reference: string) => {
        const response = await apiClient.post('/payments/verify', { reference });
        return response.data;
    },
    getStatus: async () => {
        const response = await apiClient.get('/payments/status');
        return response.data;
    }
};
