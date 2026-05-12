import { apiClient } from './client';

export const studyPlanApi = {
    createPlan: (data: {
        planType: 'exam' | 'general';
        studyChallenges: string[];
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

    getActivePlan: () => apiClient.get('/study-plan'),

    updateTaskStatus: (taskId: string, completed: boolean) => apiClient.post('/study-plan/update-task', { taskId, completed }),
    autoCompleteTask: (type: 'cbt' | 'note' | 'timer' | 'flashcard') => apiClient.post('/study-plan/auto-complete', { type }),

    resetPlan: () => apiClient.post('/study-plan/reset'),
};
