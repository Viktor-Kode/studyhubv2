import { apiClient } from './client';

export const paymentApi = {
    initializePayment: async (plan: string) => {
        const response = await apiClient.post('/payment/initialize', { plan });
        return response.data;
    },
    verifyPayment: async (reference: string) => {
        const response = await apiClient.post('/payment/verify', { reference });
        return response.data;
    },
    getStatus: async () => {
        const response = await apiClient.get('/payment/status');
        return response.data;
    }
};
