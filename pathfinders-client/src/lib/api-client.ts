import axios from 'axios';
import { API_CONFIG, AUTH_CONFIG } from './config';

const apiClient = axios.create({
  baseURL: `${API_CONFIG.baseUrl}${API_CONFIG.apiPath}`,
  withCredentials: true,
  headers: API_CONFIG.defaultHeaders,
  timeout: API_CONFIG.timeout,
});

// Function to get CSRF token
const getCSRFToken = () => {
  if (typeof document === 'undefined') return null; // Server-side rendering check
  
  return document.cookie
    .split('; ')
    .find(row => row.startsWith(`${AUTH_CONFIG.cookieNames.csrfToken}=`))
    ?.split('=')[1];
};

// Add request interceptor
apiClient.interceptors.request.use((config) => {
  const csrfToken = getCSRFToken();
  
  if (csrfToken) {
    config.headers['X-CSRFToken'] = csrfToken;
  }
  
  // For non-GET requests, ensure CSRF token is set
  if (config.method !== 'get' && !csrfToken) {
    console.warn('No CSRF token found for non-GET request');
  }
  
  // Add logging in development mode
  if (API_CONFIG.features.logApiCalls) {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
  }
  
  return config;
});

// Add response interceptor
apiClient.interceptors.response.use(
  (response) => {
    // Add logging in development mode
    if (API_CONFIG.features.logApiCalls) {
      console.log(`API Response [${response.status}]: ${response.config.method?.toUpperCase()} ${response.config.url}`);
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Log API errors in development
    if (API_CONFIG.features.logApiCalls) {
      console.error(`API Error [${error.response?.status}]: ${originalRequest.method?.toUpperCase()} ${originalRequest.url}`, error.response?.data);
    }
    
    // Handle CSRF token validation errors
    if (error.response?.status === 403 && !originalRequest._retry && API_CONFIG.features.enableTokenRefresh) {
      originalRequest._retry = true;
      
      try {
        // Try to get a fresh CSRF token
        const response = await apiClient.get('/csrf/');
        const token = response.data.csrfToken;
        
        // Update the header and retry the request
        originalRequest.headers['X-CSRFToken'] = token;
        return apiClient(originalRequest);
      } catch (refreshError) {
        console.error('Failed to refresh CSRF token:', refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export default apiClient; 