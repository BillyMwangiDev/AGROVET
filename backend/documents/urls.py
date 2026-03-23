from django.urls import path
from .views import DocumentListCreateView, DocumentDetailView, DocumentPDFView, DocumentEmailView

urlpatterns = [
    path("documents/", DocumentListCreateView.as_view(), name="document_list_create"),
    path("documents/<uuid:pk>/", DocumentDetailView.as_view(), name="document_detail"),
    path("documents/<uuid:pk>/pdf/", DocumentPDFView.as_view(), name="document_pdf"),
    path("documents/<uuid:pk>/email/", DocumentEmailView.as_view(), name="document_email"),
]
