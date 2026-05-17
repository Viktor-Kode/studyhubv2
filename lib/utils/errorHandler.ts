import { AxiosError } from 'axios'

export interface ApiError {
  message: string
  status?: number
}

export function getErrorMessage(error: unknown): string {
  if (!error) return 'An unexpected error occurred'

  // If it is an Axios error or has Axios response structure
  const errObj = error as any
  if (
    error instanceof AxiosError || 
    (error && typeof error === 'object' && (errObj.isAxiosError || errObj.response || errObj.config))
  ) {
    // Check for validation errors list first
    if (errObj.response?.data?.errors && Array.isArray(errObj.response.data.errors)) {
      const details = errObj.response.data.errors
        .map((e: any) => `${e.field || 'field'}: ${e.message || 'invalid value'}`)
        .join(', ')
      return `Validation failed (${details})`
    }

    if (errObj.response?.data?.message) {
      return errObj.response.data.message
    }
    if (errObj.response?.data?.error) {
      return errObj.response.data.error
    }
    if (errObj.response?.statusText) {
      return errObj.response.statusText
    }
    if (errObj.message) {
      return errObj.message
    }
  }
  
  if (error instanceof Error) {
    return error.message
  }

  if (typeof error === 'string') {
    return error
  }

  if (typeof error === 'object') {
    if (typeof errObj.message === 'string') return errObj.message
    if (typeof errObj.error === 'string') return errObj.error
    try {
      return JSON.stringify(error)
    } catch {
      return String(error)
    }
  }
  
  return String(error)
}

export function getApiError(error: unknown): ApiError {
  const message = getErrorMessage(error)
  const status = error instanceof AxiosError ? error.response?.status : undefined
  
  return { message, status }
}
