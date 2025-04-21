from datetime import timedelta
from django.db import models
from django.conf import settings
from django.utils import timezone
from users.models import User

class Assessment(models.Model):
    title = models.CharField(max_length=200, default="Default Assessment Title")
    description = models.TextField(default="Default Assessment Description")
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    timestamp = models.DateTimeField(auto_now_add=True)
    completion_status = models.BooleanField(default=False)
    results_data = models.JSONField(null=True, blank=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    counselor = models.ForeignKey(
        'counselors.Counselor',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='conducted_assessments'
    )
    counselor_notes = models.TextField(blank=True)
    is_counselor_session = models.BooleanField(default=False)
    session_date = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
        
    def __str__(self):
        return f"{self.title} - {self.user.username}"
    
    def validate_answers(self, answers):
        """Validate assessment answers"""
        required_questions = Question.objects.count()
        if len(answers) != required_questions:
            raise ValueError(f"Expected {required_questions} answers, got {len(answers)}")
        
        for answer in answers:
            if not (1 <= answer['answer'] <= 5):
                raise ValueError("Answers must be between 1 and 5")
    
    def is_complete(self):
        """Check if assessment is complete"""
        return self.completion_status and self.results_data is not None
    
    def can_retake(self):
        """Check if user can retake assessment (e.g., after 30 days)"""
        if not self.completion_status:
            return False
        return (timezone.now() - self.timestamp) > timedelta(days=30)

class Question(models.Model):
    assessment = models.ForeignKey(Assessment, on_delete=models.CASCADE, null=True, blank=True)
    category = models.CharField(max_length=100)
    text = models.TextField()
    weight = models.FloatField(default=1.0)
    gift_correlation = models.JSONField()
    options = models.JSONField(default=list)  # Default empty list
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.category}: {self.text[:50]}..."

class GiftProfile(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    assessment = models.ForeignKey(Assessment, on_delete=models.CASCADE)
    primary_gift = models.CharField(max_length=100)
    secondary_gifts = models.JSONField()
    scores = models.JSONField()
    timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-timestamp']
        
    def __str__(self):
        return f"Gift Profile for {self.user.username}"

class AssessmentResult(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    assessment = models.ForeignKey(Assessment, on_delete=models.CASCADE)
    answers = models.JSONField()  # Store answers as JSON
    primary_gift = models.CharField(max_length=100)
    secondary_gift = models.CharField(max_length=100)
    timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-timestamp']
        
    def __str__(self):
        return f"{self.user.username}'s results for {self.assessment.title}"
