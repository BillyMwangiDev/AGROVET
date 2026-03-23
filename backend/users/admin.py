from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from .models import StoreConfig, StoreSettings, User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ["username", "get_full_name", "email", "role", "phone", "is_active_cashier", "is_active"]
    list_filter = ["role", "is_active", "is_active_cashier"]
    search_fields = ["username", "first_name", "last_name", "email", "phone"]
    ordering = ["first_name", "last_name"]

    fieldsets = BaseUserAdmin.fieldsets + (
        ("Role & POS", {
            "fields": ("role", "phone", "pin", "avatar", "is_active_cashier"),
        }),
    )
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ("Role & POS", {
            "fields": ("role", "phone", "pin", "avatar", "is_active_cashier"),
        }),
    )


@admin.register(StoreConfig)
class StoreConfigAdmin(admin.ModelAdmin):
    list_display = ["staff_limit", "idle_timeout_minutes"]

    def has_add_permission(self, request):
        return not StoreConfig.objects.exists()

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(StoreSettings)
class StoreSettingsAdmin(admin.ModelAdmin):
    list_display = ["business_name", "currency", "tax_rate", "enable_etims"]

    def has_add_permission(self, request):
        return not StoreSettings.objects.exists()

    def has_delete_permission(self, request, obj=None):
        return False
