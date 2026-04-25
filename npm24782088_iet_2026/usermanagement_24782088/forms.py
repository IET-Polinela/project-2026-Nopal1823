from django.contrib.auth.forms import UserCreationForm
from .models import CustomUser


class CustomUserCreationForm(UserCreationForm):
    class Meta:
        model = CustomUser
        fields = ('username', 'email')

    def save(self, commit=True):
        user = super().save(commit=False)
        user.is_admin = False
        user.is_member = True
        if commit:
            user.save()
        return user
