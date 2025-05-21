'use client';

import { LoginForm } from '@/components/auth/login-form';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { Loading } from '@/components/ui/loading';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Users, ArrowRight, Lock } from 'lucide-react';

export default function LoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Redirect if already logged in
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-blue-50">
        <Loading size="large" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-indigo-50 via-white to-blue-50">
      {/* Left side - Benefits */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-indigo-600 to-blue-700 
        text-white p-12 flex-col justify-center">
        <div className="max-w-lg mx-auto">
          <h2 className="text-3xl font-bold mb-8">
            Welcome Back to Your Journey
          </h2>
          
          <div className="space-y-8">
            <div className="bg-white/10 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Sparkles className="w-6 h-6" />
                <h3 className="text-xl font-semibold">Continue Your Discovery</h3>
              </div>
              <p className="text-indigo-100">
                Pick up where you left off in your journey to understand and apply your 
                motivational gifts.
              </p>
            </div>

            <div className="bg-white/10 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Users className="w-6 h-6" />
                <h3 className="text-xl font-semibold">Expert Support</h3>
              </div>
              <p className="text-indigo-100">
                Access career counseling and guidance from professionals who understand both 
                gifts and career paths.
              </p>
            </div>
          </div>

          <div className="mt-12 p-6 bg-white/10 rounded-xl">
            <p className="text-lg font-medium mb-2">
              "Your life could be a tragic waste if you fail to discover and use your gift as God 
              planned it for you."
            </p>
            <p className="text-indigo-200">Pathfinders</p>
          </div>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Welcome Back
            </h1>
            <p className="text-lg text-gray-600 mb-4">
              Continue your journey of purpose discovery
            </p>
          </div>

          <LoginForm />

          <div className="mt-6 text-center space-y-4">
            <p className="text-sm text-gray-600">
              New to Pathfinders?{' '}
              <Link
                href="/register"
                className="font-medium text-indigo-600 hover:text-indigo-500 
                  transition-colors duration-200 inline-flex items-center gap-1"
              >
                Start your journey
                <ArrowRight className="w-4 h-4" />
              </Link>
            </p>
            
            <div className="pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                Are you a counselor?{' '}
                <Link
                  href="/counselor-access"
                  className="font-medium text-indigo-600 hover:text-indigo-500 
                    transition-colors duration-200 inline-flex items-center gap-1"
                >
                  <Lock className="w-4 h-4" />
                  Counselor login
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}