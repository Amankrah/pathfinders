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
    <div>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Assessment Results</h1>
          <div className="flex space-x-3">
            <Link
              href={`/counselor/assessments/${assessmentId}`}
              className="px-4 py-2 border border-gray-300 rounded-md bg-white"
            >
              Details
            </Link>
            <button
              onClick={() => router.back()}
              className="px-4 py-2 border border-gray-300 rounded-md bg-white"
            >
              Back
            </button>
          </div>
        </div>
        <AssessmentResults assessmentId={assessmentId} />
      </div>
    </div>
  );
} 