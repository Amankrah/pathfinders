'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Heart, CreditCard, Smartphone, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { donationApi } from '@/services/payment';

interface DonationForm {
  amount: string;
  currency: string;
  paymentMethod: 'stripe' | 'mtn';
  message?: string;
  phoneNumber?: string;
}

export default function PublicDonatePage() {
  const [form, setForm] = useState<DonationForm>({
    amount: '',
    currency: 'usd',
    paymentMethod: 'stripe',
    message: '',
    phoneNumber: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.amount || parseFloat(form.amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (form.paymentMethod === 'mtn' && !form.phoneNumber) {
      toast.error('Please enter your MTN phone number');
      return;
    }

    setLoading(true);

    try {
      if (form.paymentMethod === 'stripe') {
        toast.error('Credit card payments are coming soon. Please use MTN Mobile Money for now.');
        return;
      } else if (form.paymentMethod === 'mtn') {
        const response = await donationApi.createAnonymousMTNDonation(
          parseFloat(form.amount),
          form.phoneNumber!,
          form.currency === 'usd' ? 'USD' : 'GHS',
          form.message
        );
        
        toast.success('MTN payment request sent! Check your phone for payment instructions.');
        
        // Show instructions if provided
        if (response.instructions) {
          toast.info(response.instructions, {
            duration: 10000,
          });
        }
      }
    } catch (error: any) {
      console.error('Donation error:', error);
      toast.error(error.message || 'Failed to process donation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex justify-center mb-8">
            <div className="w-24 h-24 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center shadow-lg">
              <Heart className="h-12 w-12 text-white" />
            </div>
          </div>
          <h1 className="text-5xl font-bold text-slate-900 mb-6">Support Our Mission</h1>
          <p className="text-xl text-slate-700 max-w-3xl mx-auto leading-relaxed">
            Your generous donation helps us continue our mission of helping people discover their God-given gifts 
            and find their purpose in both ministry and career.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Donation Form */}
          <Card className="p-8 shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <h2 className="text-3xl font-bold text-slate-900 mb-8">Make a Donation</h2>
            
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Amount */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-4">
                  Donation Amount
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-500 text-lg font-medium">
                    {form.currency === 'usd' ? '$' : '₵'}
                  </span>
                  <Input
                    type="number"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    placeholder="0.00"
                    className="h-14 text-xl pl-12 border-2 border-slate-200 focus:border-blue-500 focus:ring-blue-500 bg-white text-slate-900 placeholder:text-slate-500"
                    required
                    min="0.01"
                    step="0.01"
                  />
                </div>
              </div>

              {/* Currency */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-4">
                  Currency
                </label>
                <Select
                  value={form.currency}
                  onValueChange={(value) => setForm({ ...form, currency: value })}
                >
                  <SelectTrigger className="h-14 text-lg border-2 border-slate-200 focus:border-blue-500 focus:ring-blue-500 bg-white text-slate-900 placeholder:text-slate-500">
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200">
                    <SelectItem value="usd" className="text-slate-900 hover:bg-slate-50">USD - US Dollar</SelectItem>
                    <SelectItem value="ghs" className="text-slate-900 hover:bg-slate-50">GHS - Ghana Cedi</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-4">
                  Payment Method
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    disabled
                    className="p-6 rounded-xl border-2 border-slate-200 bg-slate-50 cursor-not-allowed opacity-60 relative"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center">
                        <CreditCard className="h-6 w-6 text-slate-400" />
                      </div>
                      <div className="text-left">
                        <div className="font-semibold text-slate-500">Credit Card</div>
                        <div className="text-sm text-slate-400">Coming Soon</div>
                      </div>
                    </div>
                    <div className="absolute top-2 right-2 bg-slate-200 text-slate-600 text-xs px-2 py-1 rounded-full font-medium">
                      Coming Soon
                    </div>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, paymentMethod: 'mtn' })}
                    className={`p-6 rounded-xl border-2 transition-all duration-200 ${
                      form.paymentMethod === 'mtn'
                        ? 'border-green-500 bg-green-50 shadow-md'
                        : 'border-slate-200 hover:border-slate-300 bg-white hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                        <Smartphone className="h-6 w-6 text-green-600" />
                      </div>
                      <div className="text-left">
                        <div className="font-semibold text-slate-900">MTN Mobile Money</div>
                        <div className="text-sm text-slate-600">Ghana only</div>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Phone Number for MTN */}
              {form.paymentMethod === 'mtn' && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-4">
                    MTN Phone Number
                  </label>
                  <Input
                    type="tel"
                    value={form.phoneNumber || ''}
                    onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
                    placeholder="Enter your MTN phone number (e.g., 233244123456)"
                    className="h-14 text-lg border-2 border-slate-200 focus:border-green-500 focus:ring-green-500 bg-white"
                    required={form.paymentMethod === 'mtn'}
                  />
                  <p className="text-sm text-slate-600 mt-3">
                    Enter your MTN Mobile Money phone number in international format
                  </p>
                </div>
              )}

              {/* Message */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-4">
                  Message (Optional)
                </label>
                <Textarea
                  value={form.message || ''}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder="Share why you're making this donation..."
                  className="border-2 border-slate-200 focus:border-blue-500 focus:ring-blue-500 bg-white"
                  rows={4}
                />
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-16 text-xl font-semibold bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg hover:shadow-xl transition-all duration-200"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-6 w-6 animate-spin mr-3" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Heart className="h-6 w-6 mr-3" />
                    Make Donation
                  </>
                )}
              </Button>
            </form>
          </Card>

          {/* Information Sidebar */}
          <div className="space-y-8">
            <Card className="p-8 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 shadow-lg">
              <h3 className="text-2xl font-bold text-green-900 mb-6">How Your Donation Helps</h3>
              <ul className="space-y-4 text-green-800">
                <li className="flex items-start gap-4">
                  <div className="w-3 h-3 bg-green-600 rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-lg">Support our assessment platform development</span>
                </li>
                <li className="flex items-start gap-4">
                  <div className="w-3 h-3 bg-green-600 rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-lg">Provide free career counseling services</span>
                </li>
                <li className="flex items-start gap-4">
                  <div className="w-3 h-3 bg-green-600 rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-lg">Create educational resources and materials</span>
                </li>
                <li className="flex items-start gap-4">
                  <div className="w-3 h-3 bg-green-600 rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-lg">Help people discover their God-given gifts</span>
                </li>
              </ul>
            </Card>

            <Card className="p-8 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 shadow-lg">
              <h3 className="text-2xl font-bold text-blue-900 mb-6">Payment Security</h3>
              <ul className="space-y-4 text-blue-800">
                <li className="flex items-start gap-4">
                  <div className="w-3 h-3 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-lg">All payments are processed securely</span>
                </li>
                <li className="flex items-start gap-4">
                  <div className="w-3 h-3 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-lg">We never store your payment information</span>
                </li>
                <li className="flex items-start gap-4">
                  <div className="w-3 h-3 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-lg">SSL encrypted transactions</span>
                </li>
              </ul>
            </Card>

            <Card className="p-8 bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200 shadow-lg">
              <h3 className="text-2xl font-bold text-purple-900 mb-6">Need Help?</h3>
              <p className="text-purple-800 mb-6 text-lg">
                If you have any questions about making a donation, please contact us.
              </p>
              <Button 
                variant="outline" 
                className="w-full h-12 text-lg border-purple-300 text-purple-700 hover:bg-purple-100 hover:border-purple-400"
              >
                Contact Support
              </Button>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
} 