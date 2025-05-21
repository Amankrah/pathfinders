'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import Link from 'next/link';
import { counselorApi } from '@/services/counselor';
import { assessmentApi } from '@/services/assessment';

interface User {
  user_id: number;
  full_name: string;
  email: string;
  status: string;
  assessment_count: number;
  max_limit: number;
  can_take_more: boolean;
  assessments: Assessment[];
  gift_profile: GiftProfile | null;
}

interface Assessment {
  id: number;
  completion_status: boolean;
  created_at: string;
  counselor_notes?: string;
  results?: any;
}

interface GiftProfile {
  primary_gift: string;
  secondary_gifts: string[];
  scores: Record<string, number>;
  timestamp: string;
}

interface RecentAssessment {
  id: number;
  title: string;
  user_id: number;
  user_name: string;
  completion_status: boolean;
}

export default function CounselorDashboard() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalAssessments: 0,
    completedAssessments: 0,
    pendingAssessments: 0,
    usersAtLimit: 0,
    recentAssessments: [] as RecentAssessment[]
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Get auth token from localStorage
      const token = localStorage.getItem('token') || localStorage.getItem('counselorToken');
      if (!token) {
        setError('Authentication token not found. Please login again.');
        setLoading(false);
        return;
      }

      // Set auth header
      api.defaults.headers.common['Authorization'] = `Token ${token}`;
      
      try {
        // Get user data using the counselor API service
        const userData = await counselorApi.getDashboard();
        console.log('User data:', userData);
        setUsers(userData);
      
        // Get assessment data using the assessment API service
        const assessmentData = await assessmentApi.getCounselorAssessments();
        console.log('Assessment data:', assessmentData);
      
        // Calculate dashboard stats
        const totalUsers = userData.length;
        let totalAssessments = 0;
        let completedAssessments = 0;
        let pendingAssessments = 0;
        let usersAtLimit = 0;

        userData.forEach((user: User) => {
          const userAssessments = user.assessments?.length || 0;
          totalAssessments += userAssessments;
          
          user.assessments?.forEach((assessment: Assessment) => {
            if (assessment.completion_status) {
              completedAssessments += 1;
            } else {
              pendingAssessments += 1;
            }
          });
          
          if (!user.can_take_more) {
            usersAtLimit += 1;
          }
        });
        
        // Create a map of user IDs to names for easy lookup
        const userMap = new Map<number, string>();
        userData.forEach((user: User) => {
          userMap.set(user.user_id, user.full_name);
        });
        
        console.log('User ID to name mapping:', [...userMap.entries()]);
        
        // Get recent assessments with user names
        const fetchUserDetails = async (assessmentObj: any) => {
          if (!assessmentObj.user_name && assessmentObj.user) {
            try {
              // Try to get user name from the map first
              let userName = userMap.get(assessmentObj.user);
              
              // If not in the map, try to fetch user details
              if (!userName) {
                const userDetails = await counselorApi.getUserDetails(assessmentObj.user);
                userName = userDetails.user.full_name;
              }
              
              return {
                ...assessmentObj,
                user_name: userName || `User #${assessmentObj.user}`
              };
            } catch (err) {
              console.error(`Error fetching user details for assessment ${assessmentObj.id}:`, err);
              return {
                ...assessmentObj,
                user_name: `User #${assessmentObj.user}`
              };
            }
          }
          return assessmentObj;
        };
        
        // Process each assessment to ensure we have user names
        const processedAssessments = await Promise.all(
          assessmentData.slice(0, 5).map(fetchUserDetails)
        );
        
        const recentAssessments = processedAssessments.map((assessment: any) => ({
          id: assessment.id,
          title: assessment.title || 'Motivational Gift Assessment',
          user_id: assessment.user,
          user_name: assessment.user_name || `User #${assessment.user}`,
          completion_status: assessment.completion_status
        }));

        console.log('Final recent assessments:', recentAssessments);

        setStats({
          totalUsers,
          totalAssessments,
          completedAssessments,
          pendingAssessments,
          usersAtLimit,
          recentAssessments
        });
        
        setError(null);
      } catch (err: any) {
        console.error('Error fetching dashboard data:', err);
        setError(err.response?.data?.error || 'Failed to load dashboard data');
      }
    } catch (err: any) {
      console.error('Error fetching dashboard data:', err);
      setError(err.response?.data?.error || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700 mx-auto"></div>
          <p className="mt-3 text-gray-600">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
        <p className="font-bold">Error</p>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Counselor Dashboard</h1>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm font-medium">Total Users</h3>
          <p className="text-2xl font-bold">{stats.totalUsers}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm font-medium">Total Assessments</h3>
          <p className="text-2xl font-bold">{stats.totalAssessments}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm font-medium">Completed Assessments</h3>
          <p className="text-2xl font-bold text-green-600">{stats.completedAssessments}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm font-medium">Pending Assessments</h3>
          <p className="text-2xl font-bold text-amber-500">{stats.pendingAssessments}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm font-medium">Users at Limit</h3>
          <p className="text-2xl font-bold text-red-600">{stats.usersAtLimit}</p>
        </div>
      </div>

      {/* Recent Assessments */}
      <div className="bg-white rounded-lg shadow mb-8">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-medium">Recent Assessments</h2>
          <Link href="/counselor/assessments" className="text-sm text-blue-600 hover:text-blue-800">
            View All
          </Link>
        </div>
        <div className="overflow-x-auto">
          {stats.recentAssessments.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No assessments found. Create an assessment to get started.
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stats.recentAssessments.map(assessment => (
                  <tr key={assessment.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{assessment.title}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{assessment.user_name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${assessment.completion_status ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                        {assessment.completion_status ? 'Completed' : 'Pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Link
                        href={`/counselor/assessments/${assessment.id}`}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        View
                      </Link>
                      {!assessment.completion_status && (
                        <Link
                          href={`/counselor/assessments/${assessment.id}/conduct`}
                          className="text-green-600 hover:text-green-900"
                        >
                          Conduct
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Recent Users */}
      <div className="bg-white rounded-lg shadow mb-8">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-medium">Recent Users</h2>
          <Link href="/counselor/users" className="text-sm text-blue-600 hover:text-blue-800">
            View All
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assessments
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Primary Gift
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.slice(0, 5).map(user => (
                <tr key={user.user_id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{user.full_name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${user.status === 'active' ? 'bg-green-100 text-green-800' : 
                        user.status === 'inactive' ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-gray-100 text-gray-800'}`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {user.assessment_count}/{user.max_limit}
                      {!user.can_take_more && (
                        <span className="ml-2 text-xs text-red-600 font-medium">Limit reached</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {user.gift_profile ? user.gift_profile.primary_gift : '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <Link
                      href={`/counselor/users/${user.user_id}`}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      View
                    </Link>
                    <Link
                      href={`/counselor/users/${user.user_id}/new-assessment`}
                      className="text-green-600 hover:text-green-900"
                    >
                      New Assessment
                    </Link>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                    No users found. Start by registering a new user.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {users.length > 5 && (
          <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 text-right">
            <Link
              href="/counselor/users"
              className="text-sm font-medium text-blue-600 hover:text-blue-500"
            >
              View all users
            </Link>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium">Quick Actions</h2>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <Link
            href="/counselor/users/register"
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Register New User
          </Link>
          <Link
            href="/counselor/assessments/create"
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
          >
            Create Assessment
          </Link>
          <Link
            href="/counselor/users"
            className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            Manage Users
          </Link>
          <Link
            href="/counselor/assessments"
            className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            All Assessments
          </Link>
        </div>
      </div>
    </div>
  );
} 