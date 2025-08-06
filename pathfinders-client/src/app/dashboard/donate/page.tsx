'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Heart, CreditCard, Smartphone, Loader2, AlertCircle, History } from 'lucide-react';
import { toast } from 'sonner';

interface DonationForm {
  amount: string;
  currency: string;
  message: string;
  paymentMethod: 'stripe' | 'mtn';
  phoneNumber?: string; // Add phone number for MTN
}

export default function DonatePage() {
  const { user } = useAuth();
  const [form, setForm] = useState<DonationForm>({
    amount: '',
    currency: 'usd',
    message: '',
    paymentMethod: 'stripe',
    phoneNumber: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.amount || parseFloat(form.amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    // Validate phone number for MTN
    if (form.paymentMethod === 'mtn') {
      if (!form.phoneNumber || form.phoneNumber.trim() === '') {
        toast.error('Please enter your MTN phone number');
        return;
      }
      
      // Basic phone number validation for Ghana
      const phoneRegex = /^(233|0)?[0-9]{9}$/;
      if (!phoneRegex.test(form.phoneNumber.replace(/\s/g, ''))) {
        toast.error('Please enter a valid Ghana phone number');
        return;
      }
    }

    setLoading(true);

    try {
      if (form.paymentMethod === 'stripe') {
        toast.error('Credit card payments are coming soon. Please use MTN Mobile Money for now.');
        return;
      } else if (form.paymentMethod === 'mtn') {
        const endpoint = '/api/core/donate/mtn/';

        const requestBody: any = {
          amount: parseFloat(form.amount),
          currency: 'GHS',
          message: form.message,
          phone_number: form.phoneNumber,
        };

        // Get CSRF token first
        const csrfResponse = await fetch('/api/csrf/', {
          credentials: 'include'
        });
        const csrfData = await csrfResponse.json();
        
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrfData.csrfToken,
          },
          credentials: 'include',
          body: JSON.stringify(requestBody),
        });

        // Check if response is JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          const textResponse = await response.text();
          console.error('Non-JSON response:', textResponse);
          throw new Error(`Server error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || `Server error: ${response.status}`);
        }

        // Handle MTN Mobile Money response
        toast.success('MTN Mobile Money payment initiated successfully!');
        
        // Show detailed instructions
        if (data.instructions && Array.isArray(data.instructions)) {
          const instructionText = data.instructions.join('\n');
          alert(`MTN Payment Instructions:\n\n${instructionText}`);
        }
        
        console.log('MTN response:', data);
        
        // Reset form after successful MTN payment
        setForm({
          amount: '',
          currency: 'usd',
          message: '',
          paymentMethod: 'stripe',
          phoneNumber: ''
        });
      }
    } catch (error) {
      console.error('Donation error:', error);
      
      // Provide more specific error messages
      let errorMessage = 'Failed to process donation';
      
      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch')) {
          errorMessage = 'Unable to connect to server. Please check your internet connection and try again.';
        } else if (error.message.includes('Server error: 500')) {
          errorMessage = 'Server error occurred. Please try again later or contact support.';
        } else if (error.message.includes('Server error: 403')) {
          errorMessage = 'Access denied. Please make sure you are logged in.';
        } else if (error.message.includes('Server error: 404')) {
          errorMessage = 'Donation service not found. Please contact support.';
        } else if (error.message.includes('pending donation')) {
          errorMessage = 'You have a pending donation. Please complete or cancel it first.';
        } else if (error.message.includes('Phone number is required')) {
          errorMessage = 'Please enter your MTN phone number.';
        } else if (error.message.includes('valid Ghana phone number')) {
          errorMessage = 'Please enter a valid Ghana phone number (e.g., 233244123456).';
        } else {
          errorMessage = error.message;
        }
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <div className="text-center mb-12">
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
            <Heart className="h-10 w-10 text-red-600" />
          </div>
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Support Pathfinders</h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
          Your donation helps us continue providing motivational gift assessments and career guidance 
          to individuals seeking to discover their God-given talents and purpose.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Donation Form */}
        <Card className="p-8 bg-white shadow-lg border-0">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <Heart className="h-5 w-5 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                Make a Donation
              </h2>
            </div>
            <p className="text-gray-600 text-lg">
              Choose your payment method and amount to support our ministry
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Amount
              </label>
              <div className="relative">
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  placeholder="Enter amount"
                  className="pl-10 h-12 text-lg border-2 border-gray-200 focus:border-red-500 focus:ring-red-500"
                  required
                />
                <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-black text-lg font-medium">
                  {form.currency === 'usd' ? '$' : '₵'}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Currency
              </label>
              <Select value={form.currency} onValueChange={(value) => setForm({ ...form, currency: value })}>
                <SelectTrigger className="h-12 text-lg border-2 border-gray-200 focus:border-red-500 focus:ring-red-500 text-gray-900">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="usd" className="text-gray-900 hover:bg-gray-100">USD - US Dollar</SelectItem>
                  <SelectItem value="ghs" className="text-gray-900 hover:bg-gray-100">GHS - Ghanaian Cedi</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Payment Method
              </label>
              <div className="grid grid-cols-2 gap-4">
                <Button
                  type="button"
                  disabled
                  className="h-12 text-base font-medium border-2 border-gray-200 bg-gray-50 cursor-not-allowed opacity-60 relative"
                >
                  <CreditCard className="h-5 w-5 mr-2 text-gray-400" />
                  Credit Card
                  <div className="absolute top-1 right-1 bg-gray-200 text-gray-600 text-xs px-1 py-0.5 rounded-full font-medium">
                    Coming Soon
                  </div>
                </Button>
                <Button
                  type="button"
                  variant={form.paymentMethod === 'mtn' ? 'default' : 'outline'}
                  onClick={() => setForm({ ...form, paymentMethod: 'mtn' })}
                  className={`h-12 text-base font-medium transition-all duration-200 ${
                    form.paymentMethod === 'mtn' 
                      ? 'bg-green-600 hover:bg-green-700 text-white shadow-md' 
                      : 'border-2 border-gray-200 hover:border-green-300 text-gray-700 hover:text-green-700'
                  }`}
                >
                  <Smartphone className="h-5 w-5 mr-2" />
                  MTN Mobile Money
                </Button>
              </div>
            </div>

            {/* Phone Number Field for MTN */}
            {form.paymentMethod === 'mtn' && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  MTN Phone Number
                </label>
                <Input
                  type="tel"
                  value={form.phoneNumber || ''}
                  onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
                  placeholder="Enter your MTN phone number (e.g., 233244123456)"
                  className="h-12 text-lg border-2 border-gray-200 focus:border-green-500 focus:ring-green-500"
                  required={form.paymentMethod === 'mtn'}
                />
                <p className="text-sm text-gray-500 mt-2">
                  Enter your MTN Mobile Money phone number in international format
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Message (Optional)
              </label>
              <Textarea
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                placeholder="Leave a message with your donation..."
                rows={4}
                className="border-2 border-gray-200 focus:border-red-500 focus:ring-red-500 text-base"
              />
            </div>

            <Button
              type="submit"
              disabled={loading || !form.amount}
              className="w-full h-14 bg-red-600 hover:bg-red-700 text-white text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-3 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Heart className="h-5 w-5 mr-3" />
                  Donate Now
                </>
              )}
            </Button>
          </form>
          
          {/* Pending Donations Notice */}
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-yellow-800 mb-1">
                  Have pending donations?
                </h4>
                <p className="text-sm text-yellow-700 mb-3">
                  If you have pending donations that need to be completed or cancelled, you can manage them in your donation history.
                </p>
                <Link href="/dashboard/donations" className="inline-flex items-center px-3 py-2 text-sm font-medium border border-yellow-300 text-yellow-700 hover:bg-yellow-100 rounded-md transition-colors">
                  <History className="h-4 w-4 mr-2" />
                  View My Donations
                </Link>
              </div>
            </div>
          </div>
        </Card>

        {/* Information Card */}
        <Card className="p-8 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-lg border-0">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Heart className="h-5 w-5 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                How Your Donation Helps
              </h2>
            </div>
            <p className="text-gray-700 text-lg">
              Your generous support enables us to:
            </p>
          </div>
          
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-3 h-3 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <h4 className="font-semibold text-gray-900 text-lg mb-1">Provide Free Assessments</h4>
                <p className="text-gray-700 leading-relaxed">
                  Help individuals discover their spiritual gifts and career paths through comprehensive assessments.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-3 h-3 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <h4 className="font-semibold text-gray-900 text-lg mb-1">Develop Resources</h4>
                <p className="text-gray-700 leading-relaxed">
                  Create and maintain career planning books and educational materials for spiritual growth.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-3 h-3 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <h4 className="font-semibold text-gray-900 text-lg mb-1">Support Technology</h4>
                <p className="text-gray-700 leading-relaxed">
                  Maintain and improve our platform and services to reach more people effectively.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-3 h-3 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <h4 className="font-semibold text-gray-900 text-lg mb-1">Expand Ministry</h4>
                <p className="text-gray-700 leading-relaxed">
                  Reach more people with spiritual guidance and career counseling services.
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
} 