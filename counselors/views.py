from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.auth import get_user_model, authenticate
from django.db import transaction
from django.db.models import Prefetch, Count
from rest_framework.authtoken.models import Token
from .models import Counselor, CounselorUserRelation
from .serializers import (
    CounselorSerializer, 
    CounselorUserRegistrationSerializer,
    CounselorUserRelationSerializer,
    CounselorDashboardUserSerializer, 
    UserDetailSerializer,
    CounselorRegistrationSerializer,
    CounselorLoginSerializer
)
from assessments.models import Assessment, GiftProfile
# Remove importing serializers from assessments to break circular dependency
# from assessments.serializers import AssessmentSerializer, GiftProfileSerializer
import string
import random

User = get_user_model()

def generate_random_password(length=12):
    """Generate a secure random password"""
    characters = string.ascii_letters + string.digits + string.punctuation
    return ''.join(random.choice(characters) for _ in range(length))

class CounselorAuthViewSet(viewsets.ViewSet):
    permission_classes = [permissions.AllowAny]

    @action(detail=False, methods=['post'], url_path='register')
    def register(self, request):
        serializer = CounselorRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            try:
                with transaction.atomic():
                    # Create user account
                    user_data = {
                        'email': serializer.validated_data['email'],
                        'username': serializer.validated_data['email'],
                        'password': serializer.validated_data['password'],
                        'first_name': serializer.validated_data['first_name'],
                        'last_name': serializer.validated_data['last_name'],
                    }
                    user = User.objects.create_user(**user_data)
                    
                    # Create counselor profile
                    counselor = Counselor.objects.create(
                        user=user,
                        professional_title=serializer.validated_data['professional_title'],
                        institution=serializer.validated_data['institution'],
                        qualification=serializer.validated_data['qualification'],
                        phone_number=serializer.validated_data['phone_number'],
                        bio=serializer.validated_data.get('bio', '')
                    )
                    
                    # Generate auth token - Fix the token creation
                    token = Token.objects.create(user=user)
                    
                    return Response({
                        'token': token.key,
                        'user_id': user.id,
                        'email': user.email,
                        'counselor_id': counselor.id
                    }, status=status.HTTP_201_CREATED)
            except Exception as e:
                return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'], url_path='login')
    def login(self, request):
        serializer = CounselorLoginSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            password = serializer.validated_data['password']
            
            user = authenticate(username=email, password=password)
            
            if not user:
                return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)
            
            # Check if user is a counselor
            try:
                counselor = Counselor.objects.get(user=user)
            except Counselor.DoesNotExist:
                return Response({'error': 'User is not a counselor'}, status=status.HTTP_403_FORBIDDEN)
            
            # Generate or get auth token
            token, created = Token.objects.get_or_create(user=user)
            
            return Response({
                'token': token.key,
                'user_id': user.id,
                'email': user.email,
                'counselor_id': counselor.id,
                'name': f"{user.first_name} {user.last_name}",
                'professional_title': counselor.professional_title
            })
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class CounselorViewSet(viewsets.ModelViewSet):
    serializer_class = CounselorSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if hasattr(self.request.user, 'counselor_profile'):
            return Counselor.objects.filter(id=self.request.user.counselor_profile.id)
        return Counselor.objects.none()

    @action(detail=False, methods=['post'])
    def register_user(self, request):
        if not hasattr(request.user, 'counselor_profile'):
            return Response(
                {"error": "Only counselors can register users"},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = CounselorUserRegistrationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            with transaction.atomic():
                # Create user with random password
                random_password = generate_random_password()
                user = User.objects.create_user(
                    username=serializer.validated_data['email'],
                    email=serializer.validated_data['email'],
                    first_name=serializer.validated_data['first_name'],
                    last_name=serializer.validated_data['last_name'],
                    password=random_password
                )

                # Create counselor-user relation
                relation = CounselorUserRelation.objects.create(
                    counselor=request.user.counselor_profile,
                    user=user,
                    notes=serializer.validated_data.get('notes', '')
                )

                # Generate assessment link/code (we'll implement this later)
                assessment_code = self._generate_assessment_code(user)

                return Response({
                    'user_id': user.id,
                    'email': user.email,
                    'assessment_code': assessment_code
                }, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=False, methods=['get'])
    def my_users(self, request):
        if not hasattr(request.user, 'counselor_profile'):
            return Response(
                {"error": "Only counselors can view their users"},
                status=status.HTTP_403_FORBIDDEN
            )

        relations = CounselorUserRelation.objects.filter(
            counselor=request.user.counselor_profile
        ).select_related('user')

        serializer = CounselorUserRelationSerializer(relations, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'], url_path='user-assessments')
    def user_assessments(self, request, pk=None):
        """Get assessments for a specific user with limit information"""
        try:
            # Check if relationship exists
            relation = CounselorUserRelation.objects.get(
                counselor=request.user.counselor_profile,
                user_id=pk
            )
            
            user = relation.user
            
            # Get assessments
            assessments = Assessment.objects.filter(user=user).order_by('-created_at')
            
            # Count completed assessments
            completed_count = assessments.filter(completion_status=True).count()
            
            # Get the maximum assessment limit
            max_limit = 3  # Hardcoded for now, could be made configurable
            
            # Format assessment data
            assessment_data = []
            for assessment in assessments:
                assessment_data.append({
                    'id': assessment.id,
                    'title': assessment.title or 'Motivational Gift Assessment',
                    'description': assessment.description,
                    'created_at': assessment.created_at,
                    'updated_at': assessment.updated_at,
                    'completion_status': assessment.completion_status,
                    'counselor_notes': assessment.counselor_notes,
                    'is_counselor_session': assessment.is_counselor_session,
                    'session_date': assessment.session_date,
                    'results_data': assessment.results_data if assessment.completion_status else None
                })
            
            return Response({
                'user_id': user.id,
                'assessments': assessment_data,
                'completed_count': completed_count,
                'max_limit': max_limit,
                'can_take_more': completed_count < max_limit
            })
            
        except CounselorUserRelation.DoesNotExist:
            return Response(
                {'error': 'User relation not found'},
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=False, methods=['get'])
    def dashboard(self, request):
        """Get all dashboard data for counselor"""
        if not hasattr(request.user, 'counselor_profile'):
            return Response(
                {"error": "Only counselors can access dashboard"},
                status=status.HTTP_403_FORBIDDEN
            )

        # Get all users registered under this counselor with their latest data
        relations = CounselorUserRelation.objects.filter(
            counselor=request.user.counselor_profile
        ).select_related(
            'user',
            'user__profile'
        ).prefetch_related(
            Prefetch(
                'user__assessment_set',
                queryset=Assessment.objects.order_by('-created_at'),
                to_attr='latest_assessments'
            ),
            Prefetch(
                'user__giftprofile_set',
                queryset=GiftProfile.objects.order_by('-timestamp'),
                to_attr='latest_gift_profiles'
            )
        )

        data = []
        for relation in relations:
            # Count completed assessments
            completed_count = Assessment.objects.filter(
                user=relation.user, 
                completion_status=True
            ).count()
            
            user_data = {
                'user_id': relation.user.id,
                'full_name': f"{relation.user.first_name} {relation.user.last_name}",
                'email': relation.user.email,
                'status': relation.status,
                'notes': relation.notes,
                'created_at': relation.created_at,
                'assessments': [],
                'gift_profile': None,
                'assessment_count': completed_count,
                'max_limit': 3,
                'can_take_more': completed_count < 3
            }

            # Add latest assessment data
            if hasattr(relation.user, 'latest_assessments'):
                for assessment in relation.user.latest_assessments[:3]:  # Last 3 assessments
                    user_data['assessments'].append({
                        'id': assessment.id,
                        'completion_status': assessment.completion_status,
                        'created_at': assessment.created_at,
                        'counselor_notes': assessment.counselor_notes,
                        'results': assessment.results_data if assessment.completion_status else None
                    })

            # Add latest gift profile
            if hasattr(relation.user, 'latest_gift_profiles') and relation.user.latest_gift_profiles:
                latest_profile = relation.user.latest_gift_profiles[0]
                user_data['gift_profile'] = {
                    'primary_gift': latest_profile.primary_gift,
                    'secondary_gifts': latest_profile.secondary_gifts,
                    'scores': latest_profile.scores,
                    'timestamp': latest_profile.timestamp
                }

            data.append(user_data)

        return Response(data)

    @action(detail=True, methods=['post'])
    def update_notes(self, request, pk=None):
        """Update notes for a specific user relation"""
        try:
            relation = CounselorUserRelation.objects.get(
                counselor=request.user.counselor_profile,
                user_id=pk
            )
            relation.notes = request.data.get('notes', '')
            relation.save()
            return Response({
                'message': 'Notes updated successfully',
                'notes': relation.notes
            })
        except CounselorUserRelation.DoesNotExist:
            return Response(
                {'error': 'User relation not found'},
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=True, methods=['get'])
    def user_details(self, request, pk=None):
        """Get detailed information about a specific user"""
        try:
            relation = CounselorUserRelation.objects.get(
                counselor=request.user.counselor_profile,
                user_id=pk
            )
            
            # Get all assessments for this user
            assessments = Assessment.objects.filter(
                user=relation.user
            ).order_by('-created_at')
            
            # Get latest gift profile
            gift_profile = GiftProfile.objects.filter(
                user=relation.user
            ).order_by('-timestamp').first()
            
            # Use our custom serializer that avoids circular imports
            serializer = UserDetailSerializer(data={
                'user': {
                    'id': relation.user.id,
                    'full_name': f"{relation.user.first_name} {relation.user.last_name}",
                    'email': relation.user.email,
                    'status': relation.status,
                    'notes': relation.notes
                },
                'assessments': [
                    {
                        'id': a.id,
                        'completion_status': a.completion_status, 
                        'created_at': a.created_at,
                        'counselor_notes': a.counselor_notes,
                        'results_data': a.results_data if a.completion_status else None
                    } for a in assessments
                ],
                'gift_profile': {
                    'primary_gift': gift_profile.primary_gift,
                    'secondary_gifts': gift_profile.secondary_gifts,
                    'scores': gift_profile.scores,
                    'timestamp': gift_profile.timestamp
                } if gift_profile else None
            })
            serializer.is_valid()
            
            return Response(serializer.validated_data)
        except CounselorUserRelation.DoesNotExist:
            return Response(
                {'error': 'User relation not found'},
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=True, methods=['patch'], url_path='update_user')
    def update_user(self, request, pk=None):
        """Update information for a specific user"""
        try:
            # Check if relationship exists
            relation = CounselorUserRelation.objects.get(
                counselor=request.user.counselor_profile,
                user_id=pk
            )
            
            user = relation.user
            
            # Update user information
            if 'first_name' in request.data:
                user.first_name = request.data['first_name']
            
            if 'last_name' in request.data:
                user.last_name = request.data['last_name']
            
            if 'email' in request.data:
                user.email = request.data['email']
                user.username = request.data['email']  # Update username to match email
            
            # Save user changes
            user.save()
            
            # Update relation information
            if 'notes' in request.data:
                relation.notes = request.data['notes']
            
            if 'status' in request.data:
                relation.status = request.data['status']
                
            # Save relation changes
            relation.save()
            
            return Response({
                'message': 'User updated successfully',
                'user': {
                    'id': user.id,
                    'full_name': f"{user.first_name} {user.last_name}",
                    'email': user.email,
                    'status': relation.status,
                    'notes': relation.notes
                }
            })
        except CounselorUserRelation.DoesNotExist:
            return Response(
                {'error': 'User relation not found'},
                status=status.HTTP_404_NOT_FOUND
            )

    def _generate_assessment_code(self, user):
        # We'll implement this method later
        # It should generate a unique code for assessment
        return f"ASM-{user.id}-{hash(user.email)}"[:12] 