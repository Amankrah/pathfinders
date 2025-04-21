from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from django.db import transaction
from django.db.models import Prefetch
from .models import Counselor, CounselorUserRelation
from .serializers import (
    CounselorSerializer, 
    CounselorUserRegistrationSerializer,
    CounselorUserRelationSerializer,
    CounselorDashboardUserSerializer, 
    UserDetailSerializer
)
from assessments.models import Assessment, GiftProfile
# Remove importing serializers from assessments to break circular dependency
# from assessments.serializers import AssessmentSerializer, GiftProfileSerializer

User = get_user_model()

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
                user = User.objects.create_user(
                    username=serializer.validated_data['email'],
                    email=serializer.validated_data['email'],
                    first_name=serializer.validated_data['first_name'],
                    last_name=serializer.validated_data['last_name'],
                    password=User.objects.make_random_password()
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
            user_data = {
                'user_id': relation.user.id,
                'full_name': f"{relation.user.first_name} {relation.user.last_name}",
                'email': relation.user.email,
                'status': relation.status,
                'notes': relation.notes,
                'created_at': relation.created_at,
                'assessments': [],
                'gift_profile': None
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

    def _generate_assessment_code(self, user):
        # We'll implement this method later
        # It should generate a unique code for assessment
        return f"ASM-{user.id}-{hash(user.email)}"[:12] 