import { apiClient } from './client'

export interface RegisterData {
  email: string
  password: string
  role?: 'teacher' | 'student'
  phone?: string
  schoolName?: string
}

export interface LoginData {
  email: string
  password: string
}

export interface ForgotPasswordData {
  email: string
}

export interface ResetPasswordData {
  token: string
  newPassword: string
}

export interface AuthResponse {
  user?: {
    id?: string
    _id?: string
    email?: string
    [key: string]: any
  }
  token?: string
  data?: {
    user?: any
    token?: string
  }
  [key: string]: any
}

export const authApi = {
  register: async (data: RegisterData): Promise<AuthResponse> => {
    try {
      const response = await apiClient.post<AuthResponse>('/users', data)
      return response.data
    } catch (error) {
      throw error
    }
  },

  login: async (data: LoginData): Promise<AuthResponse> => {
    try {
      const response = await apiClient.post<AuthResponse>('/users/login', data)
      return response.data
    } catch (error) {
      throw error
    }
  },

  forgotPassword: async (data: ForgotPasswordData): Promise<{ message: string }> => {
    try {
      const response = await apiClient.post<{ message: string }>('/users/forgot-password', data)
      return response.data
    } catch (error) {
      throw error
    }
  },

  resetPassword: async (data: ResetPasswordData): Promise<{ message: string }> => {
    try {
      const response = await apiClient.post<{ message: string }>(`/users/reset-password/${data.token}`, data)
      return response.data
    } catch (error) {
      throw error
    }
  },

  verifyRole: async (): Promise<{ role: 'teacher' | 'student' }> => {
    try {
      const response = await apiClient.get<{ role: 'teacher' | 'student' }>('/users/me')
      return response.data
    } catch (error) {
      throw error
    }
  },
}
