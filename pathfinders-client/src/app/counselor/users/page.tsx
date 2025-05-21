'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import Link from 'next/link';
import UserAssessmentList from '@/components/counselor/UserAssessmentList';
import { useCounselorAuth } from '@/contexts/counselor-auth-context';
import { counselorApi } from '@/services/counselor';
import { assessmentApi } from '@/services/assessment';

interface User {
  user_id: number;
  full_name: string;
  email: string;
  status: string;
  notes?: string;
  created_at: string;
  assessment_count: number;
  max_limit: number;
  can_take_more: boolean;
}

export default function CounselorUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const { isAuthenticated } = useCounselorAuth();

  useEffect(() => {
    if (isAuthenticated()) {
      fetchUsers();
    }
  }, [isAuthenticated]);

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
            notes: relation.notes || '',
            created_at: relation.created_at,
            assessment_count: assessmentData.completed_count || 0,
            max_limit: assessmentData.max_limit || 3,
            can_take_more: assessmentData.can_take_more
          });
        } catch (err) {
          console.error(`Error fetching assessments for user ${relation.user.id}:`, err);
          // Add user with default assessment values if we can't get their assessment data
          enhancedUsers.push({
            user_id: relation.user.id,
            full_name: relation.user.first_name + ' ' + relation.user.last_name,
            email: relation.user.email,
            status: relation.status,
            notes: relation.notes || '',
            created_at: relation.created_at,
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
      setError(err.response?.data?.error || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleUserSelect = (user: User) => {
    setSelectedUser(prevUser => {
      // Toggle selection if clicking the same user
      return prevUser?.user_id === user.user_id ? null : user;
    });
  };

  // Filter users based on search term
  const filteredUsers = users.filter(user => {
    // Skip filtering if user data is invalid
    if (!user || typeof user !== 'object') return false;
    
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700 mx-auto"></div>
          <p className="mt-3 text-gray-600">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Manage Users</h1>
        <Link
          href="/counselor/users/register"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
        >
          Register New User
        </Link>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-6">
        {/* User List Panel */}
        <div className="w-full md:w-1/3">
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b border-gray-200">
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
            <div className="overflow-y-auto" style={{ maxHeight: '600px' }}>
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
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{user.full_name}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                        <div className="flex items-center">
                          <span className={`px-2 py-1 text-xs rounded-full ${!user.can_take_more ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                            {user.assessment_count}/{user.max_limit}
                          </span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* User Details Panel */}
        <div className="w-full md:w-2/3">
          {selectedUser ? (
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">{selectedUser.full_name}</h2>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${selectedUser.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {selectedUser.status}
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="text-sm font-medium">{selectedUser.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Created</p>
                    <p className="text-sm font-medium">{new Date(selectedUser.created_at).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Assessment Limit</p>
                    <p className="text-sm font-medium">
                      {selectedUser.assessment_count}/{selectedUser.max_limit}
                      {!selectedUser.can_take_more && (
                        <span className="ml-2 text-xs text-red-600 font-medium">Limit reached</span>
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Notes</p>
                    <p className="text-sm font-medium">{selectedUser.notes || 'No notes'}</p>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <Link
                    href={`/counselor/users/${selectedUser.user_id}/edit`}
                    className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Edit User
                  </Link>
                  <Link
                    href={`/counselor/users/${selectedUser.user_id}/new-assessment`}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Create Assessment
                  </Link>
                </div>
              </div>
              
              {/* Assessments Section */}
              <div className="p-6">
                <UserAssessmentList 
                  user={{
                    id: selectedUser.user_id,
                    full_name: selectedUser.full_name,
                    email: selectedUser.email
                  }}
                  refreshData={fetchUsers}
                />
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <svg className="h-12 w-12 text-gray-400 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">Select a user</h3>
              <p className="mt-1 text-sm text-gray-500">
                Click on a user from the list to view their details and assessments
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 