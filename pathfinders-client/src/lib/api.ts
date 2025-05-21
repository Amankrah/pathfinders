import axios from 'axios';
import { API_CONFIG, AUTH_CONFIG } from './config';

// Use environment-aware base URL from config
const baseURL = API_CONFIG.baseUrl;

export const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: API_CONFIG.defaultHeaders,
  timeout: API_CONFIG.timeout,
  xsrfCookieName: AUTH_CONFIG.cookieNames.csrfToken,
  xsrfHeaderName: 'X-CSRFToken',
});

// Helper to get CSRF token from cookies
const getCSRFToken = () => {
  if (typeof document === 'undefined') return null; // Server-side rendering check
  
  return document.cookie
    .split('; ')
    .find(row => row.startsWith(`${AUTH_CONFIG.cookieNames.csrfToken}=`))
    ?.split('=')[1];
};

// Update the request interceptor
api.interceptors.request.use((config) => {
  const csrfToken = getCSRFToken();

  if (csrfToken) {
    config.headers['X-CSRFToken'] = csrfToken;
  }
  
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Update the response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 403 && !originalRequest._retry && API_CONFIG.features.enableTokenRefresh) {
      originalRequest._retry = true;
      
      try {
        // Get a fresh CSRF token
        const csrfResponse = await api.get(`${API_CONFIG.apiPath}/csrf/`);
        const newCsrfToken = csrfResponse.data.csrfToken;
        
        // Update the token in the original request
        originalRequest.headers['X-CSRFToken'] = newCsrfToken;
        
        // Retry the original request
        return api(originalRequest);
      } catch (refreshError) {
        console.error('Failed to refresh CSRF token:', refreshError);
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
); 

// Export API endpoints in a type-safe way
export const endpoints = {
  auth: {
    login: `${API_CONFIG.apiPath}/auth/login/`,
    logout: `${API_CONFIG.apiPath}/auth/logout/`,
    register: `${API_CONFIG.apiPath}/auth/register/`,
    profile: `${API_CONFIG.apiPath}/users/profile/`,
  },
  assessments: {
    list: `${API_CONFIG.apiPath}/assessments/`,
    start: `${API_CONFIG.apiPath}/assessments/start/`,
    submit: `${API_CONFIG.apiPath}/assessments/submit/`,
    results: `${API_CONFIG.apiPath}/assessments/latest-results/`,
  },
  counselors: {
    dashboard: `${API_CONFIG.apiPath}/counselors/dashboard/`,
    users: `${API_CONFIG.apiPath}/counselors/my_users/`,
    userDetails: (userId: string | number) => `${API_CONFIG.apiPath}/counselors/${userId}/user_details/`,
    userAssessments: (userId: string | number) => `${API_CONFIG.apiPath}/counselors/${userId}/user-assessments/`,
    updateNotes: (userId: string | number) => `${API_CONFIG.apiPath}/counselors/${userId}/update_notes/`,
  },
  counselorAssessments: {
    create: `${API_CONFIG.apiPath}/counselor-assessments/`,
    list: `${API_CONFIG.apiPath}/counselor-assessments/`,
    details: (id: string | number) => `${API_CONFIG.apiPath}/counselor-assessments/${id}/`,
    submitResponse: (id: string | number) => `${API_CONFIG.apiPath}/counselor-assessments/${id}/submit_response/`,
    addNotes: (id: string | number) => `${API_CONFIG.apiPath}/counselor-assessments/${id}/add_counselor_notes/`,
    conduct: (id: string | number) => `${API_CONFIG.apiPath}/counselor-assessments/${id}/conduct/`,
  }
}; 