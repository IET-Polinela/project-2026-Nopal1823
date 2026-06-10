from rest_framework import permissions

class IsOwnerAndDraftOrReadOnly(permissions.BasePermission):

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True

        if not request.user or not request.user.is_authenticated:
            return False

        # Guard: reporter bisa None untuk laporan lama
        if obj.reporter is None:
            return False

        # Izinkan jika pemilik laporan DAN status masih DRAFT
        return obj.reporter.pk == request.user.pk and obj.status == 'DRAFT'