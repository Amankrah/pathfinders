'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { counselorApi } from '@/services/counselor';
import { assessmentApi } from '@/services/assessment';
import UserAssessmentList from '@/components/counselor/UserAssessmentList';

interface User {
  id: number;
  full_name: string;
  email: string;
  status?: string;
  notes?: string;
  assessment_count?: number;
  max_limit?: number;
  can_take_more?: boolean;
}

export default function UserDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const userId = parseInt(params.id);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [assessmentLimit, setAssessmentLimit] = useState({
    count: 0,
    max: 3,
    canTakeMore: true
  });

  useEffect(() => {
    if (userId && !isNaN(userId)) {
      fetchUserDetails();
    }
  }, [userId]);

  const fetchUserDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch user details from the counselor API
      const userData = await counselorApi.getUserDetails(userId);
      
      // Get assessment limit information
      let assessmentData;
      try {
        assessmentData = await assessmentApi.getUserAssessments(userId);
      } catch (err) {
        console.error('Error fetching assessment data:', err);
        assessmentData = { completed_count: 0, max_limit: 3, can_take_more: true };
      }
      
      // Update assessment limit state
      setAssessmentLimit({
        count: assessmentData.completed_count || 0,
        max: assessmentData.max_limit || 3,
        canTakeMore: assessmentData.can_take_more
      });
      
      // Format user data from the API response
      setUser({
        id: userId,
        full_name: userData.user.full_name,
        email: userData.user.email,
        status: userData.user.status,
        notes: userData.user.notes,
        assessment_count: assessmentData.completed_count || 0,
        max_limit: assessmentData.max_limit || 3,
        can_take_more: assessmentData.can_take_more
      });
    } catch (err: any) {
      console.error('Error fetching user details:', err);
      setError(err.message || 'Failed to load user details');
    } finally {
      setLoading(false);
    }
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">User Details</h1>
        <div className="flex space-x-3">
          <Link
            href={`/counselor/users/${userId}/new-assessment`}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
          >
            Create Assessment
          </Link>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 border border-gray-300 rounded-md bg-white"
          >
            Back
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">{user.full_name}</h2>
            {user.status && (
              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
              }`}>
                {user.status}
              </span>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="text-sm font-medium">{user.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Assessment Limit</p>
              <p className="text-sm font-medium">
                {user.assessment_count || 0}/{user.max_limit || 3}
                {user.can_take_more === false && (
                  <span className="ml-2 text-xs text-red-600 font-medium">Limit reached</span>
                )}
              </p>
            </div>
            {user.notes && (
              <div className="md:col-span-2">
                <p className="text-sm text-gray-500">Notes</p>
                <p className="text-sm font-medium">{user.notes}</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Assessments Section */}
        <div className="p-6">
          <UserAssessmentList 
            user={{
              id: user.id,
              full_name: user.full_name,
              email: user.email
            }}
            refreshData={fetchUserDetails}
          />
        </div>
      </div>
    </div>
  );
} 