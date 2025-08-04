"""
URL configuration for pathfinders_project project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include, re_path
from rest_framework.routers import DefaultRouter
from users.views import UserViewSet, ProfileViewSet, LoginView, LogoutView, CsrfTokenView
from assessments.views import QuestionViewSet, AssessmentViewSet
from books.views import BookViewSet, CareerChoiceViewSet, CareerResearchNoteViewSet
from core.views import serve_frontend, health_check
from counselors.views import CounselorViewSet

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='users')
router.register(r'profiles', ProfileViewSet, basename='profile')
router.register(r'questions', QuestionViewSet, basename='question')
router.register(r'assessments', AssessmentViewSet, basename='assessment')
router.register(r'books', BookViewSet, basename='book')
router.register(r'career-choices', CareerChoiceViewSet, basename='career-choice')
router.register(r'career-notes', CareerResearchNoteViewSet, basename='career-note')
router.register(r'counselors', CounselorViewSet, basename='counselor')

urlpatterns = [
    path('admin/', admin.site.urls),
    # Public health check endpoint (no authentication required)
    path('health/', health_check, name='health-check'),
    path('api/health/', health_check, name='api-health-check'),
    path('api/', include([
        # Public endpoints (no authentication required)
        path('auth/', include([
            path('login/', LoginView.as_view(), name='user-login'),
            path('logout/', LogoutView.as_view(), name='user-logout'),
            path('register/', UserViewSet.as_view({'post': 'register'}), name='user-register'),
            path('csrf/', CsrfTokenView.as_view(), name='csrf-token'),
        ])),
        # Protected endpoints (require authentication)
        path('', include(router.urls)),
        path('auth/', include([
            path('me/', UserViewSet.as_view({'get': 'me'}), name='user-me'),
            path('profile/', UserViewSet.as_view({
                'get': 'profile',
                'patch': 'profile',
                'put': 'profile'
            }), name='user-profile'),
            path('profile/<int:pk>/', ProfileViewSet.as_view({
                'get': 'retrieve',
                'patch': 'partial_update',
                'put': 'update'
            }), name='profile-detail'),
        ])),
        path('counselors/', include('counselors.urls')),
        path('', include('assessments.urls')),
        path('core/', include('core.urls')),
    ])),
    # Serve frontend for all other routes
    re_path(r'^(?P<path>.*)$', serve_frontend, name='frontend'),
]
