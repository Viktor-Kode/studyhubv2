import { apiClient } from './client';

export interface Class {
    _id: string;
    className: string;
    subject: string;
    level: string;
    joinCode: string;
    teacherId: string;
    students: string[];
    assignments?: any[];
    announcements?: any[];
    createdAt: string;
    updatedAt: string;
}

export const getClasses = async () => {
    const response = await apiClient.get('/classes');
    return response.data;
};

export const createClass = async (classData: any) => {
    const response = await apiClient.post('/classes', classData);
    return response.data;
};

export const getClass = async (id: string) => {
    const response = await apiClient.get(`/classes/${id}`);
    return response.data;
};

export const updateClass = async (id: string, classData: any) => {
    const response = await apiClient.put(`/classes/${id}`, classData);
    return response.data;
};

export const deleteClass = async (id: string) => {
    const response = await apiClient.delete(`/classes/${id}`);
    return response.data;
};

export const joinClass = async (joinCode: string) => {
    const response = await apiClient.post('/classes/join', { joinCode });
    return response.data;
};

export const getClassStudents = async (id: string) => {
    const response = await apiClient.get(`/classes/${id}/students`);
    return response.data;
};
