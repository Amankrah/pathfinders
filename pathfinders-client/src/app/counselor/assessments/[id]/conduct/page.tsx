'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import ConductAssessment from '@/components/counselor/ConductAssessment';

export default function ConductAssessmentPage({ params }: { params: { id: string } }) {
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
        <h1 className="text-2xl font-bold mb-6">Conduct Assessment</h1>
        <ConductAssessment 
          assessmentId={assessmentId} 
          onComplete={() => router.push(`/counselor/assessments/${assessmentId}/results`)}
        />
      </div>
    </div>
  );
} 