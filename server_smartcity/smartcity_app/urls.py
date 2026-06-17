from django.contrib import admin
from django.urls import path, include
from django.http import HttpResponse
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from usermanagement_24782088.api_views import RegisterView, MeView

def home_view(request):
    html = """
    <!DOCTYPE html>
    <html lang="id">
    <head>
        <meta charset="UTF-8">
        <title>Smart City API — Backend Server</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
                font-family: -apple-system, 'Segoe UI', Roboto, sans-serif;
                background: linear-gradient(135deg, #5e72e4 0%, #11cdef 100%);
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 20px;
            }
            .card {
                background: #fff;
                border-radius: 16px;
                padding: 48px 40px;
                max-width: 480px;
                width: 100%;
                box-shadow: 0 20px 60px rgba(0,0,0,0.25);
                text-align: center;
            }
            .icon { font-size: 56px; margin-bottom: 16px; }
            h1 {
                font-size: 22px;
                color: #1a1a2e;
                margin-bottom: 8px;
            }
            p {
                color: #6c757d;
                font-size: 14px;
                margin-bottom: 28px;
                line-height: 1.5;
            }
            .status {
                display: inline-flex;
                align-items: center;
                gap: 6px;
                background: rgba(45,206,137,0.12);
                color: #2dce89;
                font-size: 12px;
                font-weight: 700;
                padding: 6px 14px;
                border-radius: 30px;
                margin-bottom: 28px;
            }
            .dot {
                width: 8px; height: 8px;
                background: #2dce89;
                border-radius: 50%;
                animation: pulse 1.5s infinite;
            }
            @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.4; }
            }
            .btn {
                display: inline-block;
                background: linear-gradient(135deg, #5e72e4, #11cdef);
                color: #fff;
                text-decoration: none;
                font-weight: 700;
                font-size: 15px;
                padding: 14px 32px;
                border-radius: 10px;
                transition: transform 0.2s, box-shadow 0.2s;
                box-shadow: 0 8px 20px rgba(94,114,228,0.35);
            }
            .btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 12px 28px rgba(94,114,228,0.45);
            }
            .links {
                margin-top: 24px;
                display: flex;
                justify-content: center;
                gap: 20px;
                font-size: 12px;
            }
            .links a {
                color: #8898aa;
                text-decoration: none;
                font-weight: 600;
            }
            .links a:hover { color: #5e72e4; }
        </style>
    </head>
    <body>
        <div class="card">
            <div class="icon">🏙️</div>
            <h1>Smart City — Backend API</h1>
            <p>Server backend Django REST Framework sedang berjalan.<br>Untuk mengakses aplikasi, silakan buka portal warga di tautan berikut.</p>

            <div class="status">
                <span class="dot"></span> Server Aktif
            </div>

            <br>

            <a class="btn" href="https://iet-polinela.github.io/project-2026-Nopal1823/" target="_blank">
                Buka Portal Warga &rarr;
            </a>

            <div class="links">
                <a href="/admin/">Admin Panel</a>
                <a href="/api/report/">API Endpoint</a>
            </div>
        </div>
    </body>
    </html>
    """
    return HttpResponse(html)

urlpatterns = [
    path('', home_view),
    path('admin/', admin.site.urls),
    path('api/', include('main_app.api_urls')),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/auth/register/', RegisterView.as_view(), name='api_register'),
    path('api/auth/me/', MeView.as_view(), name='api_me'),
]
