'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { counselorApi } from '@/services/counselor';
import { paymentApi } from '@/services/payment';
import Link from 'next/link';
import CounselorAssessmentManager from '@/components/counselor/CounselorAssessmentManager';
import { assessmentApi } from '@/services/assessment';
import { toast } from 'sonner';
import { Loading } from '@/components/ui/loading';

interface User {
  user_id: number;
  full_name: string;
  email: string;
  assessment_count?: number;
  max_limit?: number;
  can_take_more?: boolean;
  status?: string;
  payment_status?: 'paid' | 'unpaid';
}

export default function CreateAssessmentPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState(false);
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
      
      // Process each user to get their assessment information and payment status
      for (const relation of userRelations) {
        try {
          // Get assessment data for each user
          const assessmentData = await assessmentApi.getUserAssessments(relation.user_id);
          const paymentStatus = await paymentApi.validatePayment(relation.user_id);
          
          // Combine user data with assessment data
          enhancedUsers.push({
            user_id: relation.user_id,
            full_name: relation.user.first_name + ' ' + relation.user.last_name,
            email: relation.user.email,
            status: relation.status,
            assessment_count: assessmentData.completed_count || 0,
            max_limit: assessmentData.max_limit || 3,
            can_take_more: assessmentData.can_take_more,
            payment_status: paymentStatus.is_valid ? 'paid' : 'unpaid'
          });
        } catch (err) {
          console.error(`Error fetching data for user ${relation.user_id}:`, err);
        }
      }
      
      console.log('Enhanced users with assessment and payment data:', enhancedUsers);
      setUsers(enhancedUsers);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching users:', err);
      setError(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentForUser = async (user: User) => {
    try {
      setProcessingPayment(true);
      
      // Create checkout session for the user
      const { checkoutUrl } = await paymentApi.createUserCheckoutSession(user.user_id);
      
      // Store the current user selection in localStorage
      localStorage.setItem('selectedUserId', user.user_id.toString());
      
      // Redirect to Stripe Checkout
      window.location.href = checkoutUrl;
    } catch (error: any) {
      toast.error(error.message || 'Failed to process payment');
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleCreateAssessment = async (user: User) => {
    try {
      setLoading(true);
      
      // Validate payment first
      const paymentValidation = await paymentApi.validatePayment(user.user_id);
      
      if (!paymentValidation.is_valid) {
        toast.error('User needs to complete payment before taking assessment');
        return;
      }

      // Create the assessment
      const assessment = await counselorApi.createAssessment(user.user_id);
      
      toast.success('Assessment created successfully');
      router.push(`/counselor/assessments/${assessment.id}`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to create assessment');
    } finally {
      setLoading(false);
    }
  };

  const handleUserSelect = (user: User) => {
    setSelectedUser(user);
  };

  // Filter users based on search term
  const filteredUsers = users.filter(user => {
    if (!user) return false;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      user.full_name?.toLowerCase().includes(searchLower) ||
      user.email?.toLowerCase().includes(searchLower)
    );
  });

  if (loading && users.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loading size="large" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-black">Create New Assessment</h1>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-500 text-red-800 px-4 py-3 rounded mb-6">
          <p>{error}</p>
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-6">
        {/* User Selection Panel */}
        <div className="w-full md:w-1/2 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Select User</h3>
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search users..."
              className="w-full px-4 py-2 border rounded-md"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="overflow-y-auto max-h-96">
            {filteredUsers.map((user) => (
              <div
                key={user.user_id}
                className={`p-4 mb-2 rounded-md cursor-pointer border transition-colors ${
                  selectedUser?.user_id === user.user_id
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-200 hover:border-indigo-300'
                }`}
                onClick={() => handleUserSelect(user)}
              >
                <h4 className="font-medium">{user.full_name}</h4>
                <p className="text-sm text-gray-600">{user.email}</p>
                <div className="mt-2 flex justify-between items-center">
                  <span className={`px-2 py-1 rounded-full text-sm ${
                    user.can_take_more 
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {user.assessment_count} / {user.max_limit} Assessments
                  </span>
                  <span className={`px-2 py-1 rounded-full text-sm ${
                    user.payment_status === 'paid'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {user.payment_status === 'paid' ? 'Paid' : 'Payment Required'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Assessment Creation Panel */}
        <div className="w-full md:w-1/2 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Create Assessment</h3>
          {selectedUser ? (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-md">
                <h4 className="font-medium">Selected User</h4>
                <p className="text-gray-600">{selectedUser.full_name}</p>
                <p className="text-sm text-gray-500">{selectedUser.email}</p>
              </div>
              
              {!selectedUser.can_take_more ? (
                <div className="text-red-600 text-sm">
                  This user has reached their assessment limit.
                </div>
              ) : (
                <>
                  {selectedUser.payment_status === 'paid' ? (
                    <button
                      onClick={() => handleCreateAssessment(selectedUser)}
                      className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 
                               focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
                               transition-colors duration-200"
                      disabled={loading || processingPayment}
                    >
                      {loading ? 'Creating...' : 'Create Assessment'}
                    </button>
                  ) : (
                    <button
                      onClick={() => handlePaymentForUser(selectedUser)}
                      className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 
                               focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2
                               transition-colors duration-200"
                      disabled={loading || processingPayment}
                    >
                      {processingPayment ? 'Processing...' : 'Process Payment for User'}
                    </button>
                  )}
                </>
              )}
            </div>
          ) : (
            <div className="text-gray-500 text-center py-8">
              Select a user to create an assessment
            </div>
          )}
        </div>
      </div>
    </div>
  );
}