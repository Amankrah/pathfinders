from django.core.management.base import BaseCommand
from core.models import Payment
from django.utils import timezone


class Command(BaseCommand):
    help = 'Clean up stale pending payments older than specified hours'

    def add_arguments(self, parser):
        parser.add_argument(
            '--hours',
            type=int,
            default=1,
            help='Number of hours after which payments are considered stale (default: 1)'
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be deleted without actually deleting'
        )

    def handle(self, *args, **options):
        hours = options['hours']
        dry_run = options['dry_run']
        
        cutoff_time = timezone.now() - timezone.timedelta(hours=hours)
        stale_payments = Payment.objects.filter(
            paid=False,
            created_at__lt=cutoff_time
        )
        
        count = stale_payments.count()
        
        if count == 0:
            self.stdout.write(
                self.style.SUCCESS(f'No stale payments found older than {hours} hour(s)')
            )
            return
        
        self.stdout.write(f'Found {count} stale payment(s) older than {hours} hour(s):')
        
        for payment in stale_payments:
            self.stdout.write(
                f'  - ID: {payment.id}, User: {payment.user.email}, '
                f'Amount: {payment.amount} {payment.currency}, '
                f'Created: {payment.created_at}, Type: {payment.payment_type}'
            )
        
        if dry_run:
            self.stdout.write(
                self.style.WARNING(f'DRY RUN: Would delete {count} payment(s)')
            )
        else:
            stale_payments.delete()
            self.stdout.write(
                self.style.SUCCESS(f'Successfully deleted {count} stale payment(s)')
            ) 