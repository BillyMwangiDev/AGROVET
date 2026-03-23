from rest_framework.permissions import BasePermission


class IsAdmin(BasePermission):
    """Only Admin-role users."""
    message = "Admin access required."

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role == "admin"
        )


class IsManagerOrAbove(BasePermission):
    """Admin or Manager role."""
    message = "Manager or Admin access required."

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role in ("admin", "manager")
        )


class IsCashierOrAbove(BasePermission):
    """Admin, Manager, or Cashier role."""
    message = "Staff access required."

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role in ("admin", "manager", "cashier")
        )
