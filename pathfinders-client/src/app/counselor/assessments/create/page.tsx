'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { counselorApi } from '@/services/counselor';
import Link from 'next/link';
import CounselorAssessmentManager from '@/components/counselor/CounselorAssessmentManager';
import { assessmentApi } from '@/services/assessment';

interface User {
  user_id: number;
  full_name: string;
  email: string;
  assessment_count?: number;
  max_limit?: number;
  can_take_more?: boolean;
  status?: string;
}

export default function CreateAssessmentPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      // Get user relationships from the counselor API
      const userRelations = await counselorApi.getUsers();
      console.log('User relations received:', userRelations);
      
      // Create an array to hold the full user data with assessment info
      const enhancedUsers: User[] = [];
      
      // Process each user to get their assessment information
      for (const relation of userRelations) {
        try {
          // Get assessment data for each user
          const assessmentData = await assessmentApi.getUserAssessments(relation.user.id);
          
          // Combine user data with assessment data
          enhancedUsers.push({
            user_id: relation.user.id,
            full_name: relation.user.first_name + ' ' + relation.user.last_name,
            email: relation.user.email,
            status: relation.status,
            assessment_count: assessmentData.completed_count || 0,
            max_limit: assessmentData.max_limit || 3,
            can_take_more: assessmentData.can_take_more
          });
        } catch (err) {
          console.error(`Error fetching assessments for user ${relation.user?.id}:`, err);
          // Add user with default assessment values if we can't get their assessment data
          enhancedUsers.push({
            user_id: relation.user.id,
            full_name: relation.user.first_name + ' ' + relation.user.last_name,
            email: relation.user.email,
            status: relation.status,
            assessment_count: 0,
            max_limit: 3,
            can_take_more: true
          });
        }
      }
      
      console.log('Enhanced users with assessment data:', enhancedUsers);
      setUsers(enhancedUsers);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching users:', err);
      setError(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleUserSelect = (user: User) => {
    setSelectedUser(user);
  };

  const handleAssessmentCreated = () => {
    // Redirect to the assessments list page
    router.push('/counselor/assessments');
  };

  // Filter users based on search term
  const filteredUsers = users.filter(user => {
    if (!user) return false;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      (user.full_name?.toLowerCase()?.includes(searchLower) || false) ||
      (user.email?.toLowerCase()?.includes(searchLower) || false)
    );
  });

  if (loading && users.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-800 mx-auto"></div>
          <p className="mt-3 text-gray-700">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-black">Create New Assessment</h1>
        <button
          onClick={() => router.back()}
          className="px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50 flex items-center shadow-sm"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-500 text-red-800 px-4 py-3 rounded mb-6">
          <p>{error}</p>
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-6">
        {/* User Selection Panel */}
        <div className="w-full md:w-1/3">
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-black mb-3">Select User</h2>
              <div className="relative">
                <input
                  type="text"
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <div className="absolute left-3 top-3 text-gray-500">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="overflow-y-auto" style={{ maxHeight: '400px' }}>
              {filteredUsers.length === 0 ? (
                <div className="p-4 text-center text-gray-700">
                  {searchTerm ? 'No users match your search' : 'No users found'}
                </div>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {filteredUsers.map(user => (
                    <li 
                      key={user.user_id}
                      className={`p-4 cursor-pointer hover:bg-gray-50 ${selectedUser?.user_id === user.user_id ? 'bg-blue-100' : ''}`}
                      onClick={() => handleUserSelect(user)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center">
                            <p className="text-sm font-medium text-gray-900">{user.full_name}</p>
                            {user.status && (
                              <span className={`ml-2 h-2 w-2 rounded-full ${user.status === 'active' ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                            )}
                          </div>
                          <p className="text-xs text-gray-700">{user.email}</p>
                        </div>
                        {user.assessment_count !== undefined && (
                          <div className="flex items-center">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              user.can_take_more ? 'bg-green-200 text-green-900' : 'bg-red-200 text-red-900'
                            }`}>
                              {user.assessment_count}/{user.max_limit || 3}
                            </span>
                          </div>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* Assessment Creation Panel */}
        <div className="w-full md:w-2/3">
          {selectedUser ? (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
                <h3 className="text-lg font-medium text-gray-900">Create Assessment</h3>
              </div>
              <div className="p-4">
                <CounselorAssessmentManager 
                  user={{
                    id: selectedUser.user_id,
                    full_name: selectedUser.full_name,
                    email: selectedUser.email
                  }}
                  onAssessmentCreated={handleAssessmentCreated}
                />
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <svg className="h-12 w-12 text-gray-400 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <h3 className="mt-4 text-sm font-medium text-gray-900">Select a user</h3>
              <p className="mt-2 text-sm text-gray-500">
                Choose a user from the list to create an assessment for them
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 