import { apiClient } from './client';

export const studyPlanApi = {
    createPlan: (data: {
        planType: 'exam' | 'general';
        examDetails?: {
            examName: string;
            examDate: string;
            subjects: string[];
            weakSubjects: string[];
            hoursPerDay: number;
        };
        generalDetails?: {
            subject: string;
            hoursPerDay: number;
            goal: string;
        };
    }) => apiClient.post('/study-plan', data),

    getActivePlan: () => apiClient.get('/study-plan/active'),

    updateTaskStatus: (taskId: string, completed: boolean) => 
        apiClient.patch('/study-plan/task', { taskId, completed }),

    resetPlan: () => apiClient.post('/study-plan/reset'),
};
