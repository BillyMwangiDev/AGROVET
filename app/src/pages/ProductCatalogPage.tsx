import { useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Search, SlidersHorizontal, X, ShoppingCart, Beef, ArrowLeft, Check, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useProducts, useCategories, useProductSearchSuggestions } from "@/hooks/useProducts";
import { parseDecimal, formatKES } from "@/utils/formatCurrency";
import { useCart } from "@/contexts/CartContext";
import type { Product, ProductFilters } from "@/types";

// ── Stock badge ───────────────────────────────────────────────────────────

function StockBadge({ status }: { status: Product["stock_status"] }) {
  const map: Record<string, { label: string; classes: string }> = {
    out_of_stock: { label: "Out of Stock", classes: "bg-red-50 text-red-600 border-red-100" },
    low: { label: "Low Stock", classes: "bg-amber-50 text-amber-600 border-amber-100" },
    moderate: { label: "Available", classes: "bg-blue-50 text-blue-600 border-blue-100" },
    stocked: { label: "In Stock", classes: "bg-emerald-50 text-emerald-600 border-emerald-100" },
  };
  const { label, classes } = map[status] ?? map.stocked;
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${classes}`}>
      {label}
    </span>
  );
}

// ── Product card ──────────────────────────────────────────────────────────

function ProductCard({
  product,
  onView,
  onAddToCart,
  justAdded,
}: {
  product: Product;
  onView: () => void;
  onAddToCart: () => void;
  justAdded: boolean;
}) {
  const price = parseDecimal(product.price);
  return (
    <div
      className="bg-white rounded-2xl border border-gray-100 overflow-hidden flex flex-col hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group"
      onClick={onView}
    >
      {/* Image */}
      <div className="relative w-full aspect-[4/3] bg-gray-50 overflow-hidden">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Beef className="w-10 h-10 text-gray-200" />
          </div>
        )}
        {product.is_featured && (
          <span className="absolute top-2 left-2 bg-[#E4B83A] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
            Featured
          </span>
        )}
        <div className="absolute top-2 right-2">
          <StockBadge status={product.stock_status} />
        </div>
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col gap-2 flex-1">
        <span className="text-[11px] font-semibold text-[#0B3A2C] bg-[#e8f5ee] px-2 py-0.5 rounded-full self-start">
          {product.category_name}
        </span>
        <h3 className="text-sm font-bold text-gray-900 leading-snug line-clamp-2">{product.name}</h3>
        {product.package_size && (
          <p className="text-xs text-gray-400">{product.package_size}</p>
        )}
        <p className="text-xs text-gray-500 line-clamp-2 flex-1">{product.description}</p>

        <div className="mt-auto pt-2 border-t border-gray-50 space-y-2">
          <span className="text-lg font-bold text-[#0B3A2C]">{formatKES(price)}</span>
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); onView(); }}
              className="flex items-center gap-1 text-xs font-medium text-gray-600 border border-gray-200 hover:border-[#0B3A2C] hover:text-[#0B3A2C] px-2.5 py-1.5 rounded-lg transition-colors"
            >
              <Eye className="w-3.5 h-3.5" />
              View
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onAddToCart(); }}
              disabled={!product.in_stock || justAdded}
              className={`flex items-center gap-1 text-xs font-semibold text-white px-3 py-1.5 rounded-lg transition-all flex-1 justify-center ${
                justAdded
                  ? "bg-green-600"
                  : "bg-[#0B3A2C] hover:bg-[#0a3226]"
              } disabled:opacity-50`}
            >
              {justAdded ? (
                <><Check className="w-3.5 h-3.5" /> Added</>
              ) : (
                <><ShoppingCart className="w-3.5 h-3.5" /> Add to Cart</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Search suggestions dropdown ───────────────────────────────────────────

function SearchSuggestions({ q, onSelect, onClose }: {
  q: string;
  onSelect: (slug: string) => void;
  onClose: () => void;
}) {
  const { data = [] } = useProductSearchSuggestions(q);
  if (!data.length) return null;
  return (
    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
      {data.map((s) => (
        <button
          key={s.id}
          className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 text-left border-b border-gray-50 last:border-0"
          onMouseDown={() => { onSelect(s.slug || s.id); onClose(); }}
        >
          <div>
            <span className="text-sm font-medium text-gray-900">{s.name}</span>
            <span className="text-xs text-gray-400 ml-2">{s.category}</span>
          </div>
          <span className="text-sm font-bold text-[#0B3A2C]">{formatKES(parseDecimal(s.price))}</span>
        </button>
      ))}
    </div>
  );
}

// ── Filters sidebar ───────────────────────────────────────────────────────

function FiltersPanel({
  filters,
  onChange,
  onReset,
  categories,
}: {
  filters: ProductFilters;
  onChange: (f: Partial<ProductFilters>) => void;
  onReset: () => void;
  categories: Array<{ id: number; name: string; slug: string }>;
}) {
  const hasFilters = !!(filters.category || filters.price_min || filters.price_max || filters.stock);

  return (
    <div className="space-y-6">
      {hasFilters && (
        <button
          onClick={onReset}
          className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-600 font-medium"
        >
          <X className="w-3.5 h-3.5" /> Clear all filters
        </button>
      )}

      {/* Category */}
      <div>
        <h4 className="text-sm font-semibold text-gray-900 mb-3">Category</h4>
        <div className="space-y-1.5">
          <button
            onClick={() => onChange({ category: undefined })}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${!filters.category ? "bg-[#0B3A2C] text-white font-semibold" : "text-gray-600 hover:bg-gray-50"}`}
          >
            All Products
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onChange({ category: cat.slug })}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${filters.category === cat.slug ? "bg-[#0B3A2C] text-white font-semibold" : "text-gray-600 hover:bg-gray-50"}`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Price range */}
      <div>
        <h4 className="text-sm font-semibold text-gray-900 mb-3">Price Range (KES)</h4>
        <div className="flex gap-2 items-center">
          <Input
            type="number"
            placeholder="Min"
            value={filters.price_min || ""}
            onChange={(e) => onChange({ price_min: e.target.value || undefined })}
            className="text-sm"
          />
          <span className="text-gray-400 text-sm">–</span>
          <Input
            type="number"
            placeholder="Max"
            value={filters.price_max || ""}
            onChange={(e) => onChange({ price_max: e.target.value || undefined })}
            className="text-sm"
          />
        </div>
      </div>

      {/* Availability */}
      <div>
        <h4 className="text-sm font-semibold text-gray-900 mb-3">Availability</h4>
        <div className="space-y-1.5">
          {[
            { val: undefined, label: "All" },
            { val: "in_stock" as const, label: "In Stock" },
            { val: "out_of_stock" as const, label: "Out of Stock" },
          ].map((opt) => (
            <button
              key={opt.label}
              onClick={() => onChange({ stock: opt.val })}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${filters.stock === opt.val ? "bg-[#0B3A2C] text-white font-semibold" : "text-gray-600 hover:bg-gray-50"}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────

export default function ProductCatalogPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchInput, setSearchInput] = useState(searchParams.get("q") || "");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [justAddedId, setJustAddedId] = useState<string | null>(null);
  const { addItem } = useCart();

  function handleAddToCart(product: Product) {
    addItem(product, 1);
    setJustAddedId(product.id);
    setTimeout(() => setJustAddedId(null), 1200);
  }

  const filters: ProductFilters = {
    q: searchParams.get("q") || undefined,
    category: searchParams.get("category") || undefined,
    price_min: searchParams.get("price_min") || undefined,
    price_max: searchParams.get("price_max") || undefined,
    stock: (searchParams.get("stock") as ProductFilters["stock"]) || undefined,
    sort: (searchParams.get("sort") as ProductFilters["sort"]) || "name",
  };

  const updateFilters = useCallback((next: Partial<ProductFilters>) => {
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev);
      Object.entries(next).forEach(([k, v]) => {
        if (v == null || v === "") p.delete(k);
        else p.set(k, String(v));
      });
      return p;
    });
  }, [setSearchParams]);

  const resetFilters = () => setSearchParams({});

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters({ q: searchInput || undefined });
    setShowSuggestions(false);
  };

  const { data: products = [], isLoading, isError } = useProducts(filters);
  const { data: categories = [] } = useCategories(true);

  const activeFilterCount = [
    filters.category, filters.price_min, filters.price_max, filters.stock,
  ].filter(Boolean).length;

  const categoryLabel = filters.category
    ? categories.find((c) => c.slug === filters.category)?.name
    : undefined;
  const pageTitle = categoryLabel
    ? `${categoryLabel} – Shop | Nicmah Agrovet`
    : 'Shop Agricultural Supplies | Nicmah Agrovet';
  const pageDesc = categoryLabel
    ? `Browse our ${categoryLabel} range — quality products for Kenya farmers at Nicmah Agrovet, Naromoru.`
    : 'Browse livestock feeds, AI semen, veterinary medicines, crop solutions and more at Nicmah Agrovet, Naromoru, Nyeri County.';

  return (
    <div className="min-h-screen bg-[#F6F7F6]">
      <title>{pageTitle}</title>
      <meta name="description" content={pageDesc} />
      {/* Header */}
      <div className="bg-[#0B3A2C] text-white">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 py-6">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-1.5 text-white/70 hover:text-white text-sm mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </button>
          <h1 className="text-3xl font-bold mb-1">Product Catalog</h1>
          <p className="text-white/70 text-sm">Premium agro-inputs for every farming need</p>
        </div>
      </div>

      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 py-6">
        {/* Search + Sort bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <form onSubmit={handleSearch} className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              value={searchInput}
              onChange={(e) => { setSearchInput(e.target.value); setShowSuggestions(true); }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              placeholder="Search products, SKU, category…"
              className="pl-9 bg-white"
            />
            {showSuggestions && searchInput.length >= 2 && (
              <SearchSuggestions
                q={searchInput}
                onSelect={(slug) => navigate(`/catalog/product/${slug}`)}
                onClose={() => setShowSuggestions(false)}
              />
            )}
          </form>

          <Select
            value={filters.sort || "name"}
            onValueChange={(v) => updateFilters({ sort: v as ProductFilters["sort"] })}
          >
            <SelectTrigger className="w-44 bg-white">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="best_selling">Best Selling</SelectItem>
              <SelectItem value="name">Name A–Z</SelectItem>
              <SelectItem value="name_desc">Name Z–A</SelectItem>
              <SelectItem value="price">Price: Low to High</SelectItem>
              <SelectItem value="price_desc">Price: High to Low</SelectItem>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="featured">Featured First</SelectItem>
            </SelectContent>
          </Select>

          {/* Mobile filters trigger */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="sm:hidden relative bg-white">
                <SlidersHorizontal className="w-4 h-4 mr-2" />
                Filters
                {activeFilterCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#0B3A2C] text-white rounded-full text-xs flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="left">
              <SheetHeader>
                <SheetTitle>Filters</SheetTitle>
              </SheetHeader>
              <div className="mt-6">
                <FiltersPanel
                  filters={filters}
                  onChange={updateFilters}
                  onReset={resetFilters}
                  categories={categories}
                />
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Active filter chips */}
        {(filters.q || filters.category || filters.price_min || filters.price_max || filters.stock) && (
          <div className="flex flex-wrap gap-2 mb-4">
            {filters.q && (
              <Badge variant="secondary" className="gap-1 pr-1">
                Search: "{filters.q}"
                <button onClick={() => { setSearchInput(""); updateFilters({ q: undefined }); }}>
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            )}
            {filters.category && (
              <Badge variant="secondary" className="gap-1 pr-1">
                {categories.find(c => c.slug === filters.category)?.name || filters.category}
                <button onClick={() => updateFilters({ category: undefined })}><X className="w-3 h-3" /></button>
              </Badge>
            )}
            {(filters.price_min || filters.price_max) && (
              <Badge variant="secondary" className="gap-1 pr-1">
                KES {filters.price_min || "0"} – {filters.price_max || "∞"}
                <button onClick={() => updateFilters({ price_min: undefined, price_max: undefined })}><X className="w-3 h-3" /></button>
              </Badge>
            )}
            {filters.stock && (
              <Badge variant="secondary" className="gap-1 pr-1">
                {filters.stock === "in_stock" ? "In Stock" : "Out of Stock"}
                <button onClick={() => updateFilters({ stock: undefined })}><X className="w-3 h-3" /></button>
              </Badge>
            )}
          </div>
        )}

        <div className="flex gap-6">
          {/* Desktop sidebar */}
          <aside className="hidden sm:block w-56 shrink-0">
            <div className="bg-white rounded-2xl border border-gray-100 p-5 sticky top-20">
              <div className="flex items-center gap-2 mb-5">
                <SlidersHorizontal className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-semibold text-gray-900">Filters</span>
                {activeFilterCount > 0 && (
                  <span className="ml-auto text-xs text-[#0B3A2C] font-bold">{activeFilterCount} active</span>
                )}
              </div>
              <FiltersPanel
                filters={filters}
                onChange={updateFilters}
                onReset={resetFilters}
                categories={categories}
              />
            </div>
          </aside>

          {/* Products grid */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-500">
                {isLoading ? "Loading…" : `${products.length} product${products.length !== 1 ? "s" : ""} found`}
              </p>
            </div>

            {isLoading && (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                    <Skeleton className="w-full aspect-[4/3]" />
                    <div className="p-4 space-y-2">
                      <Skeleton className="h-3 w-20 rounded-full" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-3 w-4/5" />
                      <Skeleton className="h-6 w-24 mt-2" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {isError && (
              <div className="text-center py-16 text-gray-500">
                <p className="text-base">Could not load products. Please try again.</p>
              </div>
            )}

            {!isLoading && !isError && products.length === 0 && (
              <div className="text-center py-16">
                <p className="text-gray-400 text-base mb-2">No products found</p>
                <button onClick={resetFilters} className="text-sm text-[#0B3A2C] font-medium hover:underline">
                  Clear filters
                </button>
              </div>
            )}

            {!isLoading && !isError && products.length > 0 && (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onView={() => navigate(`/catalog/product/${product.slug || product.id}`)}
                    onAddToCart={() => handleAddToCart(product)}
                    justAdded={justAddedId === product.id}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
