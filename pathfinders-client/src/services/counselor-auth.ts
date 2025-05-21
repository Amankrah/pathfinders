import { api } from '@/lib/api';
import { AxiosError } from 'axios';

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData {
  email: string;
  password: string;
  confirm_password: string;
  first_name: string;
  last_name: string;
  professional_title: string;
  institution: string;
  qualification: string;
  phone_number: string;
  bio?: string;
}

export const counselorAuthService = {
  async login(credentials: LoginCredentials) {
    try {
      console.log('Attempting counselor login with credentials:', credentials);
      console.log('API endpoint:', '/api/counselors/auth/login/');
      
      const response = await api.post('/api/counselors/auth/login/', credentials);
      console.log('Login response:', response.data);
      return response.data;
    } catch (err) {
      console.error('Login error details:', err);
      if (err instanceof AxiosError) {
        console.error('Response data:', err.response?.data);
        throw new Error(err.response?.data?.error || 'Login failed');
      }
      throw err;
    }
  },

  async register(data: RegisterData) {
    try {
      console.log('Attempting counselor registration with data:', data);
      console.log('API endpoint:', '/api/counselors/auth/register/');
      
      const response = await api.post('/api/counselors/auth/register/', data);
      console.log('Registration response:', response.data);
      return response.data;
    } catch (err) {
      console.error('Registration error details:', err);
      if (err instanceof AxiosError && err.response?.data) {
        console.error('Response data:', err.response.data);
        if (typeof err.response.data === 'object') {
          const errors = Object.entries(err.response.data)
            .map(([key, value]) => `${key}: ${value}`)
            .join(', ');
          throw new Error(errors);
        } else {
          throw new Error(err.response.data);
        }
      }
      throw err;
    }
  },

  setAuthToken(token: string) {
    console.log('Setting auth token:', token ? 'token present' : 'token missing');
    api.defaults.headers.common['Authorization'] = `Token ${token}`;
    
    // Store token in localStorage
    if (token) {
      localStorage.setItem('counselorToken', token);
    }
  },

  clearAuthToken() {
    console.log('Clearing auth token');
    delete api.defaults.headers.common['Authorization'];
    
    // Remove token from localStorage
    localStorage.removeItem('counselorToken');
  }
}; 