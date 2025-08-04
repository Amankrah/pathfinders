'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Loading } from '@/components/ui/loading';

export default function DonationSuccessPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [processing, setProcessing] = useState(true);

  useEffect(() => {
    // Simply redirect back to dashboard after showing success message
    const timer = setTimeout(() => {
      setProcessing(false);
      // Give user time to read the message, then redirect
      setTimeout(() => {
        router.push('/dashboard/assessments');
      }, 3000);
    }, 2000);

    return () => clearTimeout(timer);
  }, [router]);

  if (processing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loading size="large" />
          <h2 className="mt-4 text-xl font-semibold text-gray-900">
            Processing your donation...
          </h2>
          <p className="mt-2 text-gray-600">
            Please wait while we confirm your donation
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center max-w-md mx-auto p-6">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
          </svg>
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Thank You for Your Donation! 🙏
        </h2>
        
        <p className="text-gray-600 mb-6">
          Your generous contribution helps us continue providing free assessments and resources 
          to help people discover their God-given gifts. May God bless you for your generosity!
        </p>
        
        <p className="text-sm text-gray-500 mb-4">
          You will receive a confirmation email shortly.
        </p>
        
        <p className="text-sm text-gray-400">
          Redirecting you back to assessments in a few seconds...
        </p>
      </div>
    </div>
  );
}
