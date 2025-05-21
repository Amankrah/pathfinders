'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import RegisterUserForm from '@/components/counselor/RegisterUserForm';
import Link from 'next/link';

export default function RegisterUserPage() {
  const router = useRouter();
  const [registeredUserId, setRegisteredUserId] = useState<number | null>(null);

  const handleUserRegistered = (userId: number) => {
    setRegisteredUserId(userId);
    
    // Display success message for 2 seconds before redirecting
    setTimeout(() => {
      router.push(`/counselor/users/${userId}`);
    }, 2000);
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Register New User</h1>
        <Link
          href="/counselor/users"
          className="px-4 py-2 border border-gray-300 rounded-md bg-white"
        >
          Back to Users
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <p className="text-gray-600 mb-4">
          Register a new user for your practice. They will receive a randomly generated password 
          and will be automatically linked to your counselor account.
        </p>
        <p className="text-gray-600">
          Once registered, you can immediately create assessments for this user or view their profile.
        </p>
      </div>

      <RegisterUserForm 
        onUserRegistered={handleUserRegistered}
      />

      {registeredUserId && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mt-6 animate-pulse">
          User registered successfully! Redirecting to user profile...
        </div>
      )}
    </div>
  );
} 