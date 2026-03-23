import logging
import threading
import uuid

_local = threading.local()


def get_request_id() -> str:
    return getattr(_local, "request_id", "-")


class RequestIDMiddleware:
    """Attaches a short UUID to every request for structured log correlation."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        _local.request_id = request.headers.get(
            "X-Request-ID", str(uuid.uuid4())[:8]
        )
        response = self.get_response(request)
        response["X-Request-ID"] = _local.request_id
        return response


class RequestIDFilter(logging.Filter):
    """Injects request_id into every log record so the JSON formatter can use it."""

    def filter(self, record: logging.LogRecord) -> bool:
        record.request_id = get_request_id()
        return True
