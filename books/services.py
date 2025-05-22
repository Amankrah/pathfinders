from django.utils import timezone
from django.db import models
from datetime import timedelta
from .models import Book, BookAccess

class BookAccessService:
    @staticmethod
    def grant_gift_based_access(user, gift_profile):
        """Grant book access based on primary and secondary gifts"""
        try:
            print(f"Debug - Starting grant_gift_based_access for user {user.id}")
            print(f"Debug - Primary gift: {gift_profile.primary_gift}")
            print(f"Debug - Secondary gifts: {gift_profile.secondary_gifts}")
            
            # First, deactivate any existing book access
            BookAccess.objects.filter(user=user).update(is_active=False)
            
            # Clean and standardize the gift names
            def clean_gift_name(gift):
                gift = gift.split('(')[0].strip().upper()
                print(f"Debug - Cleaned gift name: {gift}")
                return gift
            
            primary_gift = clean_gift_name(gift_profile.primary_gift)
            print(f"Debug - Looking for books with primary gift: {primary_gift}")
            primary_books = Book.objects.filter(associated_gift=primary_gift)
            print(f"Debug - Found {primary_books.count()} primary books")
            
            secondary_gifts = [clean_gift_name(gift) for gift in gift_profile.secondary_gifts]
            print(f"Debug - Looking for books with secondary gifts: {secondary_gifts}")
            secondary_books = Book.objects.filter(associated_gift__in=secondary_gifts)
            print(f"Debug - Found {secondary_books.count()} secondary books")
            
            # Grant access and log each book
            for book in primary_books:
                print(f"Debug - Granting PRIMARY access to book: {book.title}")
                BookAccess.objects.update_or_create(
                    user=user,
                    book=book,
                    defaults={
                        'access_reason': 'PRIMARY',
                        'is_active': True,
                        'expires_at': timezone.now() + timedelta(days=365)
                    }
                )
            
            for book in secondary_books:
                print(f"Debug - Granting SECONDARY access to book: {book.title}")
                BookAccess.objects.update_or_create(
                    user=user,
                    book=book,
                    defaults={
                        'access_reason': 'SECONDARY',
                        'is_active': True,
                        'expires_at': timezone.now() + timedelta(days=365)
                    }
                )
            
            print(f"Debug - Book access grant completed successfully for user {user.id}")
        except Exception as e:
            print(f"Error in grant_gift_based_access: {str(e)}")
            raise

    @staticmethod
    def get_accessible_books(user):
        """Get all books the user currently has access to"""
        return Book.objects.filter(
            user_access__user=user,
            user_access__is_active=True
        ).filter(
            models.Q(user_access__expires_at__isnull=True) |
            models.Q(user_access__expires_at__gt=timezone.now())
        ).distinct() 