from rest_framework.routers import DefaultRouter
from .views import AssessmentViewSet

router = DefaultRouter()
router.register(r'counselor-assessments', AssessmentViewSet, basename='counselor-assessment')

urlpatterns = router.urls 