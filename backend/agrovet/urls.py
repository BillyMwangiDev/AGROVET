from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.views.generic import RedirectView

urlpatterns = [
    path("", RedirectView.as_view(url="/admin/", permanent=False)),
    path("admin/", admin.site.urls),
    path("api/auth/", include("users.urls")),
    path("api/", include("inventory.urls")),
    path("api/", include("pos.urls")),
    path("api/", include("content.urls")),
    path("api/", include("documents.urls")),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
