from django.urls import path
from .views import (
    ArticleCategoryListCreateView,
    ArticleListCreateView,
    ArticleDetailView,
    ArticlePublishView,
    AdminArticleListView,
)

urlpatterns = [
    path("content/categories/", ArticleCategoryListCreateView.as_view(), name="article_category_list"),
    path("content/articles/", ArticleListCreateView.as_view(), name="article_list_create"),
    path("content/articles/<slug:slug>/", ArticleDetailView.as_view(), name="article_detail"),
    path("content/articles/<slug:slug>/publish/", ArticlePublishView.as_view(), name="article_publish"),
    path("content/admin/articles/", AdminArticleListView.as_view(), name="admin_article_list"),
]
