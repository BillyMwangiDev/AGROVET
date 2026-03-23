import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, ShoppingCart, Check, ArrowRight, TrendingUp, Package } from 'lucide-react';
import { useProducts, useTrendingProducts } from '@/hooks/useProducts';
import type { Product } from '@/types';
import { parseDecimal, formatKES } from '@/utils/formatCurrency';
import { useCart } from '@/contexts/CartContext';

// ── Stock Badge ────────────────────────────────────────────────────────────────

function StockBadge({ inStock }: { inStock: boolean }) {
  if (inStock) return null;
  return (
    <span className="text-[10px] font-bold text-red-600 bg-red-50 border border-red-100 px-2 py-0.5 rounded-full">
      Out of Stock
    </span>
  );
}

// ── Category Badge ─────────────────────────────────────────────────────────────

function CategoryBadge({ name }: { name: string }) {
  return (
    <span className="inline-block bg-brand-50 text-brand text-[10px] font-semibold px-2.5 py-1 rounded-full border border-brand/10">
      {name}
    </span>
  );
}

// ── Product Card ───────────────────────────────────────────────────────────────

function ProductCard({
  product,
  onAddToCart,
  justAdded,
}: {
  product: Product;
  onAddToCart: () => void;
  justAdded: boolean;
}) {
  const navigate = useNavigate();
  const slug = product.slug || product.id;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 flex flex-col bento-card shadow-sm hover:border-brand/15 overflow-hidden group">
      {/* Product Image — with hover Quick View overlay */}
      <div className="relative w-full h-44 bg-brand-50 flex-shrink-0 overflow-hidden">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-400"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-12 h-12 text-brand/20" aria-hidden="true" />
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-brand/70 to-transparent translate-y-full group-hover:translate-y-0 transition-transform duration-300 flex items-end justify-center pb-4">
          <button
            onClick={() => navigate(`/catalog/product/${slug}`)}
            className="glass text-white text-xs font-semibold px-4 py-2 rounded-xl flex items-center gap-1.5 hover:bg-white/25 transition-colors"
          >
            <Eye className="w-3.5 h-3.5" aria-hidden="true" />
            Quick View
          </button>
        </div>

        {/* Stock badge — top-right */}
        <div className="absolute top-2 right-2">
          <StockBadge inStock={product.in_stock} />
        </div>
      </div>

      <div className="p-4 flex flex-col gap-2.5 flex-1">
        <div className="flex items-center justify-between">
          <CategoryBadge name={product.category_name} />
        </div>

        <h3 className="text-sm font-bold text-foreground leading-snug line-clamp-2">
          {product.name}
        </h3>

        {product.is_ai_product && (product.breed || product.origin_country) && (
          <div className="bg-brand-50 rounded-xl px-3 py-2 text-xs space-y-1 border border-brand/8">
            {product.breed && (
              <div className="flex gap-1">
                <span className="font-semibold text-brand w-16 shrink-0">Breed:</span>
                <span className="text-muted-foreground">{product.breed}</span>
              </div>
            )}
            {product.origin_country && (
              <div className="flex gap-1">
                <span className="font-semibold text-brand w-16 shrink-0">Origin:</span>
                <span className="text-muted-foreground">{product.origin_country}</span>
              </div>
            )}
          </div>
        )}

        <p className="text-muted-foreground text-xs leading-relaxed line-clamp-2">
          {product.description}
        </p>

        {/* Price — Geist Mono font for data readability */}
        <div className="font-mono text-brand font-bold text-lg tracking-tight">
          {formatKES(parseDecimal(product.price))}
        </div>

        <div className="flex items-center gap-2 mt-auto pt-1">
          <button
            onClick={() => navigate(`/catalog/product/${slug}`)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border text-xs text-muted-foreground hover:border-brand hover:text-brand transition-all font-medium"
          >
            <Eye className="w-3.5 h-3.5" aria-hidden="true" />
            Details
          </button>
          <button
            onClick={onAddToCart}
            disabled={!product.in_stock || justAdded}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-xs font-semibold transition-all flex-1 justify-center ${
              justAdded
                ? 'bg-emerald-600 animate-scale-in'
                : 'bg-brand hover:bg-brand-600 shadow-brand hover:shadow-brand-lg'
            } disabled:opacity-50`}
          >
            {justAdded ? (
              <><Check className="w-3.5 h-3.5" aria-hidden="true" /> Added</>
            ) : (
              <><ShoppingCart className="w-3.5 h-3.5" aria-hidden="true" /> Add to Cart</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Loading Skeleton ───────────────────────────────────────────────────────────

function ProductSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <div className="h-44 skeleton-shimmer" />
      <div className="p-4 space-y-3">
        <div className="h-5 skeleton-shimmer rounded-full w-1/3" />
        <div className="h-5 skeleton-shimmer rounded-lg w-3/4" />
        <div className="h-14 skeleton-shimmer rounded-xl" />
        <div className="h-6 skeleton-shimmer rounded-lg w-1/3" />
        <div className="h-9 skeleton-shimmer rounded-xl" />
      </div>
    </div>
  );
}

// ── Main Section ───────────────────────────────────────────────────────────────

export default function Products() {
  const [justAddedId, setJustAddedId] = useState<string | null>(null);
  const { addItem } = useCart();

  const { data: allProducts = [] } = useProducts();
  const { data: products = [], isLoading, isError, isFallback } = useTrendingProducts(8);

  function handleAddToCart(product: Product) {
    addItem(product, 1);
    setJustAddedId(product.id);
    setTimeout(() => setJustAddedId(null), 1200);
  }

  const sectionTitle = isFallback ? 'Our Top Products' : 'Our Best Sellers';
  const sectionSubtitle = isFallback
    ? 'Premium products trusted by farmers across Laikipia'
    : 'The products our farmers reach for most';

  return (
    <section id="products" className="w-full py-20 bg-background">
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">

        {/* Section Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-brand/8 text-brand text-xs font-semibold px-3.5 py-1.5 rounded-full mb-4 border border-brand/12">
            <TrendingUp className="w-3.5 h-3.5" aria-hidden="true" />
            Trending Now
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground mb-3">
            {sectionTitle}
          </h2>
          <p className="text-muted-foreground text-base">{sectionSubtitle}</p>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <ProductSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Error State */}
        {isError && (
          <div className="text-center py-16">
            <Package className="w-12 h-12 text-brand/20 mx-auto mb-3" aria-hidden="true" />
            <p className="text-muted-foreground">Could not load products. Please check back shortly.</p>
          </div>
        )}

        {/* Product Grid */}
        {!isLoading && !isError && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={() => handleAddToCart(product)}
                justAdded={justAddedId === product.id}
              />
            ))}
          </div>
        )}

        {/* Browse All CTA */}
        <div className="flex justify-center mt-12">
          <Link
            to="/catalog"
            className="inline-flex items-center gap-2.5 px-8 py-3.5 bg-brand hover:bg-brand-600 text-white font-semibold rounded-xl transition-all shadow-brand hover:shadow-brand-lg hover:-translate-y-0.5 text-sm"
          >
            Browse All Products
            {allProducts.length > 0 && (
              <span className="text-white/60 font-normal font-mono text-xs">
                {allProducts.length} items
              </span>
            )}
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Link>
        </div>

      </div>
    </section>
  );
}
