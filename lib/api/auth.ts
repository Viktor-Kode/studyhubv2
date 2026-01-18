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
  accessToken?: string
  data?: {
    user?: any
    token?: string
    accessToken?: string
  }
  [key: string]: any
}

export const authApi = {
  register: async (data: RegisterData): Promise<AuthResponse> => {
    try {
      const response = await apiClient.post<AuthResponse>('/users', data)
      
      // Handle different response formats
      const responseData = response.data
      
      // Normalize response format
      if (responseData.data) {
        return {
          user: responseData.data.user || responseData.data,
          token: responseData.data.token || responseData.data.accessToken || responseData.token,
        }
      }
      
      return responseData
    } catch (error) {
      // Re-throw to be handled by the component
      throw error
    }
  },

  login: async (data: LoginData): Promise<AuthResponse> => {
    try {
      const response = await apiClient.post<AuthResponse>('/users/login', data)
      
      // Handle different response formats
      const responseData = response.data
      
      // Normalize response format
      if (responseData.data) {
        return {
          user: responseData.data.user || responseData.data,
          token: responseData.data.token || responseData.data.accessToken || responseData.token,
        }
      }
      
      return responseData
    } catch (error) {
      // Re-throw to be handled by the component
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
      const response = await apiClient.post<{ message: string }>('/users/reset-password', data)
      return response.data
    } catch (error) {
      throw error
    }
  },

  /**
   * Verify user role from backend
   * This ensures the role stored in frontend matches the backend
   */
  verifyRole: async (): Promise<{ role: 'teacher' | 'student' }> => {
    try {
      const response = await apiClient.get<{ role: 'teacher' | 'student' }>('/users/me')
      return response.data
    } catch (error) {
      throw error
    }
  },
}
