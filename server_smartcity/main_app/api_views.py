from rest_framework import viewsets, permissions
from rest_framework.pagination import PageNumberPagination
from .models import Report
from .serializers import ReportSerializer
from .permissions import IsOwnerAndDraftOrReadOnly
from drf_spectacular.utils import extend_schema

class ReportPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 1000

class ReportViewSet(viewsets.ModelViewSet):
    serializer_class = ReportSerializer
    pagination_class = ReportPagination

    def get_queryset(self):
        from django.db.models import Q
        user = self.request.user

        queryset = Report.objects.filter(
            reporter__isnull=False
        ).order_by('-updated_at')

        tab = self.request.query_params.get('tab', None)
        if tab == 'my_reports':
            # Hanya laporan milik user sendiri
            queryset = queryset.filter(reporter=user)
        elif tab == 'feed':
            # Feed publik: laporan non-DRAFT, bukan milik user sendiri
            queryset = queryset.filter(~Q(reporter=user) & ~Q(status='DRAFT'))
        else:
            # Default: laporan non-DRAFT + DRAFT milik sendiri
            # DRAFT milik orang lain DISEMBUNYIKAN TOTAL (404 bukan 403)
            queryset = queryset.filter(
                Q(status='DRAFT', reporter=user) |
                ~Q(status='DRAFT')
            )

        return queryset

    def get_permissions(self):
        if self.action in ['update', 'partial_update', 'destroy']:
            return [IsOwnerAndDraftOrReadOnly()]
        return [permissions.IsAuthenticated()]

    def perform_create(self, serializer):
        serializer.save(reporter=self.request.user)

    def perform_update(self, serializer):
        serializer.save()

    @extend_schema(exclude=True)
    def destroy(self, request, *args, **kwargs):
        return super().destroy(request, *args, **kwargs)