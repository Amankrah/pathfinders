from rest_framework import serializers
from django.contrib.auth import get_user_model
from users.serializers import UserSerializer
from .models import Counselor, CounselorUserRelation

User = get_user_model()

class CounselorSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = Counselor
        fields = ['id', 'user', 'professional_title', 'institution', 
                 'qualification', 'phone_number', 'bio', 'is_active']

class CounselorRegistrationSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, style={'input_type': 'password'})
    confirm_password = serializers.CharField(write_only=True, style={'input_type': 'password'})
    first_name = serializers.CharField()
    last_name = serializers.CharField()
    professional_title = serializers.CharField()
    institution = serializers.CharField()
    qualification = serializers.CharField()
    phone_number = serializers.CharField()
    bio = serializers.CharField(required=False, allow_blank=True)
    
    def validate(self, data):
        # Check if passwords match
        if data['password'] != data['confirm_password']:
            raise serializers.ValidationError("Passwords do not match")
        
        # Check if email is already in use
        if User.objects.filter(email=data['email']).exists():
            raise serializers.ValidationError("Email address is already in use")
        
        return data

class CounselorLoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, style={'input_type': 'password'})

class CounselorUserRegistrationSerializer(serializers.Serializer):
    email = serializers.EmailField()
    first_name = serializers.CharField()
    last_name = serializers.CharField()
    phone_number = serializers.CharField(required=False)
    notes = serializers.CharField(required=False)

class CounselorUserRelationSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = CounselorUserRelation
        fields = ['id', 'user', 'status', 'notes', 'created_at']

class AssessmentSummarySerializer(serializers.Serializer):
    id = serializers.IntegerField()
    completion_status = serializers.BooleanField()
    created_at = serializers.DateTimeField()
    counselor_notes = serializers.CharField()
    results = serializers.JSONField(required=False)

class GiftProfileSummarySerializer(serializers.Serializer):
    primary_gift = serializers.CharField()
    secondary_gifts = serializers.JSONField()
    scores = serializers.JSONField()
    timestamp = serializers.DateTimeField()

class CounselorDashboardUserSerializer(serializers.Serializer):
    user_id = serializers.IntegerField()
    full_name = serializers.CharField()
    email = serializers.CharField()
    status = serializers.CharField()
    notes = serializers.CharField()
    created_at = serializers.DateTimeField()
    assessments = AssessmentSummarySerializer(many=True)
    gift_profile = GiftProfileSummarySerializer(allow_null=True)
    assessment_count = serializers.IntegerField(required=False)
    max_limit = serializers.IntegerField(required=False)
    can_take_more = serializers.BooleanField(required=False)

class UserDetailSerializer(serializers.Serializer):
    user = serializers.DictField()
    assessments = serializers.ListField()
    gift_profile = serializers.DictField(allow_null=True)

class CounselorNotesSerializer(serializers.Serializer):
    notes = serializers.CharField(required=True) 