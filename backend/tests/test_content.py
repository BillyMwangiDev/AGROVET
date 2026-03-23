"""
Tests for the content app — article CRUD, publish/unpublish, categories.
"""
import pytest
from content.models import Article, ArticleCategory


# ── Article Categories ────────────────────────────────────────────────────────

class TestArticleCategories:
    LIST_URL = "/api/content/categories/"

    def test_list_categories_public(self, api_client, article_category):
        resp = api_client.get(self.LIST_URL)
        assert resp.status_code == 200
        results = resp.data.get("results", resp.data)
        names = [c["name"] for c in results]
        assert "Farming Tips" in names

    def test_admin_can_create_category(self, admin_client, db):
        resp = admin_client.post(self.LIST_URL, {"name": "Livestock Care"})
        assert resp.status_code == 201
        assert ArticleCategory.objects.filter(name="Livestock Care").exists()

    def test_slug_auto_generated(self, admin_client, db):
        resp = admin_client.post(self.LIST_URL, {"name": "Crop Health"})
        assert resp.status_code == 201
        assert resp.data["slug"] == "crop-health"


# ── Article CRUD ──────────────────────────────────────────────────────────────

class TestArticleCRUD:
    LIST_URL = "/api/content/articles/"
    ADMIN_URL = "/api/content/admin/articles/"

    def test_admin_can_create_article(self, admin_client, article_category, admin_user):
        resp = admin_client.post(self.LIST_URL, {
            "title": "Top Dairy Tips",
            "body": "Always ensure clean water for your cows.",
            "category": str(article_category.pk),
            "tags": "dairy, cows, water",
        }, format="json")
        assert resp.status_code == 201
        assert Article.objects.filter(title="Top Dairy Tips").exists()

    def test_public_list_returns_only_published(self, api_client, published_article, draft_article):
        resp = api_client.get(self.LIST_URL)
        assert resp.status_code == 200
        results = resp.data.get("results", resp.data)
        titles = [a["title"] for a in results]
        assert "How to Feed Dairy Cows" in titles
        assert "Draft Article" not in titles

    def test_admin_list_returns_all_including_drafts(self, admin_client, published_article, draft_article):
        resp = admin_client.get(self.ADMIN_URL)
        assert resp.status_code == 200
        results = resp.data.get("results", resp.data)
        titles = [a["title"] for a in results]
        assert "How to Feed Dairy Cows" in titles
        assert "Draft Article" in titles

    def test_public_detail_by_slug_returns_published(self, api_client, published_article):
        resp = api_client.get(f"/api/content/articles/{published_article.slug}/")
        assert resp.status_code == 200
        assert resp.data["title"] == "How to Feed Dairy Cows"

    def test_public_detail_returns_404_for_draft(self, api_client, draft_article):
        resp = api_client.get(f"/api/content/articles/{draft_article.slug}/")
        assert resp.status_code == 404

    def test_toggle_publish_sets_is_published_true(self, admin_client, draft_article):
        url = f"/api/content/articles/{draft_article.slug}/publish/"
        resp = admin_client.post(url)
        assert resp.status_code == 200
        draft_article.refresh_from_db()
        assert draft_article.is_published is True

    def test_toggle_publish_unpublishes(self, admin_client, published_article):
        url = f"/api/content/articles/{published_article.slug}/publish/"
        resp = admin_client.post(url)
        assert resp.status_code == 200
        published_article.refresh_from_db()
        assert published_article.is_published is False

    def test_admin_can_update_article(self, admin_client, published_article):
        url = f"/api/content/articles/{published_article.slug}/"
        resp = admin_client.patch(url, {"title": "Updated Title"}, format="json")
        assert resp.status_code == 200
        published_article.refresh_from_db()
        assert published_article.title == "Updated Title"

    def test_admin_can_delete_article(self, admin_client, draft_article):
        url = f"/api/content/articles/{draft_article.slug}/"
        resp = admin_client.delete(url)
        assert resp.status_code == 204
        assert not Article.objects.filter(pk=draft_article.pk).exists()

    def test_unauthenticated_cannot_create_article(self, api_client, article_category):
        resp = api_client.post(self.LIST_URL, {
            "title": "Anon Article",
            "body": "Test body.",
            "category": str(article_category.pk),
        }, format="json")
        assert resp.status_code == 401

    def test_article_slug_auto_generated(self, admin_client, article_category):
        resp = admin_client.post(self.LIST_URL, {
            "title": "Slug Auto Test",
            "body": "Body text here.",
            "category": str(article_category.pk),
        }, format="json")
        assert resp.status_code == 201
        assert resp.data["slug"] == "slug-auto-test"
