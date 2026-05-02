from django.contrib import admin
from django.urls import path, include
from django.http import HttpResponse

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
]
