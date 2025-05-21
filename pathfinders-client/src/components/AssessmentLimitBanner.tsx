import React, { useEffect, useState } from 'react';
import { assessmentApi } from '@/services/assessment';

interface AssessmentLimitInfo {
  completed_assessments: number;
  max_limit: number;
  can_take_more: boolean;
}

const AssessmentLimitBanner: React.FC = () => {
  const [limitInfo, setLimitInfo] = useState<AssessmentLimitInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLimitInfo = async () => {
      try {
        setLoading(true);
        const data = await assessmentApi.getAssessmentCount();
        setLimitInfo(data);
        setError(null);
      } catch (err) {
        setError('Failed to load assessment count information');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchLimitInfo();
  }, []);

  if (loading) {
    return <div className="p-3 bg-gray-100 rounded">Loading assessment information...</div>;
  }

  if (error || !limitInfo) {
    return null; // Don't show anything if there's an error
  }

  const { completed_assessments, max_limit, can_take_more } = limitInfo;

  if (!can_take_more) {
    return (
      <div className="p-4 mb-4 text-white bg-red-600 rounded-md">
        <p className="font-semibold">
          Assessment Limit Reached: You have completed all {max_limit} allowed assessments.
        </p>
        <p className="text-sm mt-1">
          Please contact a counselor if you would like to take another assessment.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 mb-4 bg-blue-50 border border-blue-200 rounded-md">
      <p>
        <span className="font-semibold">Assessment Progress:</span> You have completed {completed_assessments} of {max_limit} allowed assessments.
      </p>
      {completed_assessments > 0 && (
        <p className="text-sm mt-1">
          You can view your previous assessment results in your profile.
        </p>
      )}
    </div>
  );
};

export default AssessmentLimitBanner; 