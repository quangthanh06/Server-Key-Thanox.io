import { ApiResponse } from '../types';

export function success<T>(data: T): ApiResponse<T> {
  return { success: true, data, error: null };
}

export function error(code: string, message: string): ApiResponse<never> {
  return { success: false, data: null, error: { code, message } };
}
