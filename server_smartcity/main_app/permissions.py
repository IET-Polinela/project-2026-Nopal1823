from rest_framework import permissions

class IsOwnerAndDraftOrReadOnly(permissions.BasePermission):

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj):
        # Read-only methods selalu diizinkan
        if request.method in permissions.SAFE_METHODS:
            return True

        if not request.user or not request.user.is_authenticated:
            return False

        if obj.reporter is None:
            return False

        # Laporan RESOLVED terkunci mutlak — tidak bisa diubah siapapun
        if obj.status == 'RESOLVED':
            return False

        # Admin/staff: bisa update status tapi hanya selama belum RESOLVED
        if request.user.is_staff:
            return True

        # Citizen: hanya bisa edit laporan DRAFT miliknya sendiri
        # Laporan REPORTED dan selain DRAFT tidak bisa diedit citizen
        return obj.reporter.pk == request.user.pk and obj.status == 'DRAFT'