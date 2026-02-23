import { apiClient } from './client';

export const getAnalytics = async (days: number | string) => {
    try {
        const response = await apiClient.get('/study/stats', { params: { days } });
        return { analytics: response.data };
    } catch (error) {
        console.error('Error fetching analytics:', error);
        throw error;
    }
};

export const getUserStats = async () => {
    try {
        const response = await apiClient.get('/study/stats');
        // Backend returns the full stats object
        return { stats: response.data.stats, ...response.data };
    } catch (error) {
        console.error('Error fetching user stats:', error);
        throw error;
    }
};
