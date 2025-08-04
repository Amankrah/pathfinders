'use client';

import { useAuth } from '@/contexts/auth-context';
import { Card } from '@/components/ui/card';
import { Loading } from '@/components/ui/loading';
import { donationApi } from '@/services/payment';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useState } from 'react';

export default function AssessmentsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [showDonationForm, setShowDonationForm] = useState(false);
  const [donationAmount, setDonationAmount] = useState('');
  const [donationMessage, setDonationMessage] = useState('');
  const [processingDonation, setProcessingDonation] = useState(false);

  const handleStartAssessment = () => {
    if (!user) return;
    
    // Assessments are now free - directly redirect to take assessment
    router.push('/dashboard/assessments/take');
  };

  const handleDonation = async (method: 'stripe' | 'mtn') => {
    if (!user) return;

    const amount = parseFloat(donationAmount);
    if (!amount || amount <= 0) {
      toast.error('Please enter a valid donation amount');
      return;
    }

    try {
      setProcessingDonation(true);

      if (method === 'stripe') {
        const { checkout_url } = await donationApi.createStripeDonation(amount, 'usd', donationMessage);
        toast.info('Redirecting to donation page...');
        window.location.href = checkout_url;
      } else if (method === 'mtn') {
        // For MTN, we'll need a phone number - this is a simplified version
        const phoneNumber = prompt('Please enter your MTN phone number:');
        if (!phoneNumber) {
          toast.error('Phone number is required for MTN Mobile Money');
          return;
        }
        
        const response = await donationApi.createMTNDonation(amount, phoneNumber, 'UGX', donationMessage);
        toast.success(response.message);
        // Show instructions to user
        console.log('MTN Instructions:', response.instructions);
      }
    } catch (error: any) {
      console.error('Donation error:', error);
      toast.error(error.message || 'Failed to process donation');
    } finally {
      setProcessingDonation(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loading size="large" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Motivational Gifts Assessment</h1>
      </div>

      <Card className="p-6 bg-white shadow-lg">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          {user.latest_assessment?.is_complete ? 'Take Another Assessment' : 'Start Your Assessment'}
        </h2>
        
        <p className="text-gray-600 mb-6">
          {user.latest_assessment?.is_complete 
            ? 'Continue exploring your Romans 12:6-8 gifts through another assessment.'
            : 'Discover your motivational gifts to better understand your purpose in life, career, and ministry.'}
        </p>
        
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <p className="text-green-800 font-medium mb-2">🎉 Great News!</p>
          <p className="text-green-700">
            Assessments are now completely free! You can take the assessment without any payment required.
          </p>
        </div>

        <button
          onClick={handleStartAssessment}
          className="inline-flex items-center justify-center px-6 py-3 border border-transparent 
                   text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 
                   focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500
                   transition-colors duration-200"
        >
          {user.latest_assessment?.is_complete ? 'Take New Assessment' : 'Start Assessment'}
        </button>
      </Card>

      {/* Donation Section */}
      <Card className="p-6 bg-white shadow-lg">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Support Our Ministry</h2>
        <p className="text-gray-600 mb-6">
          Help us continue providing free assessments and resources to discover God's gifts. 
          Your generous donation makes this ministry possible.
        </p>
        
        {!showDonationForm ? (
          <button
            onClick={() => setShowDonationForm(true)}
            className="inline-flex items-center justify-center px-6 py-3 border border-transparent 
                     text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700 
                     focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500
                     transition-colors duration-200"
          >
            💝 Make a Donation
          </button>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Donation Amount (USD)
              </label>
              <input
                type="number"
                value={donationAmount}
                onChange={(e) => setDonationAmount(e.target.value)}
                placeholder="25.00"
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm 
                         focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Optional Message
              </label>
              <textarea
                value={donationMessage}
                onChange={(e) => setDonationMessage(e.target.value)}
                placeholder="Thank you for this ministry..."
                rows={3}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm 
                         focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            
            <div className="flex space-x-4">
              <button
                onClick={() => handleDonation('stripe')}
                disabled={processingDonation}
                className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent 
                         text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 
                         focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                         disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                💳 Donate with Card
              </button>
              
              <button
                onClick={() => handleDonation('mtn')}
                disabled={processingDonation}
                className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent 
                         text-sm font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700 
                         focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500
                         disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                📱 MTN Mobile Money
              </button>
            </div>
            
            <button
              onClick={() => setShowDonationForm(false)}
              className="text-gray-500 hover:text-gray-700 text-sm"
            >
              Cancel
            </button>
          </div>
        )}
      </Card>

      {user.assessment_count > 0 && (
        <Card className="p-6 bg-white shadow-lg">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Assessment History</h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Assessments Completed</p>
              <p className="text-2xl font-bold text-gray-900">{user.assessment_count}</p>
            </div>
            {user.latest_assessment && (
              <div>
                <p className="text-sm font-medium text-gray-500">Latest Assessment</p>
                <p className="text-base text-gray-900">
                  {new Date(user.latest_assessment.timestamp).toLocaleDateString()}
                  <span className="ml-2 px-2 py-1 text-sm rounded-full bg-green-100 text-green-800">
                    Completed
                  </span>
                </p>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}