from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .token import CustomTokenObtainPairView
from .views import (
    ActiveCashiersView,
    CustomerSignupView,
    MeView,
    PinVerifyView,
    StoreConfigView,
    StoreSettingsView,
    UserDetailView,
    UserListCreateView,
)

urlpatterns = [
    # JWT auth
    path("token/", CustomTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    # Current user
    path("me/", MeView.as_view(), name="auth_me"),
    # PIN-based cashier switch
    path("pin-verify/", PinVerifyView.as_view(), name="pin_verify"),
    path("cashiers/", ActiveCashiersView.as_view(), name="active_cashiers"),
    # Customer self-registration
    path("signup/", CustomerSignupView.as_view(), name="customer_signup"),
    # Staff management (admin/manager only)
    path("users/", UserListCreateView.as_view(), name="user_list_create"),
    path("users/<uuid:pk>/", UserDetailView.as_view(), name="user_detail"),
    # Store config (admin only)
    path("store-config/", StoreConfigView.as_view(), name="store_config"),
    # Store settings - Phase 4 (admin only)
    path("store-settings/", StoreSettingsView.as_view(), name="store_settings"),
]
