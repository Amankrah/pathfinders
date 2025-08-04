from django.core.management.base import BaseCommand
from django.conf import settings
from core.services import mtn_service
import logging
import time

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Test MTN Mobile Money integration'

    def add_arguments(self, parser):
        parser.add_argument(
            '--test-phone',
            type=str,
            default='233244123456',
            help='Phone number to test with (default: 233244123456)'
        )
        parser.add_argument(
            '--amount',
            type=float,
            default=1.00,
            help='Amount to test with (default: 1.00)'
        )
        parser.add_argument(
            '--currency',
            type=str,
            default='GHS',
            help='Currency to test with (default: GHS)'
        )
        parser.add_argument(
            '--skip-payment',
            action='store_true',
            help='Skip payment request test'
        )

    def handle(self, *args, **options):
        test_phone = options['test_phone']
        amount = options['amount']
        currency = options['currency']
        skip_payment = options['skip_payment']

        self.stdout.write(
            self.style.SUCCESS(f'Testing MTN Mobile Money integration...')
        )
        self.stdout.write(f'Phone: {test_phone}')
        self.stdout.write(f'Amount: {amount} {currency}')
        self.stdout.write(f'Environment: {settings.MTN_TARGET_ENVIRONMENT}')

        # Test 1: Create API User (based on PHP implementation)
        self.stdout.write('\n1. Testing API user creation...')
        api_user_id = mtn_service._create_api_user()
        if not api_user_id:
            self.stdout.write(
                self.style.ERROR('Failed to create API user')
            )
            self.stdout.write('Please check your MTN subscription keys and try again')
            return
        else:
            self.stdout.write(
                self.style.SUCCESS(f'API user created successfully: {api_user_id}')
            )

        # Test 2: Create API Key
        self.stdout.write('\n2. Testing API key creation...')
        api_key = mtn_service._create_api_key(api_user_id)
        if not api_key:
            self.stdout.write(
                self.style.ERROR('Failed to create API key')
            )
            return
        else:
            self.stdout.write(
                self.style.SUCCESS(f'API key created successfully: {api_key[:10]}...')
            )

        # Test 3: Get Access Token
        self.stdout.write('\n3. Testing access token retrieval...')
        # Set the API credentials
        mtn_service.api_user = api_user_id
        mtn_service.api_key = api_key
        
        access_token = mtn_service._get_access_token()
        if not access_token:
            self.stdout.write(
                self.style.ERROR('Failed to get access token')
            )
            self.stdout.write('Please check your MTN API credentials and subscription key')
            return
        else:
            self.stdout.write(
                self.style.SUCCESS(f'Access token obtained successfully: {access_token[:20]}...')
            )

        # Test 4: Validate account holder
        self.stdout.write('\n4. Testing account holder validation...')
        validation_result = mtn_service.validate_account_holder(test_phone)
        if 'error' in validation_result:
            self.stdout.write(
                self.style.WARNING(f'Validation failed: {validation_result["error"]}')
            )
        else:
            self.stdout.write(
                self.style.SUCCESS(f'Validation result: {validation_result}')
            )

        # Test 5: Get account balance
        self.stdout.write('\n5. Testing account balance...')
        balance_result = mtn_service.get_account_balance()
        if 'error' in balance_result:
            self.stdout.write(
                self.style.WARNING(f'Balance check failed: {balance_result["error"]}')
            )
        else:
            self.stdout.write(
                self.style.SUCCESS(f'Account balance: {balance_result}')
            )

        # Test 6: Request payment (sandbox only)
        if not skip_payment and settings.MTN_TARGET_ENVIRONMENT == 'sandbox':
            self.stdout.write('\n6. Testing payment request (sandbox)...')
            payment_result = mtn_service.request_to_pay(
                amount=amount,
                phone_number=test_phone,
                currency=currency,
                external_id=f"test_{int(time.time())}",
                payer_message=f"Test donation - {amount} {currency}",
                payee_note="Test donation to Pathfinders"
            )
            
            if 'error' in payment_result:
                self.stdout.write(
                    self.style.ERROR(f'Payment request failed: {payment_result["error"]}')
                )
            else:
                self.stdout.write(
                    self.style.SUCCESS(f'Payment request successful: {payment_result}')
                )
                
                # Test 7: Check payment status
                if 'reference_id' in payment_result:
                    self.stdout.write('\n7. Testing payment status check...')
                    status_result = mtn_service.get_payment_status(payment_result['reference_id'])
                    if 'error' in status_result:
                        self.stdout.write(
                            self.style.WARNING(f'Status check failed: {status_result["error"]}')
                        )
                    else:
                        self.stdout.write(
                            self.style.SUCCESS(f'Payment status: {status_result}')
                        )
        elif skip_payment:
            self.stdout.write(
                self.style.WARNING('\n6. Skipping payment request test (--skip-payment flag used)')
            )
        else:
            self.stdout.write(
                self.style.WARNING('\n6. Skipping payment request test (not in sandbox mode)')
            )

        self.stdout.write(
            self.style.SUCCESS('\nMTN integration test completed!')
        ) 