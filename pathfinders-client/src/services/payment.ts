import apiClient from '../lib/api-client';

export interface DonationSession {
  sessionId: string;
  checkoutUrl: string;
}

export interface StripeDonationResponse {
  checkout_url: string;
  session_id: string;
  payment_id: string;
}

export interface MTNDonationResponse {
  transaction_id: string;
  status: string;
  message: string;
  instructions?: string;
}

export interface PaymentValidation {
  is_valid: boolean;
  message?: string;
  payment_id?: string;
}

export const donationApi = {
  // Stripe donation (authenticated)
  createStripeDonation: async (amount: number, currency: string = 'usd', message?: string): Promise<StripeDonationResponse> => {
    try {
      const response = await apiClient.post('/core/donate/stripe/', {
        amount,
        currency,
        message
      });
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to create Stripe donation';
      throw new Error(errorMessage);
    }
  },

  // Anonymous Stripe donation (no authentication required)
  createAnonymousStripeDonation: async (amount: number, currency: string = 'usd', message?: string, email?: string): Promise<StripeDonationResponse> => {
    try {
      const response = await fetch('/api/core/donate/anonymous/stripe/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          currency,
          message,
          email
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create anonymous Stripe donation');
      }

      return await response.json();
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to create anonymous Stripe donation';
      throw new Error(errorMessage);
    }
  },

  // MTN Mobile Money donation (authenticated)
  createMTNDonation: async (amount: number, phoneNumber: string, currency: string = 'GHS', message?: string): Promise<MTNDonationResponse> => {
    try {
      // Validate phone number format
      const cleanPhone = phoneNumber.replace(/\s/g, '');
      const phoneRegex = /^(233|0)?[0-9]{9}$/;

      if (!phoneRegex.test(cleanPhone)) {
        throw new Error('Please enter a valid Ghana phone number (e.g., 233244123456)');
      }

      // Format phone number to international format
      let formattedPhone = cleanPhone;
      if (cleanPhone.startsWith('0')) {
        formattedPhone = `233${cleanPhone.substring(1)}`;
      } else if (!cleanPhone.startsWith('233')) {
        formattedPhone = `233${cleanPhone}`;
      }

      const response = await apiClient.post('/core/donate/mtn/', {
        amount,
        phone_number: formattedPhone,
        currency,
        message
      });
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to create MTN donation';
      throw new Error(errorMessage);
    }
  },

  // Anonymous MTN Mobile Money donation (no authentication required)
  createAnonymousMTNDonation: async (amount: number, phoneNumber: string, currency: string = 'GHS', message?: string, email?: string): Promise<MTNDonationResponse> => {
    try {
      // Validate phone number format
      const cleanPhone = phoneNumber.replace(/\s/g, '');
      const phoneRegex = /^(233|0)?[0-9]{9}$/;

      if (!phoneRegex.test(cleanPhone)) {
        throw new Error('Please enter a valid Ghana phone number (e.g., 233244123456)');
      }

      // Format phone number to international format
      let formattedPhone = cleanPhone;
      if (cleanPhone.startsWith('0')) {
        formattedPhone = `233${cleanPhone.substring(1)}`;
      } else if (!cleanPhone.startsWith('233')) {
        formattedPhone = `233${cleanPhone}`;
      }

      const response = await fetch('/api/core/donate/anonymous/mtn/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          phone_number: formattedPhone,
          currency,
          message,
          email
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create anonymous MTN donation');
      }

      return await response.json();
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to create anonymous MTN donation';
      throw new Error(errorMessage);
    }
  },
};

// Legacy payment API (kept for backwards compatibility during transition)
export const paymentApi = {
  validatePayment: async (userId: number, paymentId?: string): Promise<PaymentValidation> => {
    try {
      const response = await apiClient.post('/core/validate-payment/', {
        user_id: userId,
        payment_id: paymentId
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to validate payment');
    }
  }
};
