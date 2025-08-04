'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Heart, Clock, CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Donation {
  id: number;
  amount: number;
  currency: string;
  payment_method: string;
  paid: boolean;
  message?: string;
  created_at: string;
  updated_at: string;
  stripe_payment_intent?: string;
  mtn_transaction_id?: string;
}

export default function DonationsPage() {
  const { user } = useAuth();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState<number | null>(null);
  const [checkingStatus, setCheckingStatus] = useState<string | null>(null);

  useEffect(() => {
    fetchDonations();
  }, []);

  const fetchDonations = async () => {
    try {
      const response = await fetch('/api/core/donations/', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': document.cookie.split('csrftoken=')[1]?.split(';')[0] || '',
        },
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setDonations(data.donations || []);
      } else {
        toast.error('Failed to load donations');
      }
    } catch (error) {
      console.error('Error fetching donations:', error);
      toast.error('Failed to load donations');
    } finally {
      setLoading(false);
    }
  };

  const cancelDonation = async (donationId: number) => {
    setCancelling(donationId);
    try {
      const response = await fetch(`/api/core/donations/${donationId}/cancel/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': document.cookie.split('csrftoken=')[1]?.split(';')[0] || '',
        },
        credentials: 'include',
      });

      if (response.ok) {
        toast.success('Donation cancelled successfully');
        fetchDonations(); // Refresh the list
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to cancel donation');
      }
    } catch (error) {
      console.error('Error cancelling donation:', error);
      toast.error('Failed to cancel donation');
    } finally {
      setCancelling(null);
    }
  };

  const checkMTNPaymentStatus = async (referenceId: string) => {
    setCheckingStatus(referenceId);
    try {
      const response = await fetch(`/api/core/donations/mtn/${referenceId}/status/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': document.cookie.split('csrftoken=')[1]?.split(';')[0] || '',
        },
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(`Payment status: ${data.status}`);
        fetchDonations(); // Refresh the list to get updated status
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to check payment status');
      }
    } catch (error) {
      console.error('Error checking payment status:', error);
      toast.error('Failed to check payment status');
    } finally {
      setCheckingStatus(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusIcon = (paid: boolean, paymentMethod: string) => {
    if (paid) {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    } else {
      return <Clock className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getStatusText = (paid: boolean, paymentMethod: string) => {
    if (paid) {
      return 'Completed';
    } else {
      return 'Pending';
    }
  };

  const getStatusColor = (paid: boolean) => {
    if (paid) {
      return 'text-green-600 bg-green-50 border-green-200';
    } else {
      return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    }
  };

  const getCurrencySymbol = (currency: string) => {
    return currency === 'usd' ? '$' : '₵';
  };

  const getPaymentMethodDisplay = (paymentMethod: string) => {
    switch (paymentMethod) {
      case 'stripe_card':
        return 'Credit Card';
      case 'mtn_mobile_money':
        return 'MTN Mobile Money';
      default:
        return paymentMethod;
    }
  };

  const getPaymentMethodIcon = (paymentMethod: string) => {
    switch (paymentMethod) {
      case 'stripe_card':
        return '💳';
      case 'mtn_mobile_money':
        return '📱';
      default:
        return '💰';
    }
  };

  const pendingDonations = donations.filter(d => !d.paid);
  const completedDonations = donations.filter(d => d.paid);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto py-8 px-4">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <div className="text-center mb-12">
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
            <Heart className="h-10 w-10 text-red-600" />
          </div>
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">My Donations</h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
          View and manage your donation history
        </p>
      </div>

      {/* Summary Section */}
      <div className="mb-8">
        <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {completedDonations.length}
              </div>
              <div className="text-sm text-gray-600">Completed Donations</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-600 mb-2">
                {pendingDonations.length}
              </div>
              <div className="text-sm text-gray-600">Pending Donations</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {getCurrencySymbol('usd')}{completedDonations.reduce((sum, d) => sum + d.amount, 0).toFixed(2)}
              </div>
              <div className="text-sm text-gray-600">Total Donated</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Pending Donations */}
      {pendingDonations.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            <AlertCircle className="h-6 w-6 text-yellow-500" />
            <h2 className="text-2xl font-bold text-gray-900">Pending Donations</h2>
          </div>
          <div className="grid gap-4">
            {pendingDonations.map((donation) => (
              <Card key={donation.id} className="p-6 border-2 border-yellow-200 bg-yellow-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {getStatusIcon(donation.paid, donation.payment_method)}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold text-gray-900">
                          {getCurrencySymbol(donation.currency)}{donation.amount}
                        </span>
                        <span className="text-sm text-gray-500 uppercase">{donation.currency}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-lg">{getPaymentMethodIcon(donation.payment_method)}</span>
                        <p className="text-sm text-gray-600">
                          {getPaymentMethodDisplay(donation.payment_method)}
                        </p>
                      </div>
                      <p className="text-sm text-gray-500">
                        Created: {formatDate(donation.created_at)}
                      </p>
                      {/* Show transaction ID if available */}
                      {donation.stripe_payment_intent && (
                        <p className="text-xs text-gray-500 mt-1">
                          Stripe ID: {donation.stripe_payment_intent.slice(-8)}...
                        </p>
                      )}
                      {donation.mtn_transaction_id && (
                        <p className="text-xs text-gray-500 mt-1">
                          MTN Ref: {donation.mtn_transaction_id.slice(0, 8)}...
                        </p>
                      )}
                      {donation.message && (
                        <p className="text-sm text-gray-600 mt-2 italic">
                          "{donation.message}"
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(donation.paid)}`}>
                      {getStatusText(donation.paid, donation.payment_method)}
                    </span>
                    <div className="flex items-center gap-2">
                      {/* Check Status button for MTN payments */}
                      {donation.payment_method === 'mtn_mobile_money' && donation.mtn_transaction_id && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => checkMTNPaymentStatus(donation.mtn_transaction_id!)}
                          disabled={checkingStatus === donation.mtn_transaction_id}
                          className="text-blue-600 border-blue-300 hover:bg-blue-50"
                        >
                          {checkingStatus === donation.mtn_transaction_id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Clock className="h-4 w-4" />
                          )}
                          Check Status
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => cancelDonation(donation.id)}
                        disabled={cancelling === donation.id}
                        className="text-red-600 border-red-300 hover:bg-red-50"
                      >
                        {cancelling === donation.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <XCircle className="h-4 w-4" />
                        )}
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Completed Donations */}
      <div>
        <div className="flex items-center gap-3 mb-6">
          <CheckCircle className="h-6 w-6 text-green-500" />
          <h2 className="text-2xl font-bold text-gray-900">Completed Donations</h2>
        </div>
        
        {completedDonations.length === 0 ? (
          <Card className="p-8 text-center">
            <Heart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No completed donations yet</h3>
            <p className="text-gray-600 mb-6">
              Your completed donations will appear here once they are processed.
            </p>
            <Link href="/dashboard/donate" className="inline-flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-md transition-colors">
              Make Your First Donation
            </Link>
          </Card>
        ) : (
          <div className="grid gap-4">
            {completedDonations.map((donation) => (
              <Card key={donation.id} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {getStatusIcon(donation.paid, donation.payment_method)}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold text-gray-900">
                          {getCurrencySymbol(donation.currency)}{donation.amount}
                        </span>
                        <span className="text-sm text-gray-500 uppercase">{donation.currency}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-lg">{getPaymentMethodIcon(donation.payment_method)}</span>
                        <p className="text-sm text-gray-600">
                          {getPaymentMethodDisplay(donation.payment_method)}
                        </p>
                      </div>
                      <p className="text-sm text-gray-500">
                        Completed: {formatDate(donation.updated_at)}
                      </p>
                      {/* Show transaction ID if available */}
                      {donation.stripe_payment_intent && (
                        <p className="text-xs text-gray-500 mt-1">
                          Stripe ID: {donation.stripe_payment_intent.slice(-8)}...
                        </p>
                      )}
                      {donation.mtn_transaction_id && (
                        <p className="text-xs text-gray-500 mt-1">
                          MTN Ref: {donation.mtn_transaction_id.slice(0, 8)}...
                        </p>
                      )}
                      {donation.message && (
                        <p className="text-sm text-gray-600 mt-2 italic">
                          "{donation.message}"
                        </p>
                      )}
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(donation.paid)}`}>
                    {getStatusText(donation.paid, donation.payment_method)}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Make New Donation Button */}
      <div className="mt-8 text-center">
        <Link href="/dashboard/donate" className="inline-flex items-center px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors">
          <Heart className="h-5 w-5 mr-2" />
          Make New Donation
        </Link>
      </div>
    </div>
  );
} 