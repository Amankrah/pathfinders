'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { XCircle, Heart, ArrowLeft } from 'lucide-react';

export default function DonationCancelPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-6">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <XCircle className="h-16 w-16 text-yellow-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Donation Cancelled
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            Your donation was not completed. No charges were made to your account.
          </p>
        </div>
        
        <div className="text-center mb-6">
          <div className="flex justify-center mb-4">
            <Heart className="h-8 w-8 text-red-500" />
          </div>
          <p className="text-gray-600">
            If you'd like to support our ministry, you can try again anytime. Your generosity helps us continue our mission.
          </p>
        </div>
        
        <div className="space-y-3">
          <Link href="/dashboard">
            <Button className="w-full bg-blue-600 hover:bg-blue-700">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Return to Dashboard
            </Button>
          </Link>
          
          <Link href="/dashboard/donate">
            <Button variant="outline" className="w-full">
              <Heart className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
