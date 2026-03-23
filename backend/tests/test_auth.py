"""
Tests for the users app — authentication, user CRUD, store config.
"""
import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

User = get_user_model()


# ── User Model ────────────────────────────────────────────────────────────────

class TestUserModel:
    def test_create_user_with_role(self, db):
        user = User.objects.create_user(
            username="roletest", password="pass", role="manager"
        )
        assert user.role == "manager"
        assert str(user.pk)  # UUID

    def test_set_and_check_pin(self, db):
        user = User.objects.create_user(username="pintest", password="pass")
        user.set_pin("5678")
        user.save()
        assert user.check_pin("5678") is True
        assert user.check_pin("0000") is False

    def test_is_admin_property(self, admin_user):
        assert admin_user.is_admin is True

    def test_is_manager_or_above_for_admin(self, admin_user):
        assert admin_user.is_manager_or_above is True

    def test_is_manager_or_above_for_manager(self, manager_user):
        assert manager_user.is_manager_or_above is True

    def test_is_manager_or_above_false_for_cashier(self, cashier_user):
        assert cashier_user.is_manager_or_above is False

    def test_is_staff_member_excludes_customer(self, customer_user):
        assert customer_user.is_staff_member is False

    def test_is_staff_member_includes_cashier(self, cashier_user):
        assert cashier_user.is_staff_member is True


# ── JWT Login ─────────────────────────────────────────────────────────────────

class TestJWTLogin:
    URL = "/api/auth/token/"

    def test_login_returns_access_and_refresh(self, api_client, admin_user):
        resp = api_client.post(self.URL, {"username": "admin_test", "password": "testpass123"})
        assert resp.status_code == 200
        assert "access" in resp.data
        assert "refresh" in resp.data

    def test_login_response_contains_role_and_full_name(self, api_client, admin_user):
        resp = api_client.post(self.URL, {"username": "admin_test", "password": "testpass123"})
        assert resp.status_code == 200
        assert resp.data.get("role") == "admin"
        assert "full_name" in resp.data

    def test_login_with_wrong_password_returns_401(self, api_client, admin_user):
        resp = api_client.post(self.URL, {"username": "admin_test", "password": "wrongpass"})
        assert resp.status_code == 401

    def test_login_inactive_user_returns_401(self, db, api_client):
        user = User.objects.create_user(
            username="inactive_user", password="testpass123", is_active=False
        )
        resp = api_client.post(self.URL, {"username": "inactive_user", "password": "testpass123"})
        assert resp.status_code == 401


# ── Me Endpoint ───────────────────────────────────────────────────────────────

class TestMeEndpoint:
    URL = "/api/auth/me/"

    def test_authenticated_user_gets_own_data(self, admin_client, admin_user):
        resp = admin_client.get(self.URL)
        assert resp.status_code == 200
        assert resp.data["username"] == "admin_test"

    def test_unauthenticated_returns_401(self, api_client):
        resp = api_client.get(self.URL)
        assert resp.status_code == 401


# ── PIN Verify ────────────────────────────────────────────────────────────────

class TestPinVerify:
    URL = "/api/auth/pin-verify/"

    def test_correct_pin_returns_new_jwt_with_role(self, api_client, cashier_user):
        resp = api_client.post(self.URL, {
            "user_id": str(cashier_user.pk),
            "pin": "1234",
        })
        assert resp.status_code == 200
        assert "access" in resp.data
        assert resp.data["role"] == "cashier"

    def test_wrong_pin_returns_401(self, api_client, cashier_user):
        resp = api_client.post(self.URL, {
            "user_id": str(cashier_user.pk),
            "pin": "9999",
        })
        assert resp.status_code == 401

    def test_user_with_no_pin_returns_400(self, api_client, admin_user):
        # admin_user has no PIN set
        resp = api_client.post(self.URL, {
            "user_id": str(admin_user.pk),
            "pin": "0000",
        })
        assert resp.status_code == 400


# ── Active Cashiers ───────────────────────────────────────────────────────────

class TestActiveCashiers:
    URL = "/api/auth/cashiers/"

    def test_returns_active_staff_list_without_auth(self, api_client, cashier_user):
        resp = api_client.get(self.URL)
        assert resp.status_code == 200
        assert isinstance(resp.data, list)

    def test_returns_cashier_in_list(self, api_client, cashier_user):
        resp = api_client.get(self.URL)
        usernames = [u["username"] for u in resp.data]
        assert "cashier_test" in usernames

    def test_does_not_return_customers(self, api_client, customer_user):
        resp = api_client.get(self.URL)
        usernames = [u["username"] for u in resp.data]
        assert "customer_test" not in usernames


# ── Customer Signup ───────────────────────────────────────────────────────────

class TestCustomerSignup:
    URL = "/api/auth/signup/"

    def test_creates_customer_with_role_customer(self, api_client, db):
        resp = api_client.post(self.URL, {
            "username": "newcustomer",
            "password": "Str0ngPass!23",
            "first_name": "New",
            "last_name": "Customer",
        })
        assert resp.status_code == 201
        user = User.objects.get(username="newcustomer")
        assert user.role == "customer"

    def test_duplicate_username_returns_400(self, api_client, admin_user):
        resp = api_client.post(self.URL, {
            "username": "admin_test",
            "password": "Str0ngPass!23",
        })
        assert resp.status_code == 400


# ── User CRUD ─────────────────────────────────────────────────────────────────

class TestUserCRUD:
    LIST_URL = "/api/auth/users/"

    def test_admin_can_list_users(self, admin_client, admin_user, cashier_user):
        resp = admin_client.get(self.LIST_URL)
        assert resp.status_code == 200
        usernames = [u["username"] for u in resp.data]
        assert "cashier_test" in usernames

    def test_manager_can_list_users(self, manager_client):
        resp = manager_client.get(self.LIST_URL)
        assert resp.status_code == 200

    def test_cashier_cannot_list_users(self, cashier_client):
        resp = cashier_client.get(self.LIST_URL)
        assert resp.status_code == 403

    def test_admin_can_create_staff(self, admin_client, db):
        resp = admin_client.post(self.LIST_URL, {
            "username": "new_cashier",
            "password": "Str0ngPass!23",
            "first_name": "New",
            "last_name": "Staff",
            "role": "cashier",
        })
        assert resp.status_code == 201
        assert User.objects.filter(username="new_cashier").exists()

    def test_admin_can_delete_user(self, admin_client, cashier_user):
        url = f"/api/auth/users/{cashier_user.pk}/"
        resp = admin_client.delete(url)
        assert resp.status_code == 204
        cashier_user.refresh_from_db()
        assert cashier_user.is_active is False

    def test_cannot_delete_own_account(self, admin_client, admin_user):
        url = f"/api/auth/users/{admin_user.pk}/"
        resp = admin_client.delete(url)
        assert resp.status_code == 400


# ── Store Config ──────────────────────────────────────────────────────────────

class TestStoreConfig:
    URL = "/api/auth/store-config/"

    def test_authenticated_user_can_get_store_config(self, admin_client):
        resp = admin_client.get(self.URL)
        assert resp.status_code == 200
        assert "staff_limit" in resp.data
        assert "idle_timeout_minutes" in resp.data

    def test_admin_can_update_staff_limit(self, admin_client):
        resp = admin_client.patch(self.URL, {"staff_limit": 15})
        assert resp.status_code == 200
        assert resp.data["staff_limit"] == 15

    def test_non_admin_cannot_update_config(self, cashier_client):
        resp = cashier_client.patch(self.URL, {"staff_limit": 20})
        assert resp.status_code == 403

    def test_unauthenticated_returns_401(self, api_client):
        resp = api_client.get(self.URL)
        assert resp.status_code == 401
