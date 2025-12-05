from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny
from rest_framework.exceptions import PermissionDenied
from .models import ContentManagement
from .serializers import ContentManagementSerializer


class ContentManagementViewSet(viewsets.ModelViewSet):
    """ViewSet for managing website content (hero, services, announcements, etc.)"""
    serializer_class = ContentManagementSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        # Return singleton instance
        return ContentManagement.objects.all()
    
    def get_permissions(self):
        """Allow read access to anyone, write access to staff only"""
        if self.action in ['retrieve', 'list', 'get_content', 'post_login_options']:
            return [AllowAny()]
        return [permissions.IsAuthenticated(), permissions.IsAdminUser()]
    
    @action(detail=False, methods=['get'], permission_classes=[AllowAny])
    def get_content(self, request):
        """Get the current website content (public endpoint)"""
        content = ContentManagement.get_content()
        serializer = self.get_serializer(content)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAuthenticated, permissions.IsAdminUser])
    def update_content(self, request):
        """Update website content (admin only)"""
        user = request.user
        
        # Check if user is staff
        if not (user.is_staff or user.user_type in ['staff', 'admin']):
            raise PermissionDenied("Only staff members can update content.")
        
        # Get or create content instance
        content = ContentManagement.get_content()
        
        # Update with new data
        serializer = self.get_serializer(content, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'], permission_classes=[AllowAny])
    def post_login_options(self, request):
        """Get post-login modal options filtered by user's grade level"""
        content = ContentManagement.get_content()
        
        # Get user's grade level if user is authenticated
        grade_level = ''
        if request.user.is_authenticated and hasattr(request.user, 'grade_level') and request.user.grade_level:
            grade_level = request.user.grade_level.lower()
        
        # Filter options based on user
        all_options = content.post_login_options
        filtered_options = []
        
        for option in all_options:
            # Skip disabled options
            if not option.get('enabled', True):
                continue
            
            # Check if option should be shown for all users
            if option.get('show_for_all', False):
                filtered_options.append(option)
            # Check grade level restrictions
            elif 'show_for_grade_levels' in option and grade_level:
                allowed_levels = [level.lower() for level in option['show_for_grade_levels']]
                if any(level in grade_level for level in allowed_levels):
                    filtered_options.append(option)
        
        return Response({
            'options': filtered_options,
            'user_grade_level': request.user.grade_level if request.user.is_authenticated and hasattr(request.user, 'grade_level') else None
        })
