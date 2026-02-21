import { apiClient } from './client';

export const studyApi = {
    /**
     * Log a completed study session
     */
    logSession: async (sessionData: {
        userId: string;
        title?: string;
        type: 'study' | 'break';
        duration: number;
        notes?: string;
    }) => {
        const response = await apiClient.post('/study/log', sessionData);
        return response.data;
    },

    /**
     * Fetch study history
     */
    getHistory: async (userId: string) => {
        const response = await apiClient.get('/study/history', { params: { userId } });
        return response.data;
    },

    /**
     * Fetch productivity stats
     */
    getStats: async (userId: string) => {
        const response = await apiClient.get('/study/stats', { params: { userId } });
        return response.data;
    }
};
