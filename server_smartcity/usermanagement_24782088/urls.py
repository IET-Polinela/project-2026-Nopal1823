from django.urls import path
from .api_views import RegisterView

urlpatterns = [
    path('register/', RegisterView.as_view(), name='api_register'),
]
