import { apiClient } from './client';

export const getAnalytics = async (userId: string, days: number | string) => {
    try {
        const response = await apiClient.get('/study/stats', { params: { userId, days } });
        return { analytics: response.data };
    } catch (error) {
        console.error('Error fetching analytics:', error);
        throw error;
    }
};

export const getUserStats = async (userId: string) => {
    try {
        const response = await apiClient.get('/study/stats', { params: { userId } });
        // Transform or pass through the data as needed by the frontend
        // backend returns { success, overall, daily }
        // frontend expects { stats: ... }
        return { stats: response.data };
    } catch (error) {
        console.error('Error fetching user stats:', error);
        throw error;
    }
};
