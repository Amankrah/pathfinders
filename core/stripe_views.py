"""
MTN Mobile Money Integration Status

Currently, the MTN Mobile Money integration requires API User ID and API Key credentials
that are not available in your MTN developer portal. You need to contact MTN support
to get these credentials.

In the meantime, you can use Stripe for payments, which is already configured and working.

To get MTN credentials:
1. Contact MTN Developer Support: developer@mtn.com
2. Ask for API User ID and API Key for your Collection API subscription
3. Update local_settings.py with the credentials
4. Test with: python manage.py test_mtn_integration

See MTN_CREDENTIALS_GUIDE.md for detailed instructions.
"""

from rest_framework import status, permissions, views
from rest_framework.response import Response
from django.conf import settings
from django.contrib.auth import get_user_model
from core.models import Payment
import stripe
from decimal import Decimal
from django.utils import timezone
import logging
import time

logger = logging.getLogger(__name__)

# Set Stripe API key
if hasattr(settings, 'STRIPE_SECRET_KEY') and settings.STRIPE_SECRET_KEY:
    stripe.api_key = settings.STRIPE_SECRET_KEY
    print(f"Stripe API key loaded: {settings.STRIPE_SECRET_KEY[:20]}...")
else:
    print("WARNING: Stripe API key not set")

class CreateDonationCheckoutSessionView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        amount = request.data.get('amount')
        currency = request.data.get('currency', 'usd')
        message = request.data.get('message', '')
        
        # Debug logging
        logger.info(f"Stripe donation request - User: {user.id}, Amount: {amount}, Currency: {currency}")
        logger.info(f"Request data: {request.data}")
        
        # Validate amount
        try:
            amount = Decimal(str(amount))
            if amount <= 0:
                return Response({
                    'error': 'Amount must be greater than 0'
                }, status=status.HTTP_400_BAD_REQUEST)
        except (TypeError, ValueError):
            return Response({
                'error': 'Invalid amount provided'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Convert to cents for Stripe
        stripe_amount = int(amount * 100)
        
        # Clean up stale pending donations (older than 1 hour)
        stale_payments = Payment.objects.filter(
            user=user,
            payment_type='donation',
            paid=False,
            created_at__lt=timezone.now() - timezone.timedelta(hours=1)
        )
        if stale_payments.exists():
            logger.info(f"Cleaning up {stale_payments.count()} stale pending donations for user {user.id}")
            stale_payments.delete()
        
        # Check if user already has a recent pending donation
        pending_donation = Payment.objects.filter(
            user=user,
            payment_type='donation',
            paid=False,
            created_at__gte=timezone.now() - timezone.timedelta(hours=1)
        ).first()
        
        if pending_donation:
            logger.warning(f"User {user.id} has pending donation {pending_donation.id} created at {pending_donation.created_at}")
            return Response({
                'error': 'You have a pending donation. Please complete or cancel it first.'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Ensure Stripe API key is set
        if not stripe.api_key:
            logger.error("Stripe API key not configured")
            return Response({
                'error': 'Payment service not configured'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
        try:
            checkout_session = stripe.checkout.Session.create(
                payment_method_types=['card'],
                line_items=[{
                    'price_data': {
                        'currency': currency,
                        'product_data': {
                            'name': 'Donation to Pathfinders',
                            'description': 'Support Pathfinders ministry'
                        },
                        'unit_amount': stripe_amount,
                    },
                    'quantity': 1,
                }],
                mode='payment',
                success_url=request.build_absolute_uri('/donation-success/'),
                cancel_url=request.build_absolute_uri('/donation-cancel/'),
                client_reference_id=str(user.id),
                metadata={
                    'user_id': user.id,
                    'email': user.email,
                    'purpose': 'donation',
                    'message': message[:500]  # Limit message length
                },
            )
            
            # Create payment record
            payment = Payment.objects.create(
                user=user,
                payment_type='donation',
                payment_method='stripe_card',
                stripe_payment_intent=checkout_session.payment_intent,
                amount=amount,
                currency=currency,
                message=message
            )
            
            logger.info(f"Created payment record {payment.id} for user {user.id}")
            
            return Response({
                'sessionId': checkout_session.id, 
                'checkoutUrl': checkout_session.url
            })
            
        except stripe.error.StripeError as e:
            logger.error(f"Stripe error in donation: {str(e)}")
            logger.error(f"Stripe error type: {type(e).__name__}")
            logger.error(f"Stripe error details: {e.__dict__}")
            return Response({
                'error': f'Stripe error: {str(e)}'
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Unexpected error in donation: {str(e)}")
            return Response({
                'error': f'Unexpected error: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class CreateAnonymousDonationCheckoutSessionView(views.APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        amount = request.data.get('amount')
        currency = request.data.get('currency', 'usd')
        message = request.data.get('message', '')
        email = request.data.get('email', '')
        
        # Debug logging
        logger.info(f"Anonymous Stripe donation request - Amount: {amount}, Currency: {currency}, Email: {email}")
        logger.info(f"Request data: {request.data}")
        
        # Validate amount
        try:
            amount = Decimal(str(amount))
            if amount <= 0:
                return Response({
                    'error': 'Amount must be greater than 0'
                }, status=status.HTTP_400_BAD_REQUEST)
        except (TypeError, ValueError):
            return Response({
                'error': 'Invalid amount provided'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Convert to cents for Stripe
        stripe_amount = int(amount * 100)
        
        # Ensure Stripe API key is set
        if not stripe.api_key:
            logger.error("Stripe API key not configured")
            return Response({
                'error': 'Payment service not configured'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
        try:
            # Create checkout session for anonymous donation
            checkout_session = stripe.checkout.Session.create(
                payment_method_types=['card'],
                line_items=[{
                    'price_data': {
                        'currency': currency.lower(),
                        'product_data': {
                            'name': 'Pathfinders Donation',
                            'description': message or 'Supporting our mission to help people discover their God-given gifts'
                        },
                        'unit_amount': stripe_amount,
                    },
                    'quantity': 1,
                }],
                mode='payment',
                success_url=f'{settings.FRONTEND_URL}/donation-success?session_id={{CHECKOUT_SESSION_ID}}',
                cancel_url=f'{settings.FRONTEND_URL}/donation-cancel',
                metadata={
                    'donation_type': 'anonymous',
                    'message': message,
                    'email': email
                }
            )
            
            # Create payment record for anonymous donation
            payment = Payment.objects.create(
                user=None,  # Anonymous user
                amount=amount,
                currency=currency.upper(),
                payment_method='stripe_card',
                payment_type='donation',
                message=message,
                stripe_payment_intent=checkout_session.payment_intent,
                paid=False
            )
            
            logger.info(f"Created anonymous donation payment {payment.id} with session {checkout_session.id}")
            
            return Response({
                'checkout_url': checkout_session.url,
                'session_id': checkout_session.id,
                'payment_id': payment.id
            })
            
        except stripe.error.StripeError as e:
            logger.error(f"Stripe error in anonymous donation: {str(e)}")
            return Response({
                'error': f'Payment processing error: {str(e)}'
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Unexpected error in anonymous donation: {str(e)}")
            return Response({
                'error': 'An unexpected error occurred'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class StripeWebhookView(views.APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        payload = request.body
        sig_header = request.META.get('HTTP_STRIPE_SIGNATURE')
        event = None

        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
            )
            logger.info(f"Received Stripe webhook event: {event['type']}")
        except stripe.error.SignatureVerificationError:
            logger.error("Invalid webhook signature")
            return Response({
                'error': 'Invalid signature'
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Webhook error: {str(e)}")
            return Response({
                'error': f'Webhook error: {str(e)}'
            }, status=status.HTTP_400_BAD_REQUEST)

        if event['type'] == 'checkout.session.completed':
            try:
                session = event['data']['object']
                payment_intent = session.get('payment_intent')
                user_id = session.get('client_reference_id')
                metadata = session.get('metadata', {})
                
                logger.info(f"Processing completed checkout session: payment_intent={payment_intent}, user_id={user_id}")
                
                if not all([payment_intent, user_id]):
                    logger.error(f"Missing required payment data: payment_intent={payment_intent}, user_id={user_id}")
                    return Response({
                        'error': 'Missing required payment data'
                    }, status=status.HTTP_400_BAD_REQUEST)

                # Update payment record
                payment = Payment.objects.filter(
                    stripe_payment_intent=payment_intent
                ).first()
                
                if not payment:
                    logger.error(f"Payment not found for payment_intent: {payment_intent}")
                    return Response({
                        'error': 'Payment not found'
                    }, status=status.HTTP_404_NOT_FOUND)

                payment.paid = True
                # Update message from metadata if available
                if metadata.get('message'):
                    payment.message = metadata['message']
                payment.save()

                logger.info(f"Payment {payment.id} marked as paid for user {payment.user.email}")

                # Log donation completion
                if payment.payment_type == 'donation':
                    logger.info(f"Donation completed: {payment.amount} {payment.currency} from user {payment.user.email}")

                return Response({'status': 'Payment completed successfully'})
                
            except Exception as e:
                logger.error(f"Payment processing failed: {str(e)}")
                return Response({
                    'error': f'Payment processing failed: {str(e)}'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # Handle other event types if needed
        logger.info(f"Unhandled webhook event type: {event['type']}")
        return Response({'status': 'Event processed'})


class MTNMobileMoneyDonationView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        amount = request.data.get('amount')
        currency = request.data.get('currency', settings.MTN_CURRENCY)
        phone_number = request.data.get('phone_number')
        message = request.data.get('message', '')
        
        # Validate required fields
        if not phone_number:
            return Response({
                'error': 'Phone number is required for MTN Mobile Money'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate amount
        try:
            amount = Decimal(str(amount))
            if amount <= 0:
                return Response({
                    'error': 'Amount must be greater than 0'
                }, status=status.HTTP_400_BAD_REQUEST)
        except (TypeError, ValueError):
            return Response({
                'error': 'Invalid amount provided'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Clean up stale pending donations (older than 1 hour)
        stale_payments = Payment.objects.filter(
            user=user,
            payment_type='donation',
            payment_method='mtn_mobile_money',
            paid=False,
            created_at__lt=timezone.now() - timezone.timedelta(hours=1)
        )
        if stale_payments.exists():
            logger.info(f"Cleaning up {stale_payments.count()} stale pending MTN donations for user {user.id}")
            stale_payments.delete()
        
        # Check if user already has a pending donation
        pending_donation = Payment.objects.filter(
            user=user,
            payment_type='donation',
            payment_method='mtn_mobile_money',
            paid=False,
            created_at__gte=timezone.now() - timezone.timedelta(hours=1)
        ).first()
        
        if pending_donation:
            logger.warning(f"User {user.id} has pending MTN donation {pending_donation.id} created at {pending_donation.created_at}")
            return Response({
                'error': 'You have a pending MTN Mobile Money donation. Please complete or cancel it first.'
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Import MTN service
            from core.services import mtn_service
            
            # Validate phone number format (should be international format)
            if not phone_number.startswith('233'):
                phone_number = f"233{phone_number.lstrip('0')}"
            
            # Validate account holder
            validation_result = mtn_service.validate_account_holder(phone_number)
            if 'error' in validation_result:
                logger.warning(f"Account validation failed for {phone_number}: {validation_result['error']}")
                # Continue anyway as validation might fail in sandbox
            
            # Request payment from MTN
            payment_result = mtn_service.request_to_pay(
                amount=amount,
                phone_number=phone_number,
                currency=currency,
                external_id=f"donation_{user.id}_{int(timezone.now().timestamp())}",
                payer_message=f"Donation to Pathfinders - {amount} {currency}",
                payee_note=f"Thank you for your donation to Pathfinders ministry"
            )
            
            if 'error' in payment_result:
                logger.error(f"MTN payment request failed: {payment_result['error']}")
                return Response({
                    'error': f'MTN Mobile Money error: {payment_result["error"]}'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Create payment record
            payment = Payment.objects.create(
                user=user,
                payment_type='donation',
                payment_method='mtn_mobile_money',
                mtn_transaction_id=payment_result['reference_id'],
                amount=amount,
                currency=currency,
                message=message
            )
            
            logger.info(f"Created MTN payment record {payment.id} for user {user.id} with reference {payment_result['reference_id']}")
            
            return Response({
                'transaction_id': payment_result['reference_id'],
                'status': 'pending',
                'message': 'Payment request sent successfully. Please check your phone for the MTN Mobile Money prompt.',
                'instructions': [
                    'You will receive an MTN Mobile Money prompt on your phone',
                    'Enter your PIN to authorize the payment',
                    'The payment will be processed automatically',
                    f'Amount: {amount} {currency}',
                    f'Reference: {payment_result["reference_id"]}'
                ]
            })
            
        except Exception as e:
            logger.error(f"Unexpected error in MTN donation: {str(e)}")
            return Response({
                'error': f'MTN Mobile Money error: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class CreateAnonymousMTNDonationView(views.APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        amount = request.data.get('amount')
        phone_number = request.data.get('phone_number')
        currency = request.data.get('currency', 'GHS')
        message = request.data.get('message', '')
        email = request.data.get('email', '')
        
        # Debug logging
        logger.info(f"Anonymous MTN donation request - Amount: {amount}, Phone: {phone_number}, Currency: {currency}")
        logger.info(f"Request data: {request.data}")
        
        # Validate amount
        try:
            amount = Decimal(str(amount))
            if amount <= 0:
                return Response({
                    'error': 'Amount must be greater than 0'
                }, status=status.HTTP_400_BAD_REQUEST)
        except (TypeError, ValueError):
            return Response({
                'error': 'Invalid amount provided'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate phone number
        if not phone_number:
            return Response({
                'error': 'Phone number is required for MTN Mobile Money'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Clean up phone number
        phone_number = phone_number.replace(' ', '').replace('-', '').replace('+', '')
        if not phone_number.startswith('233'):
            if phone_number.startswith('0'):
                phone_number = '233' + phone_number[1:]
            else:
                phone_number = '233' + phone_number
        
        try:
            # Initialize MTN service
            from core.services import MTNMobileMoneyService
            
            # Create payment record first
            payment = Payment.objects.create(
                user=None,  # Anonymous user
                amount=amount,
                currency=currency.upper(),
                payment_method='mtn_mobile_money',
                payment_type='donation',
                message=message,
                paid=False
            )
            
            # Request payment from MTN
            mtn_service = MTNMobileMoneyService()
            response = mtn_service.request_payment(
                amount=float(amount),
                phone_number=phone_number,
                currency=currency,
                reference_id=str(payment.id),
                message=message or 'Pathfinders Donation'
            )
            
            if response.get('status') == 'SUCCESSFUL':
                # Update payment with MTN transaction ID
                payment.mtn_transaction_id = response.get('transaction_id')
                payment.save()
                
                logger.info(f"Created anonymous MTN donation payment {payment.id} with transaction {payment.mtn_transaction_id}")
                
                return Response({
                    'success': True,
                    'message': 'Payment request sent successfully',
                    'transaction_id': payment.mtn_transaction_id,
                    'instructions': response.get('instructions', 'Check your phone for payment instructions'),
                    'payment_id': payment.id
                })
            else:
                # Delete the payment record if MTN request failed
                payment.delete()
                return Response({
                    'error': response.get('message', 'Failed to process MTN payment request')
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            logger.error(f"Error in anonymous MTN donation: {str(e)}")
            return Response({
                'error': f'Payment processing error: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class MTNWebhookView(views.APIView):
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        """
        Handle MTN Mobile Money webhooks for payment confirmation
        This is called by MTN when payment status changes
        """
        try:
            # TODO: Implement MTN webhook signature verification
            data = request.data
            logger.info(f"Received MTN webhook data: {data}")
            
            # Extract payment information from webhook
            reference_id = data.get('referenceId')
            status = data.get('status')
            amount = data.get('amount')
            currency = data.get('currency')
            financial_transaction_id = data.get('financialTransactionId')
            external_id = data.get('externalId')
            
            if not reference_id:
                logger.error("No reference ID in MTN webhook")
                return Response({
                    'error': 'Reference ID required'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Find the payment record
            payment = Payment.objects.filter(
                mtn_transaction_id=reference_id,
                payment_method='mtn_mobile_money'
            ).first()
            
            if not payment:
                logger.error(f"Payment not found for reference ID: {reference_id}")
                return Response({
                    'error': 'Payment not found'
                }, status=status.HTTP_404_NOT_FOUND)
            
            # Update payment status based on MTN response
            if status == 'SUCCESSFUL':
                payment.paid = True
                if financial_transaction_id:
                    payment.mtn_transaction_id = financial_transaction_id
                payment.save()
                
                logger.info(f"MTN Donation completed: {payment.amount} {payment.currency} from user {payment.user.email}")
                logger.info(f"Financial transaction ID: {financial_transaction_id}")
                
            elif status == 'FAILED':
                # Log the failure reason
                reason = data.get('reason', {})
                logger.warning(f"MTN payment failed for {reference_id}: {reason}")
                
                # Mark as failed but keep the record for audit
                payment.paid = False
                payment.save()
                
            elif status == 'PENDING':
                # Payment is still pending, no action needed
                logger.info(f"MTN payment still pending for {reference_id}")
                
            else:
                logger.warning(f"Unknown MTN payment status: {status} for {reference_id}")
            
            return Response({'status': 'Webhook processed successfully'})
            
        except Exception as e:
            logger.error(f"MTN webhook processing failed: {str(e)}")
            return Response({
                'error': f'Webhook processing failed: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class DonationListView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        """Get user's donation history"""
        try:
            donations = Payment.objects.filter(
                user=request.user,
                payment_type='donation'
            ).order_by('-created_at')
            
            donation_data = []
            for donation in donations:
                donation_data.append({
                    'id': donation.id,
                    'amount': float(donation.amount),
                    'currency': donation.currency,
                    'payment_method': donation.payment_method,
                    'paid': donation.paid,
                    'message': donation.message,
                    'created_at': donation.created_at.isoformat(),
                    'updated_at': donation.updated_at.isoformat(),
                    'stripe_payment_intent': donation.stripe_payment_intent,
                    'mtn_transaction_id': donation.mtn_transaction_id,
                })
            
            return Response({
                'donations': donation_data
            })
            
        except Exception as e:
            logger.error(f"Error fetching donations: {str(e)}")
            return Response({
                'error': 'Failed to fetch donations'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class CancelDonationView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, donation_id):
        """Cancel a pending donation"""
        try:
            donation = Payment.objects.filter(
                id=donation_id,
                user=request.user,
                payment_type='donation',
                paid=False
            ).first()
            
            if not donation:
                return Response({
                    'error': 'Donation not found or cannot be cancelled'
                }, status=status.HTTP_404_NOT_FOUND)
            
            # Delete the pending donation
            donation.delete()
            
            logger.info(f"Donation {donation_id} cancelled by user {request.user.id}")
            
            return Response({
                'message': 'Donation cancelled successfully'
            })
            
        except Exception as e:
            logger.error(f"Error cancelling donation: {str(e)}")
            return Response({
                'error': 'Failed to cancel donation'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class CheckMTNPaymentStatusView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request, reference_id):
        """Check the status of an MTN Mobile Money payment"""
        try:
            from core.services import mtn_service
            
            # Check if user has a payment with this reference ID
            payment = Payment.objects.filter(
                mtn_transaction_id=reference_id,
                user=request.user,
                payment_type='donation',
                payment_method='mtn_mobile_money'
            ).first()
            
            if not payment:
                return Response({
                    'error': 'Payment not found'
                }, status=status.HTTP_404_NOT_FOUND)
            
            # Get status from MTN API
            status_result = mtn_service.get_payment_status(reference_id)
            
            if 'error' in status_result:
                logger.error(f"Failed to get MTN payment status: {status_result['error']}")
                return Response({
                    'error': f'Failed to get payment status: {status_result["error"]}'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Update payment status if it has changed
            if status_result['status'] == 'SUCCESSFUL' and not payment.paid:
                payment.paid = True
                payment.save()
                logger.info(f"Payment {reference_id} marked as paid for user {request.user.id}")
            
            return Response({
                'reference_id': reference_id,
                'status': status_result['status'],
                'amount': status_result.get('amount'),
                'currency': status_result.get('currency'),
                'financial_transaction_id': status_result.get('financial_transaction_id'),
                'payer_message': status_result.get('payer_message'),
                'payee_note': status_result.get('payee_note'),
                'reason': status_result.get('reason')
            })
            
        except Exception as e:
            logger.error(f"Error checking MTN payment status: {str(e)}")
            return Response({
                'error': f'Failed to check payment status: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
