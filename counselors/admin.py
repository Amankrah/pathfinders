from django.contrib import admin
from .models import Counselor, CounselorUserRelation

@admin.register(Counselor)
class CounselorAdmin(admin.ModelAdmin):
    list_display = ('user', 'professional_title', 'institution', 'is_active', 'created_at')
    list_filter = ('is_active', 'institution')
    search_fields = ('user__username', 'user__email', 'professional_title', 'institution')
    date_hierarchy = 'created_at'

@admin.register(CounselorUserRelation)
class CounselorUserRelationAdmin(admin.ModelAdmin):
    list_display = ('counselor', 'user', 'status', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('counselor__user__username', 'user__username')
    date_hierarchy = 'created_at' 