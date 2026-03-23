from django.utils import timezone
from rest_framework import generics, serializers, status
from rest_framework.permissions import IsAdminUser, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Article, ArticleCategory


# ── Serializers ───────────────────────────────────────────────────────────────

class ArticleCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ArticleCategory
        fields = ["id", "name", "slug"]


class ArticleSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name", read_only=True)
    author_name = serializers.SerializerMethodField()
    tag_list = serializers.ListField(read_only=True)

    class Meta:
        model = Article
        fields = [
            "id", "title", "slug", "category", "category_name",
            "tags", "tag_list", "body", "author", "author_name",
            "is_published", "published_at", "image",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "slug", "created_at", "updated_at"]

    def get_author_name(self, obj):
        if obj.author:
            return obj.author.get_full_name() or obj.author.username
        return None


class ArticleListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list view (no body)."""
    category_name = serializers.CharField(source="category.name", read_only=True)
    author_name = serializers.SerializerMethodField()

    class Meta:
        model = Article
        fields = [
            "id", "title", "slug", "category", "category_name",
            "tags", "author_name", "is_published", "published_at",
            "image", "created_at",
        ]

    def get_author_name(self, obj):
        if obj.author:
            return obj.author.get_full_name() or obj.author.username
        return None


# ── Article Category Views ────────────────────────────────────────────────────

class ArticleCategoryListCreateView(generics.ListCreateAPIView):
    serializer_class = ArticleCategorySerializer
    queryset = ArticleCategory.objects.all()

    def get_permissions(self):
        if self.request.method == "GET":
            return [AllowAny()]
        return [IsAdminUser()]


# ── Article Views ─────────────────────────────────────────────────────────────

class ArticleListCreateView(generics.ListCreateAPIView):
    """
    GET (public): returns only published articles.
    POST (admin): create article.
    """

    def get_serializer_class(self):
        if self.request.method == "POST":
            return ArticleSerializer
        return ArticleListSerializer

    def get_permissions(self):
        if self.request.method == "GET":
            return [AllowAny()]
        return [IsAdminUser()]

    def get_queryset(self):
        qs = Article.objects.select_related("category", "author")
        if not (self.request.user and self.request.user.is_authenticated and self.request.user.is_staff):
            qs = qs.filter(is_published=True)
        category = self.request.query_params.get("category")
        if category:
            qs = qs.filter(category__slug=category)
        return qs

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)


class ArticleDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET by slug (public, published only).
    PATCH/DELETE (admin only).
    """
    serializer_class = ArticleSerializer
    lookup_field = "slug"

    def get_permissions(self):
        if self.request.method == "GET":
            return [AllowAny()]
        return [IsAdminUser()]

    def get_queryset(self):
        qs = Article.objects.select_related("category", "author")
        if not (self.request.user and self.request.user.is_authenticated and self.request.user.is_staff):
            qs = qs.filter(is_published=True)
        return qs

    def update(self, request, *args, **kwargs):
        kwargs["partial"] = True
        return super().update(request, *args, **kwargs)


class ArticlePublishView(APIView):
    """POST /api/content/articles/<slug>/publish/ — toggle publish status."""
    permission_classes = [IsAdminUser]

    def post(self, request, slug):
        try:
            article = Article.objects.get(slug=slug)
        except Article.DoesNotExist:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        article.is_published = not article.is_published
        if article.is_published and not article.published_at:
            article.published_at = timezone.now()
        article.save(update_fields=["is_published", "published_at"])
        return Response({"is_published": article.is_published})


# ── Admin Article List (includes drafts) ─────────────────────────────────────

class AdminArticleListView(generics.ListAPIView):
    """GET /api/content/admin/articles/ — all articles including drafts."""
    serializer_class = ArticleListSerializer
    permission_classes = [IsAdminUser]
    queryset = Article.objects.select_related("category", "author").all()
