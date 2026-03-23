from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .models import StoreConfig, StoreSettings, User
from .permissions import IsAdmin, IsManagerOrAbove
from .serializers import (
    CustomerSignupSerializer,
    PinVerifySerializer,
    StoreConfigSerializer,
    StoreSettingsSerializer,
    UserCreateSerializer,
    UserSerializer,
    UserUpdateSerializer,
)
from .throttles import PinVerifyThrottle
from .token import CustomTokenObtainPairSerializer


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)


class UserListCreateView(APIView):
    permission_classes = [IsManagerOrAbove]

    def get(self, request):
        queryset = User.objects.all()
        role = request.query_params.get("role")
        if role:
            queryset = queryset.filter(role=role)
        search = request.query_params.get("search")
        if search:
            queryset = (
                queryset.filter(first_name__icontains=search)
                | queryset.filter(last_name__icontains=search)
                | queryset.filter(username__icontains=search)
                | queryset.filter(email__icontains=search)
            )
        serializer = UserSerializer(queryset, many=True)
        return Response(serializer.data)

    def post(self, request):
        # Enforce staff limit for non-customer roles
        role = request.data.get("role", "cashier")
        if role != User.ROLE_CUSTOMER:
            config = StoreConfig.get()
            staff_count = User.objects.exclude(role=User.ROLE_CUSTOMER).count()
            if staff_count >= config.staff_limit:
                return Response(
                    {"detail": f"Staff limit of {config.staff_limit} reached."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        serializer = UserCreateSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserDetailView(APIView):
    permission_classes = [IsManagerOrAbove]

    def _get_user(self, pk):
        try:
            return User.objects.get(pk=pk)
        except User.DoesNotExist:
            return None

    def get(self, request, pk):
        user = self._get_user(pk)
        if not user:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(UserSerializer(user).data)

    def patch(self, request, pk):
        user = self._get_user(pk)
        if not user:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        # Prevent non-admin from editing admins
        if user.role == User.ROLE_ADMIN and request.user.role != User.ROLE_ADMIN:
            return Response(
                {"detail": "Cannot edit admin users."},
                status=status.HTTP_403_FORBIDDEN,
            )
        serializer = UserUpdateSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(UserSerializer(user).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        user = self._get_user(pk)
        if not user:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        if str(user.pk) == str(request.user.pk):
            return Response(
                {"detail": "Cannot deactivate yourself."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        user.is_active = False
        user.save(update_fields=["is_active"])
        return Response(status=status.HTTP_204_NO_CONTENT)


class PinVerifyView(APIView):
    """Fast cashier switch: verify PIN and return new JWT tokens."""
    permission_classes = [AllowAny]
    throttle_classes = [PinVerifyThrottle]

    def post(self, request):
        serializer = PinVerifySerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(
                pk=serializer.validated_data["user_id"], is_active=True
            )
        except User.DoesNotExist:
            return Response({"detail": "User not found."}, status=status.HTTP_404_NOT_FOUND)

        if not user.pin:
            return Response(
                {"detail": "This user has no PIN set."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not user.check_pin(serializer.validated_data["pin"]):
            return Response({"detail": "Incorrect PIN."}, status=status.HTTP_401_UNAUTHORIZED)

        refresh = RefreshToken.for_user(user)
        refresh["role"] = user.role
        refresh["full_name"] = user.get_full_name() or user.username

        return Response({
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "role": user.role,
            "full_name": user.get_full_name() or user.username,
        })


class CustomerSignupView(APIView):
    """Public endpoint for customer self-registration."""
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = CustomerSignupSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(
                {"detail": "Account created. You can now log in."},
                status=status.HTTP_201_CREATED,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ActiveCashiersView(APIView):
    """List all active staff available for PIN switch (public — needed at login screen)."""
    permission_classes = [AllowAny]

    def get(self, request):
        cashiers = User.objects.filter(
            role__in=[User.ROLE_CASHIER, User.ROLE_MANAGER, User.ROLE_ADMIN],
            is_active=True,
        ).values("id", "first_name", "last_name", "username", "role", "avatar")
        return Response(list(cashiers))


class StoreConfigView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        config = StoreConfig.get()
        return Response(StoreConfigSerializer(config).data)

    def patch(self, request):
        if request.user.role != User.ROLE_ADMIN:
            return Response(
                {"detail": "Admin access required."},
                status=status.HTTP_403_FORBIDDEN,
            )
        config = StoreConfig.get()
        serializer = StoreConfigSerializer(config, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class StoreSettingsView(APIView):
    """GET/PATCH /api/auth/store-settings/ — extended store settings (admin only)."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        settings_obj = StoreSettings.get()
        return Response(StoreSettingsSerializer(settings_obj).data)

    def patch(self, request):
        if request.user.role != User.ROLE_ADMIN:
            return Response(
                {"detail": "Admin access required."},
                status=status.HTTP_403_FORBIDDEN,
            )
        settings_obj = StoreSettings.get()
        serializer = StoreSettingsSerializer(settings_obj, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
