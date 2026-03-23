from rest_framework.throttling import AnonRateThrottle


class LoginRateThrottle(AnonRateThrottle):
    """3 login attempts per hour per username/email, fallback to IP."""

    scope = "login"

    def get_cache_key(self, request, view):
        # Use the submitted username (which is the email in this app) as the key
        # so rate-limiting is per-account, not per IP (avoids NAT bypass).
        ident = request.data.get("username") or request.data.get("email") or ""
        ident = ident.lower().strip()
        if not ident:
            ident = self.get_ident(request)
        return self.cache_format % {"scope": self.scope, "ident": ident}


class PinVerifyThrottle(AnonRateThrottle):
    """3 PIN verify attempts per hour per user_id, fallback to IP."""

    scope = "pin_verify"

    def get_cache_key(self, request, view):
        user_id = str(request.data.get("user_id", "")).strip()
        ident = user_id if user_id else self.get_ident(request)
        return self.cache_format % {"scope": self.scope, "ident": ident}
