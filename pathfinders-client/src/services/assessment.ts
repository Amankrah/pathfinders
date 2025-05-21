import { api, endpoints } from '@/lib/api';
import { Question, Answer, AssessmentResult, AssessmentCreationData, UserAssessmentData, AssessmentSummary } from '@/types/assessment';

// Helper to ensure auth token is set for counselor requests
const ensureAuthToken = () => {
  const token = localStorage.getItem('counselorToken');
  if (token) {
    api.defaults.headers.common['Authorization'] = `Token ${token}`;
  }
};

export const assessmentApi = {
  getQuestions: async (): Promise<Question[]> => {
    const response = await api.get('/api/questions/list_all/');
    return response.data;
  },

  submitAnswers: async (answers: Answer[]): Promise<AssessmentResult> => {
    try {
        const response = await api.post('/api/assessments/submit/', { 
            answers: answers 
        });
        
        if (!response.data) {
            throw new Error('No data received from server');
        }
        
        return response.data;
    } catch (error: unknown) {
        const err = error as { response?: { data?: { error?: string } } };
        if (err?.response?.data?.error) {
            throw new Error(err.response.data.error);
        }
        throw error;
    }
  },

  saveProgress: async (answers: Answer[]): Promise<void> => {
    await api.post('/api/assessments/save-progress/', { current_answers: answers });
  },

  getProgress: async (): Promise<Answer[]> => {
    const response = await api.get('/api/assessments/get-progress/');
    return response.data;
  },

  getLatestResults: async (): Promise<AssessmentResult> => {
    const response = await api.get('/api/assessments/latest-results/');
    return response.data;
  },

  getGiftDetails: async (): Promise<AssessmentResult> => {
    const response = await api.get('/api/assessments/latest-results/');
    return response.data;
  },
  
  // New method to check assessment limits
  getAssessmentCount: async (): Promise<{ completed_assessments: number; max_limit: number; can_take_more: boolean }> => {
    const response = await api.get('/api/assessments/assessment_count/');
    return response.data;
  },
  
  // Counselor methods
  counselorSubmitResponse: async (assessmentId: number, answers: Answer[], counselorNotes: string = ''): Promise<any> => {
    try {
      ensureAuthToken();
      const response = await api.post(
        endpoints.counselorAssessments.submitResponse(assessmentId), 
        {
          answers: answers,
          counselor_notes: counselorNotes
        }
      );
      return response.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      if (err?.response?.data?.error) {
        throw new Error(err.response.data.error);
      }
      throw error;
    }
  },
  
  counselorAddNotes: async (assessmentId: number, notes: string): Promise<any> => {
    try {
      ensureAuthToken();
      const response = await api.post(
        endpoints.counselorAssessments.addNotes(assessmentId), 
        {
          notes: notes
        }
      );
      return response.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      if (err?.response?.data?.error) {
        throw new Error(err.response.data.error);
      }
      throw error;
    }
  },
  
  createAssessment: async (userId: number, title?: string, description?: string): Promise<any> => {
    try {
      ensureAuthToken();
      const response = await api.post(
        endpoints.counselorAssessments.create, 
        {
          user: userId,
          title: title || "Motivational Gift Assessment",
          description: description || "Assessment to discover spiritual motivational gifts"
        }
      );
      return response.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      if (err?.response?.data?.error) {
        throw new Error(err.response.data.error);
      }
      throw error;
    }
  },

  // New method to get user assessments as a counselor
  getUserAssessments: async (userId: number): Promise<UserAssessmentData> => {
    try {
      ensureAuthToken();
      const response = await api.get<UserAssessmentData>(
        endpoints.counselors.userAssessments(userId)
      );
      return response.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      if (err?.response?.data?.error) {
        throw new Error(err.response.data.error);
      }
      throw error;
    }
  },

  // Method to get assessment details by ID
  getAssessmentDetails: async (assessmentId: number): Promise<AssessmentSummary> => {
    try {
      ensureAuthToken();
      const response = await api.get(endpoints.counselorAssessments.details(assessmentId));
      return response.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      if (err?.response?.data?.error) {
        throw new Error(err.response.data.error);
      }
      throw error;
    }
  },
  
  // Get all counselor assessments
  getCounselorAssessments: async () => {
    try {
      ensureAuthToken();
      const response = await api.get(endpoints.counselorAssessments.list);
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