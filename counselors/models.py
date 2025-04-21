from django.db import models
from django.conf import settings
from django.contrib.auth import get_user_model

class Counselor(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='counselor_profile'
    )
    professional_title = models.CharField(max_length=100)
    institution = models.CharField(max_length=200)
    qualification = models.CharField(max_length=200)
    phone_number = models.CharField(max_length=20)
    bio = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.get_full_name()} - {self.professional_title}"

    class Meta:
        verbose_name = 'Counselor'
        verbose_name_plural = 'Counselors'

class CounselorUserRelation(models.Model):
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('completed', 'Completed'),
    ]

    counselor = models.ForeignKey(
        Counselor,
        on_delete=models.CASCADE,
        related_name='counseled_users'
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='counselor_relations'
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='active'
    )
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['counselor', 'user']
        verbose_name = 'Counselor-User Relationship'
        verbose_name_plural = 'Counselor-User Relationships'

    def __str__(self):
        return f"{self.counselor.user.get_full_name()} - {self.user.get_full_name()}" 