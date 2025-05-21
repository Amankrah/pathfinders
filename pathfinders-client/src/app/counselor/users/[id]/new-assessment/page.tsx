'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { counselorApi } from '@/services/counselor';
import CounselorAssessmentManager from '@/components/counselor/CounselorAssessmentManager';

interface User {
  id: number;
  full_name: string;
  email: string;
  assessment_count?: number;
}

export default function NewAssessmentPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const userId = parseInt(params.id);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (userId && !isNaN(userId)) {
      fetchUserDetails();
    }
  }, [userId]);

  const fetchUserDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const userData = await counselorApi.getUserDetails(userId);
      setUser({
        id: userId,
        full_name: userData.user.full_name,
        email: userData.user.email,
        assessment_count: userData.assessments?.length || 0
      });
    } catch (err: any) {
      console.error('Error fetching user details:', err);
      setError(err.message || 'Failed to load user details');
    } finally {
      setLoading(false);
    }
  };

  const handleAssessmentCreated = () => {
    // Redirect to the user detail page after creation
    router.push(`/counselor/users/${userId}`);
  };

  if (!userId || isNaN(userId)) {
    return (
      <div className="p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          Invalid user ID
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700 mx-auto"></div>
          <p className="mt-3 text-gray-600">Loading user details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
        <div className="mt-4">
          <button
            onClick={() => router.back()}
            className="px-4 py-2 border border-gray-300 rounded-md bg-white"
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-6">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
          User not found
        </div>
        <div className="mt-4">
          <button
            onClick={() => router.back()}
            className="px-4 py-2 border border-gray-300 rounded-md bg-white"
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Create New Assessment</h1>
        <button
          onClick={() => router.back()}
          className="px-4 py-2 border border-gray-300 rounded-md bg-white"
        >
          Back
        </button>
      </div>
      
      <CounselorAssessmentManager 
        user={user}
        onAssessmentCreated={handleAssessmentCreated}
      />
    </div>
  );
} 