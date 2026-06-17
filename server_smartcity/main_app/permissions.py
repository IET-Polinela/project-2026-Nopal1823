from rest_framework import permissions

class IsOwnerAndDraftOrReadOnly(permissions.BasePermission):

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True

        if not request.user or not request.user.is_authenticated:
            return False

        if obj.reporter is None:
            return False

        # Admin/staff bisa update status laporan apapun
        if request.user.is_staff:
            return True

        # Citizen hanya bisa edit laporan miliknya sendiri yang masih DRAFT
        return obj.reporter.pk == request.user.pk and obj.status == 'DRAFT'
