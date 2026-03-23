from decimal import Decimal, InvalidOperation

try:
    import pandas as pd
except ImportError:
    pd = None


from inventory.models import Category, Product

REQUIRED_COLUMNS = {"name", "category", "price", "stock", "unit"}

COLUMN_ALIASES = {
    "product name": "name",
    "product": "name",
    "category name": "category",
    "selling price": "price",
    "cost": "price",
    "stock level": "stock",
    "quantity": "stock",
    "qty": "stock",
    "unit of measure": "unit",
    "uom": "unit",
    "min stock": "minstock",
    "minimum stock": "minstock",
    "reorder point": "minstock",
    "max stock": "maxstock",
    "maximum stock": "maxstock",
    "expiry": "expiry_date",
    "expiry date": "expiry_date",
}


def _normalise_columns(df: 'pd.DataFrame') -> 'pd.DataFrame':
    """Lowercase column headers and apply known aliases."""
    df.columns = [c.strip().lower() for c in df.columns]
    df.rename(columns=COLUMN_ALIASES, inplace=True)
    return df



def import_products_from_excel(file_obj) -> dict:
    """
    Read an Excel or CSV file and bulk-upsert products.

    Uses update_or_create keyed on (name, category) to prevent duplicates.
    Returns: {"imported": N, "skipped": M, "errors": [{"row": N, "error": str}]}
    """
    # ── Read file ────────────────────────────────────────────────────────────
    if pd is None:
        return {
            "imported": 0,
            "skipped": 0,
            "errors": [{"row": 0, "error": "Excel/CSV import requires 'pandas' and 'openpyxl', which are not installed."}]
        }

    file_name = getattr(file_obj, "name", "").lower()

    try:
        if file_name.endswith(".csv"):
            df = pd.read_csv(file_obj)
        else:
            df = pd.read_excel(file_obj, engine="openpyxl")
    except Exception as exc:
        return {"imported": 0, "skipped": 0, "errors": [{"row": 0, "error": f"Could not read file: {exc}"}]}

    df = _normalise_columns(df)

    # ── Validate required columns ─────────────────────────────────────────────
    missing = REQUIRED_COLUMNS - set(df.columns)
    if missing:
        return {
            "imported": 0,
            "skipped": 0,
            "errors": [{
                "row": 0,
                "error": (
                    f"Missing required columns: {', '.join(sorted(missing))}. "
                    f"Found: {', '.join(sorted(df.columns))}"
                ),
            }],
        }

    results = {"imported": 0, "skipped": 0, "errors": []}

    for idx, row in df.iterrows():
        row_num = idx + 2  # Excel rows are 1-indexed + 1 header row
        try:
            name = str(row.get("name", "")).strip()
            category_name = str(row.get("category", "")).strip()

            if not name or not category_name:
                results["errors"].append({"row": row_num, "error": "Name and category are required."})
                results["skipped"] += 1
                continue

            # Parse price
            try:
                price = Decimal(str(row["price"]).replace(",", "").strip())
            except (InvalidOperation, ValueError):
                results["errors"].append({"row": row_num, "error": f"Invalid price: {row.get('price')}"})
                results["skipped"] += 1
                continue

            # Parse stock
            try:
                stock_level = int(float(str(row.get("stock", 0)).replace(",", "").strip()))
            except (ValueError, TypeError):
                stock_level = 0

            unit = str(row.get("unit", "unit")).strip()
            reorder_point = _safe_int(row.get("minstock"), default=10)
            max_stock = _safe_int(row.get("maxstock"), default=100)
            supplier = str(row.get("supplier", "")).strip()
            description = str(row.get("description", "")).strip()

            # Semen / AI fields
            is_ai = str(row.get("is_ai_product", "false")).strip().lower() in ("true", "1", "yes")
            breed = str(row.get("breed", "")).strip()
            origin_country = str(row.get("origin_country", "")).strip()
            sire_code = str(row.get("sire_code", "")).strip() or None

            # Get or create category
            category, _ = Category.objects.get_or_create(
                slug=category_name.lower().replace(" ", "-"),
                defaults={"name": category_name.title()},
            )

            update_defaults = {
                "price": price,
                "stock_level": stock_level,
                "unit": unit,
                "reorder_point": reorder_point,
                "max_stock": max_stock,
                "supplier": supplier,
                "description": description,
                "is_ai_product": is_ai,
                "breed": breed,
                "origin_country": origin_country,
                "is_active": True,
            }

            # Only set sire_code if not blank to avoid unique constraint conflicts
            if sire_code:
                update_defaults["sire_code"] = sire_code

            Product.objects.update_or_create(
                name=name,
                category=category,
                defaults=update_defaults,
            )
            results["imported"] += 1

        except Exception as exc:
            results["errors"].append({"row": row_num, "error": str(exc)})
            results["skipped"] += 1

    return results


def _safe_int(value, default: int = 0) -> int:
    try:
        return int(float(str(value).replace(",", "").strip()))
    except (ValueError, TypeError):
        return default
