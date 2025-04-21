import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Check if the app is running in development mode
 */
export const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * Check if the app is running in production mode
 */
export const isProduction = process.env.NODE_ENV === 'production';

/**
 * Get the base API URL based on the current environment
 */
export const getApiBaseUrl = (): string => {
  return isProduction 
    ? 'https://pathfindersgifts.com/api'
    : 'http://localhost:8000/api';
};

/**
 * Get the full URL for an API endpoint
 */
export const getApiUrl = (path: string): string => {
  const baseUrl = getApiBaseUrl();
  // Ensure path starts with a slash
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${normalizedPath}`;
}; 