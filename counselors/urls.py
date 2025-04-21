from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CounselorViewSet

router = DefaultRouter()
router.register(r'counselors', CounselorViewSet, basename='counselor')

urlpatterns = [
    path('', include(router.urls)),
] 