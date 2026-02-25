import { apiClient } from './client';

export const paymentApi = {
    initializePayment: async (planType: string) => {
        const response = await apiClient.post('/payments/initialize', { planType });
        return response.data;
    },
    verifyPayment: async (reference: string) => {
        const response = await apiClient.get(`/payments/verify/${reference}`);
        return response.data;
    }
};
