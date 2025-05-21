export interface Question {
  id: number;
  category: string;
  text: string;
  weight: number;
  gift_correlation: Record<string, number>;
}

export interface Answer {
  question_id: number;
  answer: number;
  gift_correlation: Record<string, number>;
}

export interface GiftScore {
  [key: string]: number;
}

export interface GiftDescription {
  gift: string;
  description: string;
  details: string;
}

export interface GiftDescriptions {
  primary: GiftDescription;
  secondary: GiftDescription[];
}

export interface AssessmentResult {
  scores: GiftScore;
  primary_gift: string;
  secondary_gifts: string[];
  descriptions: GiftDescriptions;
  last_assessment?: string;
  recommended_roles?: {
    primary_roles: string[];
    secondary_roles: string[];
    ministry_areas: string[];
  };
}

// New types for assessment limits and counselor functionality
export interface AssessmentLimitInfo {
  completed_assessments: number;
  max_limit: number;
  can_take_more: boolean;
}

export interface AssessmentResultsData {
  scores: GiftScore;
  primary_gift: string;
  secondary_gifts: string[];
  answers?: Answer[];
  descriptions: GiftDescriptions;
}

export interface AssessmentSummary {
  id: number;
  title: string;
  description?: string;
  created_at?: string;
  timestamp?: string;
  updated_at?: string;
  completion_status: boolean;
  counselor_notes?: string;
  is_counselor_session?: boolean;
  session_date?: string;
  results_data?: AssessmentResultsData;
}

export interface UserAssessmentData {
  assessments: AssessmentSummary[];
  completed_count: number;
  max_limit: number;
  user_id: number;
  can_take_more: boolean;
}

export interface AssessmentCreationData {
  title?: string;
  description?: string;
  user: number;
}

export interface CounselorNote {
  assessment_id: number;
  notes: string;
} 