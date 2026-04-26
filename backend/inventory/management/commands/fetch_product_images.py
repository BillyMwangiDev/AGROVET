"""
Management command to fetch and assign images to products.

Sources used (in priority order):
  1. Wikipedia REST API  — free, no key, topic-accurate images
  2. Wikimedia Commons   — free, no key, keyword search
  3. Unsplash API        — optional, pass --unsplash-key
  4. Pexels API          — optional, pass --pexels-key
  5. SVG placeholder     — colour-coded fallback, always works offline

Usage:
    python manage.py fetch_product_images
    python manage.py fetch_product_images --overwrite
    python manage.py fetch_product_images --product "Dairy Meal"
    python manage.py fetch_product_images --unsplash-key YOUR_KEY --overwrite
    python manage.py fetch_product_images --pexels-key YOUR_KEY --overwrite
"""

import json
import os
import re
import ssl
import tempfile
import time
import urllib.error
import urllib.parse
import urllib.request

from django.core.files import File
from django.core.management.base import BaseCommand, CommandError

from inventory.models import Product


# ─── Wikipedia article titles ────────────────────────────────────────────────
# Maps lowercase product-name fragments → Wikipedia article title.
# Wikipedia's REST summary API returns the article's main image, which is
# always relevant and encyclopedia-quality.
WIKIPEDIA_TITLES = {
    # Feeds (show the target animal)
    "dairy meal":         "Holstein Friesian cattle",
    "chick mash":         "Broiler",
    "layer mash":         "Chicken",
    "pig grower":         "Domestic pig",
    "growers pellets":    "Broiler",
    "mineral supplement": "Salt lick",
    "mineral lick":       "Salt lick",
    # Seeds (show the crop)
    "maize":              "Maize",
    "bean seeds":         "Common bean",
    "rosecoco":           "Common bean",
    "vegetable seeds":    "Vegetable farming",
    # Chemicals
    "npk":                "Fertilizer",
    "fertilizer":         "Fertilizer",
    "herbicide":          "Herbicide",
    "round-up":           "Glyphosate",
    "pesticide":          "Pesticide",
    "pyrethroid":         "Pyrethroid",
    "duduthrin":          "Pesticide",
    # Veterinary (show animals, not chemical diagrams)
    "fmd vaccine":        "Foot-and-mouth disease",
    "vaccine":            "Cattle",
    "ivermectin":         "Cattle",
    "albendazole":        "Anthelmintic",
    "tetracycline":       "Livestock farming",
    "de-wormer":          "Anthelmintic",
    "dewormer":           "Anthelmintic",
    "injectable":         "Cattle",
    # Semen / AI breeds
    "friesian":           "Holstein Friesian cattle",
    "jersey":             "Jersey cattle",
    "ayrshire":           "Ayrshire cattle",
    "guernsey":           "Guernsey cattle",
    "boran":              "Boran cattle",
    "sahiwal":            "Sahiwal cattle",
    "viking red":         "Danish Red cattle",
    "semen straw":        "Artificial insemination",
    # Equipment
    "ear tag":            "Ear tag",
    "ai gun":             "Artificial insemination",
    "gun for cattle":     "Artificial insemination",
}

# ─── Wikimedia Commons keyword search queries ────────────────────────────────
# Used when no WIKIPEDIA_TITLES match exists.
COMMONS_QUERIES = {
    "feeds":          "dairy cattle feeding farm",
    "seeds":          "crop seeds agriculture",
    "chemicals":      "agriculture chemical spraying",
    "semen":          "dairy cow cattle farm",
    "equipment":      "livestock farm equipment",
    "veterinary":     "cattle veterinary treatment",
    "pharmaceuticals":"livestock animal health",
}


def _wikipedia_title_for(product: "Product") -> str | None:
    name_lower = product.name.lower()
    for fragment, title in WIKIPEDIA_TITLES.items():
        if fragment in name_lower:
            return title
    return None


def _commons_query_for(product: "Product") -> str:
    cat = product.category.slug.lower()
    return COMMONS_QUERIES.get(cat, f"{product.name} agriculture")


# ─── Fetch helpers ────────────────────────────────────────────────────────────

_UA = "AgrovetPOS/1.0 (https://nicmah.co.ke; info@nicmah.co.ke)"


def _ctx() -> ssl.SSLContext:
    return ssl.create_default_context()


def _get(url: str, headers: dict | None = None, timeout: int = 20,
         retries: int = 3) -> bytes | None:
    """GET with automatic retry on 429 rate-limit responses."""
    hdrs = {"User-Agent": _UA}
    if headers:
        hdrs.update(headers)
    req = urllib.request.Request(url, headers=hdrs)
    for attempt in range(retries):
        try:
            with urllib.request.urlopen(req, context=_ctx(), timeout=timeout) as r:
                if r.status == 200:
                    return r.read()
        except urllib.error.HTTPError as e:
            if e.code == 429:
                time.sleep(5 * (attempt + 1))   # 5 s, 10 s, 15 s
                continue
            break
        except Exception:
            break
    return None


def _is_image(data: bytes) -> bool:
    return data[:2] == b'\xff\xd8' or data[:4] == b'\x89PNG'


def _fetch_wikipedia(article_title: str) -> bytes | None:
    """
    Fetch the main illustration of a Wikipedia article via the REST summary API.
    Completely free, no API key. Returns JPEG/PNG bytes or None.
    Always uses the thumbnail CDN URL (Wikimedia rate-limits direct originals).
    """
    slug = urllib.parse.quote(article_title.replace(" ", "_"))
    raw = _get(
        f"https://en.wikipedia.org/api/rest_v1/page/summary/{slug}",
        headers={"Accept": "application/json"},
        timeout=15,
    )
    if not raw:
        return None
    try:
        data = json.loads(raw)
    except Exception:
        return None

    # Always use thumbnail URL — Wikimedia rate-limits original-image downloads.
    # We resize by replacing the width token in the CDN path (e.g. /320px- → /600px-).
    thumb = data.get("thumbnail")
    if not thumb:
        return None
    img_url = re.sub(r'/\d+px-', '/600px-', thumb["source"])

    img_bytes = _get(img_url, timeout=30)
    if img_bytes and _is_image(img_bytes):
        return img_bytes
    return None


def _fetch_wikimedia_commons(query: str) -> bytes | None:
    """
    Search Wikimedia Commons for an image by keyword. Free, no API key.
    Returns JPEG/PNG bytes or None.
    """
    search_url = "https://commons.wikimedia.org/w/api.php?" + urllib.parse.urlencode({
        "action": "query",
        "list": "search",
        "srsearch": query,
        "srnamespace": 6,
        "format": "json",
        "srlimit": 5,
    })
    raw = _get(search_url, timeout=15)
    if not raw:
        return None
    try:
        data = json.loads(raw)
    except Exception:
        return None

    results = data.get("query", {}).get("search", [])
    for result in results[:3]:
        title = result["title"]
        info_url = "https://commons.wikimedia.org/w/api.php?" + urllib.parse.urlencode({
            "action": "query",
            "titles": title,
            "prop": "imageinfo",
            "iiprop": "url|mime",
            "iiurlwidth": 600,
            "format": "json",
        })
        raw2 = _get(info_url, timeout=15)
        if not raw2:
            continue
        try:
            info = json.loads(raw2)
        except Exception:
            continue
        pages = info.get("query", {}).get("pages", {})
        for page in pages.values():
            for ii in page.get("imageinfo", []):
                mime = ii.get("mime", "")
                if not mime.startswith("image/") or mime == "image/gif":
                    continue
                img_url = ii.get("thumburl") or ii.get("url")
                if not img_url:
                    continue
                img_bytes = _get(img_url, timeout=30)
                if img_bytes and _is_image(img_bytes):
                    return img_bytes
    return None


def _fetch_unsplash_api(query: str, api_key: str) -> bytes | None:
    encoded = urllib.parse.quote_plus(query)
    raw = _get(
        f"https://api.unsplash.com/photos/random?query={encoded}&orientation=landscape",
        headers={"Authorization": f"Client-ID {api_key}"},
        timeout=20,
    )
    if not raw:
        return None
    try:
        url = json.loads(raw)["urls"]["regular"]
    except Exception:
        return None
    img = _get(url, timeout=30)
    return img if img and _is_image(img) else None


def _fetch_pexels_api(query: str, api_key: str) -> bytes | None:
    encoded = urllib.parse.quote_plus(query)
    raw = _get(
        f"https://api.pexels.com/v1/search?query={encoded}&per_page=1&orientation=landscape",
        headers={"Authorization": api_key},
        timeout=20,
    )
    if not raw:
        return None
    try:
        photos = json.loads(raw).get("photos", [])
        url = photos[0]["src"]["large"]
    except Exception:
        return None
    img = _get(url, timeout=30)
    return img if img and _is_image(img) else None


def _make_svg_placeholder(product_name: str, category: str) -> bytes:
    """Coloured SVG placeholder as last resort (no network needed)."""
    palette = {
        "feeds":     ("#1B5E20", "#A5D6A7"),
        "seeds":     ("#F57F17", "#FFF176"),
        "chemicals": ("#0D47A1", "#90CAF9"),
        "semen":     ("#4A148C", "#CE93D8"),
        "equipment": ("#BF360C", "#FFAB91"),
    }
    bg, fg = palette.get(category.lower(), ("#0B3A2C", "#E4B83A"))
    words = product_name.split()
    lines, cur = [], ""
    for w in words:
        if len(cur) + len(w) + 1 > 18:
            lines.append(cur.strip()); cur = w
        else:
            cur += f" {w}"
    if cur.strip():
        lines.append(cur.strip())
    y0 = 200 - (len(lines) - 1) * 22
    texts = "".join(
        f'<text x="300" y="{y0 + i * 44}" font-size="36" font-family="Arial,sans-serif" '
        f'fill="{fg}" text-anchor="middle" font-weight="bold">{ln}</text>'
        for i, ln in enumerate(lines)
    )
    cat_label = (
        f'<text x="300" y="320" font-size="22" font-family="Arial,sans-serif" '
        f'fill="{fg}" opacity="0.7" text-anchor="middle">{category.upper()}</text>'
    )
    svg = (
        '<?xml version="1.0" encoding="UTF-8"?>'
        '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">'
        f'<rect width="600" height="400" fill="{bg}"/>'
        f'<rect x="20" y="20" width="560" height="360" fill="none" stroke="{fg}" '
        f'stroke-width="3" opacity="0.4" rx="12"/>'
        f'{texts}{cat_label}'
        '</svg>'
    )
    return svg.encode("utf-8")


# ─── Command ──────────────────────────────────────────────────────────────────

class Command(BaseCommand):
    help = "Fetch appropriate product images from Wikipedia / Wikimedia Commons."

    def add_arguments(self, parser):
        parser.add_argument("--unsplash-key", default=None,
                            help="Unsplash API access key (unsplash.com/developers)")
        parser.add_argument("--pexels-key", default=None,
                            help="Pexels API key (pexels.com/api)")
        parser.add_argument("--overwrite", action="store_true", default=False,
                            help="Re-download even if product already has an image.")
        parser.add_argument("--product", default=None,
                            help="Process only the product whose name contains this string.")

    def handle(self, *args, **options):
        qs = Product.objects.select_related("category").filter(is_active=True)
        if options["product"]:
            qs = qs.filter(name__icontains=options["product"])
            if not qs.exists():
                raise CommandError(f"No active product matching '{options['product']}'")
        if not options["overwrite"]:
            qs = qs.filter(image="")

        total = qs.count()
        if total == 0:
            self.stdout.write(self.style.WARNING(
                "No products need images. Use --overwrite to re-fetch all."))
            return

        self.stdout.write(self.style.MIGRATE_HEADING(
            f"\nFetching images for {total} product(s)\n"))

        ok = fallback_count = 0

        for product in qs:
            self.stdout.write(f"  {product.name:<40}", ending="")

            img_bytes: bytes | None = None
            ext = "jpg"
            source = ""

            # 1. Wikipedia REST API ─────────────────────────────────────────
            wiki_title = _wikipedia_title_for(product)
            if wiki_title:
                img_bytes = _fetch_wikipedia(wiki_title)
                if img_bytes:
                    source = f"[wikipedia: {wiki_title}]"

            # 2. Wikimedia Commons keyword search ───────────────────────────
            if img_bytes is None:
                commons_q = _commons_query_for(product)
                img_bytes = _fetch_wikimedia_commons(commons_q)
                if img_bytes:
                    source = f"[commons: {commons_q}]"

            # 3. Unsplash API (optional) ─────────────────────────────────────
            if img_bytes is None and options["unsplash_key"]:
                q = wiki_title or _commons_query_for(product)
                img_bytes = _fetch_unsplash_api(q, options["unsplash_key"])
                if img_bytes:
                    source = "[unsplash-api]"

            # 4. Pexels API (optional) ───────────────────────────────────────
            if img_bytes is None and options["pexels_key"]:
                q = wiki_title or _commons_query_for(product)
                img_bytes = _fetch_pexels_api(q, options["pexels_key"])
                if img_bytes:
                    source = "[pexels-api]"

            # 5. SVG colour placeholder ──────────────────────────────────────
            if img_bytes is None:
                img_bytes = _make_svg_placeholder(product.name, product.category.name)
                ext = "svg"
                source = "[svg-placeholder]"
                fallback_count += 1

            filename = f"{product.slug}.{ext}"

            with tempfile.NamedTemporaryFile(suffix=f".{ext}", delete=False) as tmp:
                tmp.write(img_bytes)
                tmp_path = tmp.name

            try:
                with open(tmp_path, "rb") as f:
                    if product.image:
                        try:
                            old = product.image.path
                            if os.path.isfile(old):
                                os.remove(old)
                        except Exception:
                            pass
                    product.image.save(filename, File(f), save=True)
                ok += 1
                self.stdout.write(
                    self.style.SUCCESS(f"[OK]") + f" {source} -> products/{filename}"
                )
            except Exception as exc:
                self.stdout.write(self.style.ERROR(f"[FAIL] {exc}"))
            finally:
                os.unlink(tmp_path)

            time.sleep(3.0)   # Wikimedia CDN rate-limit: stay well under threshold

        self.stdout.write("")
        self.stdout.write(self.style.SUCCESS(
            f"Done. {ok}/{total} images saved "
            f"({fallback_count} SVG placeholder{'s' if fallback_count != 1 else ''})."
        ))
