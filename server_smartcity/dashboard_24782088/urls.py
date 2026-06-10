from django.urls import path
from .views import DashboardView, DashboardStatsView, DashboardSearchView, ReportDetailJsonView

urlpatterns = [
    path('', DashboardView.as_view(), name='dashboard'),
    path('api/stats/', DashboardStatsView.as_view(), name='dashboard_stats'),
    path('api/search/', DashboardSearchView.as_view(), name='dashboard_search'),
    path('api/report/<int:pk>/', ReportDetailJsonView.as_view(), name='report_detail_json'),
]
