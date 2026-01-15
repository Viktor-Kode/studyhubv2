import { AxiosError } from 'axios'

export interface ApiError {
  message: string
  status?: number
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    // Try to get error message from response
    if (error.response?.data?.message) {
      return error.response.data.message
    }
    // Fallback to status text or default message
    if (error.response?.statusText) {
      return error.response.statusText
    }
    if (error.message) {
      return error.message
    }
  }
  
  if (error instanceof Error) {
    return error.message
  }
  
  return 'An unexpected error occurred'
}

export function getApiError(error: unknown): ApiError {
  const message = getErrorMessage(error)
  const status = error instanceof AxiosError ? error.response?.status : undefined
  
  return { message, status }
}
