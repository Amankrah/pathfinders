from django.urls import path
from core.stripe_views import (
    CreateDonationCheckoutSessionView, 
    StripeWebhookView, 
    MTNMobileMoneyDonationView, 
    MTNWebhookView,
    DonationListView,
    CancelDonationView,
    CheckMTNPaymentStatusView,
    CreateAnonymousDonationCheckoutSessionView,
    CreateAnonymousMTNDonationView
)
from core.views import validate_payment

urlpatterns = [
    # Donation endpoints (authenticated)
    path('donate/stripe/', CreateDonationCheckoutSessionView.as_view(), name='create-donation-checkout'),
    path('donate/stripe', CreateDonationCheckoutSessionView.as_view(), name='create-donation-checkout-no-slash'),
    path('donate/mtn/', MTNMobileMoneyDonationView.as_view(), name='create-mtn-donation'),
    
    # Anonymous donation endpoints (no authentication required)
    path('donate/anonymous/stripe/', CreateAnonymousDonationCheckoutSessionView.as_view(), name='create-anonymous-stripe-donation'),
    path('donate/anonymous/mtn/', CreateAnonymousMTNDonationView.as_view(), name='create-anonymous-mtn-donation'),
    
    # Donation management endpoints
    path('donations/', DonationListView.as_view(), name='donation-list'),
    path('donations/<int:donation_id>/cancel/', CancelDonationView.as_view(), name='cancel-donation'),
    path('donations/mtn/<str:reference_id>/status/', CheckMTNPaymentStatusView.as_view(), name='check-mtn-payment-status'),
    
    # Webhook endpoints
    path('stripe-webhook/', StripeWebhookView.as_view(), name='stripe-webhook'),
    path('mtn-webhook/', MTNWebhookView.as_view(), name='mtn-webhook'),
    
    # Legacy endpoints (keep for backwards compatibility during transition)
    path('validate-payment/', validate_payment, name='validate-payment'),
]
