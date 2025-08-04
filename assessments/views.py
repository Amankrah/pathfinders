from django.shortcuts import render
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Question, Assessment, GiftProfile
from .serializers import (
    QuestionSerializer, 
    AssessmentSerializer, 
    AssessmentProgressSerializer
)
from .gift_calculator import GiftCalculator
from django.utils import timezone
import asyncio
from core.services import FastAPIClient
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from books.services import BookAccessService
from django.db.models import Q
from core.models import Payment

class QuestionViewSet(viewsets.ModelViewSet):
    serializer_class = QuestionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """Return all active questions"""
        return Question.objects.all().order_by('id')
 
    @action(detail=False, methods=['get'])
    def list_all(self, request):
        """Get all questions for assessment"""
        questions = self.get_queryset()
        serializer = self.get_serializer(questions, many=True)
        return Response(serializer.data)

@method_decorator(csrf_exempt, name='dispatch')
class AssessmentViewSet(viewsets.ModelViewSet):
    serializer_class = AssessmentSerializer
    permission_classes = [permissions.IsAuthenticated]
    calculator = GiftCalculator()

    def get_queryset(self):
        queryset = Assessment.objects.all()
        
        if hasattr(self.request.user, 'counselor_profile'):
            # Counselors can see assessments they've conducted
            return queryset.filter(
                Q(counselor=self.request.user.counselor_profile) |
                Q(user__in=self.request.user.counselor_profile.counseled_users.values('user'))
            )
        
        # Regular users see only their own assessments
        return queryset.filter(user=self.request.user)
        
    def perform_create(self, serializer):
        # Check if user has reached the assessment limit before creating a new one
        if not hasattr(self.request.user, 'counselor_profile') and Assessment.has_reached_limit(self.request.user):
            raise ValueError("You have reached the maximum limit of 3 assessments")

        if hasattr(self.request.user, 'counselor_profile'):
            # For counselors, create assessment for target user
            serializer.save(counselor=self.request.user.counselor_profile)
        else:
            # For regular users, create assessment for themselves
            serializer.save(user=self.request.user)
    
    def create(self, request, *args, **kwargs):
        try:
            return super().create(request, *args, **kwargs)
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['get'])
    def get_questions(self, request, pk=None):
        """Get questions for a specific assessment"""
        assessment = self.get_object()
        questions = Question.objects.filter(assessment=assessment)
        serializer = QuestionSerializer(questions, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='start-assessment')
    def start_assessment(self, request, pk=None):
        assessment = self.get_object()
        # Add your start assessment logic here
        return Response({'status': 'assessment started'})

    @action(detail=False, methods=['post'])
    def submit(self, request):
        """Submit assessment answers"""
        try:
            # Check if user has reached the assessment limit
            if Assessment.has_reached_limit(request.user):
                return Response(
                    {'error': "You have reached the maximum limit of 3 assessments"},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
            answers = request.data.get('answers', [])
            if not answers:
                return Response(
                    {'error': "No answers provided"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Format answers for FastAPI
            formatted_data = {
                'user_id': request.user.id,
                'answers': [
                    {
                        'question_id': answer['question_id'],
                        'answer': int(answer['answer']),
                        'gift_correlation': {
                            k.upper(): float(v)
                            for k, v in answer['gift_correlation'].items()
                        }
                    }
                    for answer in answers
                ]
            }

            # Calculate results using FastAPI client
            client = FastAPIClient()
            try:
                # Use synchronous request instead of async
                results = client.calculate_gifts_sync(formatted_data)
                
                # Create new assessment
                assessment = Assessment.objects.create(
                    user=request.user,
                    completion_status=True,
                    results_data=results
                )

                # Add debug logging before creating gift profile
                print(f"Debug - Results from FastAPI: {results}")
                print(f"Debug - Creating gift profile with primary: {results['primary_gift']}, secondary: {results['secondary_gifts']}")
                
                gift_profile = GiftProfile.objects.create(
                    user=request.user,
                    assessment=assessment,
                    primary_gift=results['primary_gift'],
                    secondary_gifts=results['secondary_gifts'],
                    scores=results['scores']
                )

                # Add debug logging before granting book access
                print(f"Debug - About to grant book access for user {request.user.id}")
                print(f"Debug - Gift Profile ID: {gift_profile.id}")
                BookAccessService.grant_gift_based_access(request.user, gift_profile)
                print("Debug - Book access granted")

                return Response(results, status=status.HTTP_200_OK)

            except ValueError as e:
                return Response(
                    {'error': str(e)}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            except Exception as e:
                return Response(
                    {'error': f"Calculation failed: {str(e)}"}, 
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

        except Exception as e:
            return Response(
                {'error': f"Submission failed: {str(e)}"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['post'])
    def save_progress(self, request):
        """Save partial assessment progress"""
        try:
            assessment = Assessment.objects.get(
                user=request.user,
                completion_status=False
            )
            current_answers = request.data.get('current_answers', [])
            
            assessment.results_data = {
                'progress': current_answers,
                'last_updated': timezone.now().isoformat()
            }
            assessment.save()
            return Response({'status': 'progress saved'})
        except Assessment.DoesNotExist:
            return Response(
                {'error': 'No incomplete assessment found'},
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=False, methods=['get'])
    def get_progress(self, request):
        """Retrieve partial assessment progress"""
        try:
            assessment = Assessment.objects.get(
                user=request.user,
                completion_status=False
            )
            progress = assessment.results_data.get('progress', [])
            return Response(progress)
        except Assessment.DoesNotExist:
            return Response([])

    @action(detail=False, methods=['get'], url_path='latest-results')
    def latest_results(self, request):
        """Get user's latest assessment results"""
        print("Debug: Accessing latest_results endpoint")
        try:
            latest_assessment = Assessment.objects.filter(
                user=request.user,
                completion_status=True
            ).latest('created_at')
            
            latest_profile = GiftProfile.objects.get(
                user=request.user,
                assessment=latest_assessment
            )

            print("Debug - Gift Scores:", latest_profile.scores)

            calculator = GiftCalculator()
            primary_gift, secondary_gifts = calculator.identify_gifts(
                latest_profile.scores, 
                threshold_factor=0.80
            )
            
            descriptions = calculator.get_gift_descriptions(
                primary_gift,
                secondary_gifts
            )

            # Get recommended roles
            roles = latest_profile.user.profile.get_recommended_roles()
            
            return Response({
                'scores': latest_profile.scores,
                'primary_gift': primary_gift,
                'secondary_gifts': secondary_gifts,
                'last_assessment': latest_assessment.created_at.isoformat(),
                'descriptions': descriptions or latest_assessment.results_data.get('descriptions', {}),
                'recommended_roles': roles
            })
        except (Assessment.DoesNotExist, GiftProfile.DoesNotExist) as e:
            print(f"Debug - Error in latest_results: {str(e)}")
            return Response(
                {'error': 'No completed assessments found'}, 
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=True, methods=['post'])
    async def submit_assessment(self, request, pk=None):
        # Check if user has reached the assessment limit
        if Assessment.has_reached_limit(request.user):
            return Response(
                {'error': "You have reached the maximum limit of 3 assessments"},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        assessment = self.get_object()
        client = FastAPIClient()
        
        try:
            results = await client.calculate_gifts(request.data)
            # Store results including recommended roles
            assessment.results_data = results
            assessment.save()
            
            # Create gift profile
            gift_profile = GiftProfile.objects.create(
                user=request.user,
                assessment=assessment,
                primary_gift=results['primary_gift'],
                secondary_gifts=results['secondary_gifts'],
                scores=results['scores']
            )
            
            # Grant book access based on identified gifts
            BookAccessService.grant_gift_based_access(request.user, gift_profile)
            
            return Response(results)
        finally:
            asyncio.run(client.close())

    @action(detail=True, methods=['post'])
    def submit_response(self, request, pk=None):
        assessment = self.get_object()
        
        try:
            # If a counselor is submitting, skip the limit check
            if not hasattr(request.user, 'counselor_profile'):
                # Check if user has reached the assessment limit
                if Assessment.has_reached_limit(assessment.user):
                    return Response(
                        {'error': "The user has reached the maximum limit of 3 assessments"},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            
            # Validate the answers
            answers = request.data.get('answers', [])
            if not answers:
                return Response(
                    {'error': 'No answers provided'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Add counselor context to responses if applicable
            if hasattr(request.user, 'counselor_profile'):
                assessment.counselor_notes = request.data.get('counselor_notes', '')
                assessment.session_date = timezone.now()
                assessment.is_counselor_session = True
                assessment.counselor = request.user.counselor_profile
            
            # Format answers for FastAPI
            formatted_data = {
                'user_id': assessment.user.id,
                'answers': [
                    {
                        'question_id': answer['question_id'],
                        'answer': int(answer['answer']),
                        'gift_correlation': {
                            k.upper(): float(v)
                            for k, v in answer['gift_correlation'].items()
                        }
                    }
                    for answer in answers
                ]
            }
            
            # Calculate results using FastAPI client
            client = FastAPIClient()
            try:
                print(f"Debug - Submitting assessment responses to FastAPI for user {assessment.user.id}")
                # Use synchronous request
                results = client.calculate_gifts_sync(formatted_data)
                
                print(f"Debug - Results from FastAPI: {results}")
                print(f"Debug - Creating gift profile with primary: {results['primary_gift']}, secondary: {results['secondary_gifts']}")
                
                # Update assessment with results
                assessment.results_data = results
                assessment.completion_status = True
                assessment.save()
                
                # Create gift profile
                gift_profile = GiftProfile.objects.create(
                    user=assessment.user,
                    assessment=assessment,
                    primary_gift=results['primary_gift'],
                    secondary_gifts=results['secondary_gifts'],
                    scores=results['scores']
                )
                
                # Grant book access based on identified gifts
                print(f"Debug - About to grant book access for user {assessment.user.id}")
                print(f"Debug - Gift Profile ID: {gift_profile.id}")
                BookAccessService.grant_gift_based_access(assessment.user, gift_profile)
                print("Debug - Book access granted")
                
                return Response({
                    'message': 'Assessment completed successfully',
                    'assessment_id': assessment.id,
                    'results': assessment.results_data
                }, status=status.HTTP_200_OK)
                
            except ValueError as e:
                print(f"Debug - FastAPI calculation error: {str(e)}")
                # Fallback to local calculation if FastAPI fails
                calculator = GiftCalculator()
                scores = calculator.calculate_scores(answers)
                primary_gift, secondary_gifts = calculator.identify_gifts(scores)
                descriptions = calculator.get_gift_descriptions(primary_gift, secondary_gifts)
                
                # Update assessment with results
                assessment.results_data = {
                    'scores': scores,
                    'primary_gift': primary_gift,
                    'secondary_gifts': secondary_gifts,
                    'descriptions': descriptions,
                    'answers': answers
                }
                assessment.completion_status = True
                assessment.save()
                
                # Create gift profile
                gift_profile = GiftProfile.objects.create(
                    user=assessment.user,
                    assessment=assessment,
                    primary_gift=primary_gift,
                    secondary_gifts=secondary_gifts,
                    scores=scores
                )
                
                # Grant book access based on identified gifts
                BookAccessService.grant_gift_based_access(assessment.user, gift_profile)
                
                return Response({
                    'message': 'Assessment completed successfully (fallback calculation)',
                    'assessment_id': assessment.id,
                    'results': assessment.results_data
                }, status=status.HTTP_200_OK)
                
            except Exception as e:
                print(f"Debug - Unexpected error in FastAPI calculation: {str(e)}")
                return Response(
                    {'error': f"Calculation failed: {str(e)}"}, 
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            
        except Exception as e:
            print(f"Debug - Exception in submit_response: {str(e)}")
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['post'])
    def add_counselor_notes(self, request, pk=None):
        if not hasattr(request.user, 'counselor_profile'):
            return Response(
                {"error": "Only counselors can add notes"},
                status=status.HTTP_403_FORBIDDEN
            )

        assessment = self.get_object()
        assessment.counselor_notes = request.data.get('notes', '')
        assessment.save()

        return Response({
            "message": "Notes added successfully",
            "assessment": AssessmentSerializer(assessment).data
        })

    @action(detail=False, methods=['get'])
    def assessment_count(self, request):
        """Get the number of assessments a user has taken and the maximum limit"""
        if not request.user.is_authenticated:
            return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)
            
        completed_count = Assessment.objects.filter(
            user=request.user,
            completion_status=True
        ).count()
        
        return Response({
            'completed_assessments': completed_count,
            'max_limit': 3,
            'can_take_more': completed_count < 3
        })
