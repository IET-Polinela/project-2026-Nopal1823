from django.contrib import admin
from django.urls import path, include
from django.http import HttpResponse
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

def welcome(request):
    return HttpResponse("Selamat Datang")

urlpatterns = [
    path('', include('main_app.urls')),
    path('admin/', admin.site.urls),
    path('welcome/', welcome),
    path('about/', include('about.urls')),
    path('contacts/', include('contacts.urls')),
    path('auth/', include('usermanagement_24782088.urls')),
    path('dashboard/', include('dashboard_24782088.urls')),
    path('api/', include('main_app.api_urls')),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]
