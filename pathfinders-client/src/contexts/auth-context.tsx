import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { RegisterData, User, ProfileFormData } from '@/types/auth';
import { api } from '@/lib/api';
import { AxiosError } from 'axios';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  updateProfile: (data: ProfileFormData) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    try {
      // Get CSRF token first
      const csrfResponse = await api.get('/api/csrf/');
      const csrfToken = csrfResponse.data.csrfToken;
      
      // Set CSRF token in headers for subsequent requests
      api.defaults.headers.common['X-CSRFToken'] = csrfToken;
      
      // Then check authentication
      const response = await api.get('/api/auth/me/');
      setUser(response.data);
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        if (error.response?.status !== 401 && error.response?.status !== 403) {
          console.error('Auth check failed:', error);
        }
      }
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    try {
      // Get fresh CSRF token before login
      const csrfResponse = await api.get('/api/csrf/');
      api.defaults.headers.common['X-CSRFToken'] = csrfResponse.data.csrfToken;
      
      const response = await api.post('/api/auth/login/', { username, password });
      setUser(response.data.user);
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        console.error('Login failed:', error);
      }
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/api/auth/logout/');
      setUser(null);
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        console.error('Logout error:', error);
      }
      throw error;
    }
  }, []);

  const register = async (data: RegisterData) => {
    try {
      const csrfResponse = await api.get('/api/csrf/');
      api.defaults.headers.common['X-CSRFToken'] = csrfResponse.data.csrfToken;
      
      await api.post('/api/auth/register/', data);
      
      // Automatically login after successful registration
      await login(data.username, data.password);
    } catch (error) {
      if (error instanceof AxiosError && error.response?.data) {
        throw new Error(Object.entries(error.response.data)
          .map(([key, value]) => `${key}: ${value}`)
          .join(', '));
      }
      throw error;
    }
  };

  const updateProfile = async (data: ProfileFormData) => {
    try {
      // Get fresh CSRF token
      const csrfResponse = await api.get('/api/csrf/');
      api.defaults.headers.common['X-CSRFToken'] = csrfResponse.data.csrfToken;
      
      // Send update request
      const response = await api.patch('/api/auth/profile/', data);
      setUser(response.data);
    } catch (error) {
      console.error('Profile update failed:', error);
      throw error;
    }
  };

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <AuthContext.Provider value={{ 
      user,
      loading, 
      login, 
      logout, 
      checkAuth, 
      register, 
      updateProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 