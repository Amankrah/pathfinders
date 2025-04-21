from rest_framework import serializers
from .models import Question, Assessment, GiftProfile

class QuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Question
        fields = ('id', 'category', 'text', 'weight', 'gift_correlation')

class GiftProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = GiftProfile
        fields = ('id', 'user', 'assessment', 'primary_gift', 
                 'secondary_gifts', 'scores', 'timestamp')

class AssessmentSerializer(serializers.ModelSerializer):
    gift_profile = GiftProfileSerializer(read_only=True)
    can_retake = serializers.BooleanField(read_only=True)
    counselor_id = serializers.IntegerField(source='counselor.id', read_only=True, allow_null=True)
    
    class Meta:
        model = Assessment
        fields = ('id', 'user', 'timestamp', 'completion_status', 
                 'results_data', 'gift_profile', 'can_retake', 'counselor_id', 'counselor_notes', 'is_counselor_session', 'session_date')

class AssessmentProgressSerializer(serializers.Serializer):
    timestamp = serializers.DateTimeField()
    primary_gift = serializers.CharField()
    scores = serializers.DictField()

class AssessmentCreateSerializer(serializers.ModelSerializer):
    counselor_notes = serializers.CharField(required=False, allow_blank=True)
    session_date = serializers.DateTimeField(required=False)

    class Meta:
        model = Assessment
        fields = [
            'user',
            'counselor_notes',
            'is_counselor_session',
            'session_date'
        ] 