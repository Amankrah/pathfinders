import { api, endpoints } from '@/lib/api';

interface User {
  id: number;
  user_id: number;
  full_name: string;
  email: string;
  status?: string;
  notes?: string;
  created_at?: string;
  assessment_count?: number;
  max_limit?: number;
  can_take_more?: boolean;
}

interface RegisterUserData {
  email: string;
  first_name: string;
  last_name: string;
  phone_number?: string;
  notes?: string;
}

export const counselorApi = {
  // Dashboard data
  getDashboard: async () => {
    try {
      const response = await api.get(endpoints.counselors.dashboard);
      return response.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      if (err?.response?.data?.error) {
        throw new Error(err.response.data.error);
      }
      throw error;
    }
  },

  // User management
  getUsers: async () => {
    try {
      const response = await api.get(endpoints.counselors.users);
      return response.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      if (err?.response?.data?.error) {
        throw new Error(err.response.data.error);
      }
      throw error;
    }
  },

  getUserDetails: async (userId: number) => {
    try {
      const response = await api.get(endpoints.counselors.userDetails(userId));
      return response.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      if (err?.response?.data?.error) {
        throw new Error(err.response.data.error);
      }
      throw error;
    }
  },

  registerUser: async (userData: RegisterUserData) => {
    try {
      const response = await api.post('/api/counselors/register_user/', userData);
      return response.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      if (err?.response?.data?.error) {
        throw new Error(err.response.data.error);
      }
      throw error;
    }
  },

  updateUserNotes: async (userId: number, notes: string) => {
    try {
      const response = await api.post(endpoints.counselors.updateNotes(userId), { notes });
      return response.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      if (err?.response?.data?.error) {
        throw new Error(err.response.data.error);
      }
      throw error;
    }
  }
}; 