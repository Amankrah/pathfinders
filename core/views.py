from django.http import JsonResponse
from django.views.decorators.csrf import ensure_csrf_cookie
from rest_framework import status, permissions, views
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from .models import Payment
from django.contrib.auth import get_user_model

def health_check(request):
    return JsonResponse({"status": "healthy"})

@ensure_csrf_cookie
def serve_frontend(request, path=""):
    if request.path.startswith('/api/'):
        return JsonResponse({"error": "API endpoint not found"}, status=404)
    # Return 200 to let Next.js handle frontend routes
    return JsonResponse({"status": "ok"})

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def validate_payment(request):
    """
    Validate if a user has a valid payment for assessment.
    Can check specific payment or latest valid payment.
    """
    user_id = request.data.get('user_id')
    payment_id = request.data.get('payment_id')
    
    try:
        User = get_user_model()
        user = User.objects.get(id=user_id)
        
        if payment_id:
            # Check specific payment
            payment = Payment.objects.filter(
                stripe_payment_intent=payment_id,
                user=user,
                paid=True
            ).first()
            
            if payment:
                return Response({
                    'is_valid': True,
                    'payment_id': payment_id,
                    'message': 'Valid payment found'
                })
        
        # Check if user has any valid payment
        has_valid = Payment.has_valid_payment(user)
        return Response({
            'is_valid': has_valid,
            'message': 'Valid payment found' if has_valid else 'No valid payment found'
        })
        
    except User.DoesNotExist:
        return Response({
            'is_valid': False,
            'message': 'User not found'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({
            'is_valid': False,
            'message': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
