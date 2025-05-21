'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { assessmentApi } from '@/services/assessment';
import { AssessmentSummary } from '@/types/assessment';
import Link from 'next/link';
import { formatDate, formatDateTime } from '@/utils/date-formatter';

export default function AssessmentDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const assessmentId = parseInt(params.id);
  const [assessment, setAssessment] = useState<AssessmentSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (assessmentId && !isNaN(assessmentId)) {
      fetchAssessmentDetails();
    }
  }, [assessmentId]);

  const fetchAssessmentDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await assessmentApi.getAssessmentDetails(assessmentId);
      setAssessment(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load assessment details');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!assessmentId || isNaN(assessmentId)) {
    return (
      <div className="p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          Invalid assessment ID
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Assessment Details</h1>
        <button
          onClick={() => router.back()}
          className="px-4 py-2 border border-gray-300 rounded-md bg-white"
        >
          Back
        </button>
      </div>

      {loading ? (
        <div className="text-center p-6">Loading assessment details...</div>
      ) : error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      ) : assessment ? (
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">{assessment.title}</h2>
          
          {assessment.description && (
            <div className="mb-4">
              <h3 className="text-lg font-medium mb-2">Description</h3>
              <p className="text-gray-700">{assessment.description}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <h3 className="text-lg font-medium mb-2">Status</h3>
              <span 
                className={`px-3 py-1 rounded-full text-sm ${
                  assessment.completion_status 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}
              >
                {assessment.completion_status ? 'Completed' : 'Pending'}
              </span>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-2">Created</h3>
              <p className="text-gray-700">
                {formatDate(assessment.created_at || assessment.timestamp)}
              </p>
              {(assessment.created_at || assessment.timestamp) && (
                <p className="text-xs text-gray-500">
                  {formatDateTime(assessment.created_at || assessment.timestamp)}
                </p>
              )}
            </div>
          </div>

          {assessment.session_date && (
            <div className="mb-4">
              <h3 className="text-lg font-medium mb-2">Session Date</h3>
              <p className="text-gray-700">
                {formatDateTime(assessment.session_date)}
              </p>
            </div>
          )}

          {assessment.counselor_notes && (
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-2">Counselor Notes</h3>
              <div className="p-4 bg-gray-50 rounded-md">
                <p className="text-gray-700">{assessment.counselor_notes}</p>
              </div>
            </div>
          )}

          <div className="mt-6 flex space-x-4">
            {assessment.completion_status ? (
              <Link
                href={`/counselor/assessments/${assessmentId}/results`}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                View Results
              </Link>
            ) : (
              <Link
                href={`/counselor/assessments/${assessmentId}/conduct`}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Conduct Assessment
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center p-6">Assessment not found</div>
      )}
    </div>
  );
} 