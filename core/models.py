from django.db import models
from django.conf import settings
from django.utils import timezone

# Create your models here.

class Payment(models.Model):
    PAYMENT_TYPES = [
        ('assessment', 'Assessment Payment'),
        ('donation', 'Donation'),
    ]
    
    PAYMENT_METHODS = [
        ('stripe_card', 'Stripe Card Payment'),
        ('mtn_mobile_money', 'MTN Mobile Money'),
    ]
    
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    payment_type = models.CharField(max_length=20, choices=PAYMENT_TYPES, default='donation')
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHODS, default='stripe_card')
    stripe_payment_intent = models.CharField(max_length=255, null=True, blank=True)
    mtn_transaction_id = models.CharField(max_length=255, null=True, blank=True)
    amount = models.DecimalField(max_digits=8, decimal_places=2)
    currency = models.CharField(max_length=10, default='usd')
    paid = models.BooleanField(default=False)
    message = models.TextField(blank=True, help_text="Optional message from donor")
    assessment = models.OneToOneField('assessments.Assessment', null=True, blank=True, on_delete=models.SET_NULL)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        if self.payment_type == 'donation':
            return f"Donation of {self.amount} {self.currency} from {self.user}"
        return f"Payment {self.stripe_payment_intent or self.mtn_transaction_id} for {self.user}"

    @classmethod
    def has_valid_payment(cls, user):
        """Check if user has a valid payment within the last 30 days - kept for backwards compatibility but not used for assessments anymore"""
        return cls.objects.filter(
            user=user,
            paid=True,
            payment_type='assessment',
            created_at__gte=timezone.now() - timezone.timedelta(days=30)
        ).exists()
        
    @classmethod
    def get_total_donations(cls):
        """Get total amount of donations"""
        from django.db.models import Sum
        return cls.objects.filter(
            payment_type='donation',
            paid=True
        ).aggregate(total=Sum('amount'))['total'] or 0

    @classmethod
    def cleanup_stale_pending_payments(cls, hours_old=1):
        """Clean up stale pending payments older than specified hours"""
        cutoff_time = timezone.now() - timezone.timedelta(hours=hours_old)
        stale_payments = cls.objects.filter(
            paid=False,
            created_at__lt=cutoff_time
        )
        count = stale_payments.count()
        if count > 0:
            stale_payments.delete()
        return count

    @classmethod
    def get_pending_payments_for_user(cls, user, hours_old=1):
        """Get pending payments for a user within the specified time window"""
        cutoff_time = timezone.now() - timezone.timedelta(hours=hours_old)
        return cls.objects.filter(
            user=user,
            paid=False,
            created_at__gte=cutoff_time
        )

    def is_stale(self, hours_old=1):
        """Check if this payment is stale (older than specified hours and not paid)"""
        if self.paid:
            return False
        cutoff_time = timezone.now() - timezone.timedelta(hours=hours_old)
        return self.created_at < cutoff_time
