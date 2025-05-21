from django.core.management.base import BaseCommand
from core.test_fastapi import test_fastapi_connection

class Command(BaseCommand):
    help = 'Test connection to FastAPI service'

    def handle(self, *args, **kwargs):
        self.stdout.write('Testing FastAPI connection...')
        
        success, result = test_fastapi_connection()
        
        if success:
            self.stdout.write(self.style.SUCCESS('FastAPI connection successful!'))
            self.stdout.write(f"Primary gift: {result.get('primary_gift')}")
            self.stdout.write(f"Secondary gifts: {', '.join(result.get('secondary_gifts', []))}")
        else:
            self.stdout.write(self.style.ERROR(f'FastAPI connection failed: {result}'))
            self.stdout.write(self.style.WARNING(
                'Make sure the FastAPI service is running with: python run_fastapi.py'
            )) 