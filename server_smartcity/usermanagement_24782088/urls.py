from django.urls import path
from .views import CustomLoginView, CustomLogoutView, register
from usermanagement_24782088.api_views import RegisterView

urlpatterns = [
    path('login/', CustomLoginView.as_view(), name='login'),
    path('logout/', CustomLogoutView.as_view(), name='logout'),
    path('register/', register, name='register'),
    path('api/register/', RegisterView.as_view(), name='api_register'),
]
