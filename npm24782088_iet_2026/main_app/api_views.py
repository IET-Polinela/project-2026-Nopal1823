from rest_framework import viewsets, permissions
from .models import Report
from .serializers import ReportSerializer
from .permissions import IsOwnerAndDraftOrReadOnly

class ReportViewSet(viewsets.ModelViewSet):
    serializer_class = ReportSerializer

    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return Report.objects.exclude(status='DRAFT')
        else:
            return Report.objects.exclude(status='DRAFT') | Report.objects.filter(status='DRAFT', reporter=user)
        
    def get_permissions(self):
        if self.action in ['update', 'partial_update', 'destroy']:
            return [permissions.IsAuthenticated(), IsOwnerAndDraftOrReadOnly()]
        return [permissions.IsAuthenticated()]

    def perform_create(self, serializer):
        serializer.save(reporter=self.request.user)