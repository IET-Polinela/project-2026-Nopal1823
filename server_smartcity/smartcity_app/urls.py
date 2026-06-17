from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from usermanagement_24782088.api_views import RegisterView, MeView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('main_app.api_urls')),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/auth/register/', RegisterView.as_view(), name='api_register'),
    path('api/auth/me/', MeView.as_view(), name='api_me'),
]
