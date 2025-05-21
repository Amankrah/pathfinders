'use client';

import Link from 'next/link';
import { RegisterForm } from '@/components/auth/register-form';
import { Gift, Target, BookOpen, ArrowRight } from 'lucide-react';

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex bg-gradient-to-br from-indigo-50 via-white to-blue-50">
      {/* Left side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Begin Your Journey
            </h1>
            <p className="text-lg text-gray-600 mb-4">
              Discover your God-given motivational gifts and find your purpose
            </p>
          </div>

          <RegisterForm />

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link
                href="/login"
                className="font-medium text-indigo-600 hover:text-indigo-500 
                  transition-colors duration-200"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Right side - Benefits */}
      <div className="hidden lg:flex w-1/2 bg-indigo-600 text-white p-12 flex-col justify-center">
        <div className="max-w-lg mx-auto">
          <h2 className="text-3xl font-bold mb-8">
            Your Path to Purpose Starts Here
          </h2>
          
          <div className="space-y-6">
            {[
              {
                icon: Gift,
                title: "Discover Your Gifts",
                description: "Uncover your unique motivational gifts through our comprehensive assessment"
              },
              {
                icon: Target,
                title: "Find Your Career Path",
                description: "Get matched with careers that align with your God-given gifts"
              },
              {
                icon: BookOpen,
                title: "Access Expert Guidance",
                description: "Receive personalized resources and career counseling support"
              }
            ].map((benefit, index) => (
              <div key={index} className="flex items-start gap-4">
                <div className="bg-white/10 rounded-lg p-2">
                  <benefit.icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{benefit.title}</h3>
                  <p className="text-indigo-100">{benefit.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 p-6 bg-white/10 rounded-xl">
            <p className="text-lg font-medium mb-2">
              "No matter your tribe or background, you are a Very Important Person on earth. 
              Your gift is needed by all of us."
            </p>
            <p className="text-indigo-200">Pathfinders</p>
          </div>
        </div>
      </div>
    </div>
  );
}