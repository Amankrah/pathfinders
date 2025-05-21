'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { counselorApi } from '@/services/counselor';
import Link from 'next/link';
import CounselorAssessmentManager from '@/components/counselor/CounselorAssessmentManager';

interface User {
  user_id: number;
  full_name: string;
  email: string;
  assessment_count?: number;
  max_limit?: number;
  can_take_more?: boolean;
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
      const userData = await counselorApi.getUsers();
      setUsers(userData);
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
    const searchLower = searchTerm.toLowerCase();
    return (
      user.full_name.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower)
    );
  });

  if (loading && users.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700 mx-auto"></div>
          <p className="mt-3 text-gray-600">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Create New Assessment</h1>
        <button
          onClick={() => router.back()}
          className="px-4 py-2 border border-gray-300 rounded-md bg-white"
        >
          Back
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          <p>{error}</p>
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-6">
        {/* User Selection Panel */}
        <div className="w-full md:w-1/3">
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-medium mb-3">Select User</h2>
              <div className="relative">
                <input
                  type="text"
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <div className="absolute left-3 top-3 text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="overflow-y-auto" style={{ maxHeight: '400px' }}>
              {filteredUsers.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  {searchTerm ? 'No users match your search' : 'No users found'}
                </div>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {filteredUsers.map(user => (
                    <li 
                      key={user.user_id}
                      className={`p-4 cursor-pointer hover:bg-gray-50 ${selectedUser?.user_id === user.user_id ? 'bg-blue-50' : ''}`}
                      onClick={() => handleUserSelect(user)}
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900">{user.full_name}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                        {user.assessment_count !== undefined && (
                          <p className="text-xs mt-1">
                            <span className={`px-2 py-1 rounded-full ${
                              user.can_take_more ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {user.assessment_count}/{user.max_limit || 3} Assessments
                            </span>
                          </p>
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
            <CounselorAssessmentManager 
              user={{
                id: selectedUser.user_id,
                full_name: selectedUser.full_name,
                email: selectedUser.email
              }}
              onAssessmentCreated={handleAssessmentCreated}
            />
          ) : (
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <svg className="h-12 w-12 text-gray-400 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">Select a user</h3>
              <p className="mt-1 text-sm text-gray-500">
                Select a user from the list to create an assessment for them
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 