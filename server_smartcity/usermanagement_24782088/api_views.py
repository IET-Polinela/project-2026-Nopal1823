from rest_framework import generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.contrib.auth import get_user_model
from .serializers import RegisterSerializer

User = get_user_model()

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        return Response({
            'id': user.pk,
            'username': user.username,
            'email': user.email,
            'is_staff': user.is_staff,
            'is_member': getattr(user, 'is_member', False),
        })
