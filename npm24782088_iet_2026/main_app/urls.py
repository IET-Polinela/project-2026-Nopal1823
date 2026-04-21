from django.urls import path
from . import views

urlpatterns = [
    path('', views.home, name='home'),
    path('add/', views.ReportCreateView.as_view(), name='add_report'),
    path('reports/', views.ReportListView.as_view(), name='report_list'),
    path('report/<int:pk>/', views.ReportDetailView.as_view(), name='report_detail'),
    path('edit/<int:pk>/', views.ReportUpdateView.as_view(), name='edit_report'),
    path('delete/<int:pk>/', views.ReportDeleteView.as_view(), name='delete_report'),
    path('update_status/<int:pk>/', views.ReportUpdateStatusView.as_view(), name='update_status'),
]