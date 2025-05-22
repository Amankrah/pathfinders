import React, { useState } from 'react';
import { assessmentApi } from '@/services/assessment';

interface User {
  id: number;
  full_name: string;
  email: string;
  assessment_count?: number;
}

interface CounselorAssessmentManagerProps {
  user: User;
  onAssessmentCreated?: () => void;
}

const CounselorAssessmentManager: React.FC<CounselorAssessmentManagerProps> = ({ 
  user, 
  onAssessmentCreated 
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [assessmentTitle, setAssessmentTitle] = useState("Motivational Gift Assessment");
  const [assessmentDescription, setAssessmentDescription] = useState(
    "Assessment to discover spiritual motivational gifts"
  );

  const handleCreateAssessment = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      const response = await assessmentApi.createAssessment(
        user.id,
        assessmentTitle,
        assessmentDescription
      );
      
      setSuccess(`Assessment created successfully for ${user.full_name}`);
      
      if (onAssessmentCreated) {
        onAssessmentCreated();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create assessment');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-4">
        <p className="text-sm text-gray-600 mb-2">Creating assessment for:</p>
        <div className="p-3 bg-blue-50 rounded-md border border-blue-100">
          <p className="font-medium text-gray-900">{user.full_name}</p>
          <p className="text-sm text-gray-700">{user.email}</p>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}
      
      <div className="space-y-4">
        <div>
          <label htmlFor="assessment-title" className="block text-sm font-medium text-gray-700 mb-1">
            Assessment Title
          </label>
          <input
            id="assessment-title"
            type="text"
            value={assessmentTitle}
            onChange={(e) => setAssessmentTitle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Assessment Title"
          />
        </div>
        
        <div>
          <label htmlFor="assessment-description" className="block text-sm font-medium text-gray-700 mb-1">
            Assessment Description
          </label>
          <textarea
            id="assessment-description"
            value={assessmentDescription}
            onChange={(e) => setAssessmentDescription(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Assessment Description"
          />
        </div>
        
        <div className="flex justify-end">
          <button
            onClick={handleCreateAssessment}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 flex items-center"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating...
              </>
            ) : (
              'Create Assessment'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CounselorAssessmentManager; 