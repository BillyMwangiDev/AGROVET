from django.contrib.auth.hashers import make_password
from rest_framework import serializers

from .models import StoreConfig, StoreSettings, User


class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "first_name",
            "last_name",
            "full_name",
            "email",
            "phone",
            "role",
            "avatar",
            "is_active_cashier",
            "is_active",
            "date_joined",
        ]
        read_only_fields = ["id", "date_joined", "full_name"]

    def get_full_name(self, obj):
        return obj.get_full_name() or obj.username


class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    pin = serializers.CharField(write_only=True, required=False, min_length=4, max_length=4)

    class Meta:
        model = User
        fields = [
            "username",
            "first_name",
            "last_name",
            "email",
            "phone",
            "role",
            "password",
            "pin",
            "is_active_cashier",
        ]

    def validate_pin(self, value):
        if value and not value.isdigit():
            raise serializers.ValidationError("PIN must be 4 digits.")
        return value

    def create(self, validated_data):
        raw_pin = validated_data.pop("pin", None)
        password = validated_data.pop("password")
        user = User(**validated_data)
        user.set_password(password)
        if raw_pin:
            user.set_pin(raw_pin)
        user.save()
        return user


class UserUpdateSerializer(serializers.ModelSerializer):
    pin = serializers.CharField(write_only=True, required=False, min_length=4, max_length=4)
    password = serializers.CharField(write_only=True, required=False, min_length=8)

    class Meta:
        model = User
        fields = [
            "first_name",
            "last_name",
            "email",
            "phone",
            "role",
            "avatar",
            "is_active_cashier",
            "is_active",
            "password",
            "pin",
        ]

    def validate_pin(self, value):
        if value and not value.isdigit():
            raise serializers.ValidationError("PIN must be 4 digits.")
        return value

    def update(self, instance, validated_data):
        raw_pin = validated_data.pop("pin", None)
        raw_password = validated_data.pop("password", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if raw_password:
            instance.set_password(raw_password)
        if raw_pin:
            instance.set_pin(raw_pin)
        instance.save()
        return instance


class PinVerifySerializer(serializers.Serializer):
    user_id = serializers.UUIDField()
    pin = serializers.CharField(min_length=4, max_length=4)

    def validate_pin(self, value):
        if not value.isdigit():
            raise serializers.ValidationError("PIN must be 4 digits.")
        return value


class CustomerSignupSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ["username", "first_name", "last_name", "email", "phone", "password"]

    def create(self, validated_data):
        password = validated_data.pop("password")
        user = User(**validated_data, role=User.ROLE_CUSTOMER)
        user.set_password(password)
        user.save()
        return user


class StoreConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = StoreConfig
        fields = ["staff_limit", "idle_timeout_minutes"]


class StoreSettingsSerializer(serializers.ModelSerializer):
    # Sensitive credentials are write-only: they can be set but never read back via API
    mpesa_consumer_secret = serializers.CharField(
        write_only=True, required=False, allow_blank=True
    )
    mpesa_passkey = serializers.CharField(
        write_only=True, required=False, allow_blank=True
    )

    class Meta:
        model = StoreSettings
        fields = [
            "business_name", "logo", "tax_rate", "currency",
            "mpesa_consumer_key", "mpesa_consumer_secret",
            "mpesa_shortcode", "mpesa_passkey", "mpesa_callback_url",
            "receipt_footer", "enable_etims",
        ]
