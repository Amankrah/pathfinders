'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';

export default function DonationCancelPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          router.push('/dashboard/assessments');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center max-w-md mx-auto p-6">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Donation Cancelled
        </h2>
        
        <p className="text-gray-600 mb-6">
          No worries! You can still take the assessment completely free. 
          Your donation would have helped us continue this ministry, but we understand.
        </p>
        
        <p className="text-sm text-gray-500 mb-4">
          Remember, you can always support us later if you find the assessment helpful.
        </p>
        
        <p className="text-sm text-gray-400">
          Redirecting you back to assessments in {countdown} seconds...
        </p>
        
        <button
          onClick={() => router.push('/dashboard/assessments')}
          className="mt-4 inline-flex items-center justify-center px-4 py-2 border border-transparent 
                   text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 
                   focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500
                   transition-colors duration-200"
        >
          Go Back to Assessments
        </button>
      </div>
    </div>
  );
}
