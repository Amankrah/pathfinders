import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { counselorAuthService } from '@/services/counselor-auth';

interface Counselor {
  id: string;
  user_id: string;
  name: string;
  email: string;
  professional_title: string;
}

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

interface CounselorAuthContextType {
  counselor: Counselor | null;
  loading: boolean;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  register: (data: RegisterData) => Promise<void>;
  isAuthenticated: () => boolean;
}

const CounselorAuthContext = createContext<CounselorAuthContextType | undefined>(undefined);

export function CounselorAuthProvider({ children }: { children: React.ReactNode }) {
  const [counselor, setCounselor] = useState<Counselor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check authentication status on load
  useEffect(() => {
    const checkAuth = () => {
      setLoading(true);
      
      const token = localStorage.getItem('token');
      const userType = localStorage.getItem('user_type');
      
      if (token && userType === 'counselor') {
        const counselorId = localStorage.getItem('counselor_id');
        const userId = localStorage.getItem('user_id');
        const name = localStorage.getItem('name');
        const email = localStorage.getItem('email');
        const title = localStorage.getItem('professional_title');
        
        if (counselorId && userId && (name || email)) {
          setCounselor({
            id: counselorId,
            user_id: userId,
            name: name || 'Counselor',
            email: email || '',
            professional_title: title || ''
          });
          
          // Set the auth token for API requests
          counselorAuthService.setAuthToken(token);
        }
      }
      
      setLoading(false);
    };
    
    checkAuth();
    
    // Cleanup function
    return () => {
      counselorAuthService.clearAuthToken();
    };
  }, []);
  
  // Login function
  const login = useCallback(async (credentials: LoginCredentials) => {
    setLoading(true);
    setError(null);
    
    try {
      // Clear any existing tokens
      localStorage.removeItem('token');
      localStorage.removeItem('user_type');
      localStorage.removeItem('counselor_id');
      localStorage.removeItem('user_id');
      localStorage.removeItem('name');
      localStorage.removeItem('email');
      localStorage.removeItem('professional_title');
      
      const response = await counselorAuthService.login(credentials);
      
      // Save auth token and counselor data
      localStorage.setItem('token', response.token);
      localStorage.setItem('user_type', 'counselor');
      localStorage.setItem('user_id', response.user_id);
      localStorage.setItem('counselor_id', response.counselor_id);
      localStorage.setItem('name', response.name);
      localStorage.setItem('email', response.email);
      localStorage.setItem('professional_title', response.professional_title || '');
      
      // Set auth token for API requests
      counselorAuthService.setAuthToken(response.token);
      
      // Update state
      setCounselor({
        id: response.counselor_id,
        user_id: response.user_id,
        name: response.name,
        email: response.email,
        professional_title: response.professional_title || ''
      });
    } catch (err: any) {
      console.error('Counselor login failed:', err);
      setError(err.message || 'Login failed. Please check your credentials and try again.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Logout function
  const logout = useCallback(() => {
    // Clear localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user_type');
    localStorage.removeItem('counselor_id');
    localStorage.removeItem('user_id');
    localStorage.removeItem('name');
    localStorage.removeItem('email');
    localStorage.removeItem('professional_title');
    
    // Clear auth token from API headers
    counselorAuthService.clearAuthToken();
    
    // Reset state
    setCounselor(null);
  }, []);
  
  // Register function
  const register = useCallback(async (data: RegisterData) => {
    setLoading(true);
    setError(null);
    
    try {
      // Clear any existing tokens
      localStorage.removeItem('token');
      localStorage.removeItem('user_type');
      localStorage.removeItem('counselor_id');
      localStorage.removeItem('user_id');
      localStorage.removeItem('name');
      localStorage.removeItem('email');
      localStorage.removeItem('professional_title');
      
      const response = await counselorAuthService.register(data);
      
      // Save auth token and counselor data
      localStorage.setItem('token', response.token);
      localStorage.setItem('user_type', 'counselor');
      localStorage.setItem('user_id', response.user_id);
      localStorage.setItem('counselor_id', response.counselor_id);
      localStorage.setItem('email', response.email);
      localStorage.setItem('name', `${data.first_name} ${data.last_name}`);
      localStorage.setItem('professional_title', data.professional_title);
      
      // Set auth token for API requests
      counselorAuthService.setAuthToken(response.token);
      
      // Update state
      setCounselor({
        id: response.counselor_id,
        user_id: response.user_id,
        name: `${data.first_name} ${data.last_name}`,
        email: data.email,
        professional_title: data.professional_title
      });
    } catch (err: any) {
      console.error('Counselor registration failed:', err);
      setError(err.message || 'Registration failed. Please try again.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);
  
  const isAuthenticated = useCallback(() => {
    return !!counselor;
  }, [counselor]);
  
  return (
    <CounselorAuthContext.Provider
      value={{
        counselor,
        loading,
        error,
        login,
        logout,
        register,
        isAuthenticated
      }}
    >
      {children}
    </CounselorAuthContext.Provider>
  );
}

export function useCounselorAuth() {
  const context = useContext(CounselorAuthContext);
  
  if (context === undefined) {
    throw new Error('useCounselorAuth must be used within a CounselorAuthProvider');
  }
  
  return context;
} 