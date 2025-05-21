from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CounselorViewSet, CounselorAuthViewSet

router = DefaultRouter()
router.register(r'counselors', CounselorViewSet, basename='counselor')

auth_router = DefaultRouter()
auth_router.register(r'auth', CounselorAuthViewSet, basename='counselor-auth')

urlpatterns = [
    path('', include(router.urls)),
    path('', include(auth_router.urls)),
] 