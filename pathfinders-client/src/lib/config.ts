/**
 * Global application configuration with environment-specific settings
 */

// Environment detection
export const isProduction = process.env.NODE_ENV === 'production';
export const isDevelopment = process.env.NODE_ENV === 'development';
export const isTest = process.env.NODE_ENV === 'test';
export const isDebug = process.env.NEXT_PUBLIC_DEBUG === 'true';

// API configuration
export const API_CONFIG = {
  // Base URLs
  baseUrl: process.env.NEXT_PUBLIC_BACKEND_URL || 
    (isProduction ? 'https://pathfindersgifts.com' : 'http://localhost:8000'),
  
  // API paths
  apiPath: '/api',
  
  // Full API URL
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 
    (isProduction ? 'https://pathfindersgifts.com/api' : 'http://localhost:8000/api'),
  
  // Timeout in milliseconds
  timeout: 30000,
  
  // Headers
  defaultHeaders: {
    'Content-Type': 'application/json',
  },
  
  // Feature flags
  features: {
    enableTokenRefresh: true,
    useLocalStorage: isDevelopment,
    mockResponses: process.env.NEXT_PUBLIC_ENABLE_MOCK_API === 'true',
    logApiCalls: isDevelopment || isDebug,
  }
};

// Authentication settings
export const AUTH_CONFIG = {
  // Cookie names
  cookieNames: {
    csrfToken: 'csrftoken',
    sessionId: 'sessionid',
  },
  
  // Token expiration times
  tokenExpirationDays: 7,
  
  // Login redirect paths
  loginRedirectPath: '/dashboard',
  logoutRedirectPath: '/',
};

// UI configuration
export const UI_CONFIG = {
  // Theme settings
  themeName: 'light',
  
  // Date formats
  dateFormat: 'MMMM d, yyyy',
  timeFormat: 'h:mm a',
  
  // Pagination
  defaultPageSize: 10,
  
  // Animation settings
  animationDuration: 300,
};

// Environment-specific settings
export const ENV_CONFIG = {
  // Development-only settings
  development: {
    showDevTools: true,
    logApiCalls: true,
    mockDelay: 500,
  },
  
  // Production-only settings
  production: {
    showDevTools: false,
    logApiCalls: isDebug,
  }
};

// Export a function to get current environment settings
export const getEnvSettings = () => {
  return isProduction 
    ? ENV_CONFIG.production 
    : ENV_CONFIG.development;
}; 