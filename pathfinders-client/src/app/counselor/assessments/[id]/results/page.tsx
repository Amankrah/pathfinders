'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import AssessmentResults from '@/components/counselor/AssessmentResults';
import Link from 'next/link';

export default function AssessmentResultsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const assessmentId = parseInt(params.id);

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
        <h1 className="text-2xl font-bold">Assessment Results</h1>
        <div className="flex space-x-3">
          <Link
            href={`/counselor/assessments/${assessmentId}`}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md bg-white hover:bg-gray-50"
          >
            Details
          </Link>
          <button
            onClick={() => router.back()}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md bg-white hover:bg-gray-50"
          >
            Back
          </button>
        </div>
      </div>
      <div className="bg-gray-50 rounded-lg p-1">
        <AssessmentResults assessmentId={assessmentId} />
      </div>
    </div>
  );
} 