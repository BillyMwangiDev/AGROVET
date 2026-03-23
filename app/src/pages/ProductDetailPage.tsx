import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Beef, CheckCircle2, XCircle, Package, Info, ShoppingCart, Minus, Plus, MessageCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useProductBySlug, useProducts } from "@/hooks/useProducts";
import { parseDecimal, formatKES } from "@/utils/formatCurrency";
import { buildWhatsAppCheckoutURL } from "@/utils/whatsapp";
import { useCart } from "@/contexts/CartContext";
import type { Product } from "@/types";

const WHATSAPP_PHONE = import.meta.env.VITE_WHATSAPP_PHONE || "254740368581";

function StockBadge({ status }: { status: Product["stock_status"] }) {
  if (status === "out_of_stock") {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-red-600 bg-red-50 px-3 py-1.5 rounded-full">
        <XCircle className="w-4 h-4" /> Out of Stock
      </span>
    );
  }
  const labels = { low: "Low Stock", moderate: "In Stock", stocked: "In Stock" };
  return (
    <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full">
      <CheckCircle2 className="w-4 h-4" /> {labels[status] || "In Stock"}
    </span>
  );
}

function RelatedProductCard({ product }: { product: Product }) {
  const navigate = useNavigate();
  return (
    <div
      onClick={() => navigate(`/catalog/product/${product.slug || product.id}`)}
      className="bg-white rounded-xl border border-gray-100 p-3 cursor-pointer hover:shadow-sm hover:-translate-y-0.5 transition-all"
    >
      {product.image ? (
        <img src={product.image} alt={product.name} className="w-full aspect-square object-cover rounded-lg mb-2" />
      ) : (
        <div className="w-full aspect-square bg-gray-50 rounded-lg mb-2 flex items-center justify-center">
          <Beef className="w-8 h-8 text-gray-200" />
        </div>
      )}
      <h4 className="text-xs font-semibold text-gray-900 line-clamp-2 mb-1">{product.name}</h4>
      <p className="text-sm font-bold text-[#0B3A2C]">{formatKES(parseDecimal(product.price))}</p>
    </div>
  );
}

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const { addItem } = useCart();

  const { data: product, isLoading, isError } = useProductBySlug(slug ?? null);

  // Related products in same category
  const { data: related = [] } = useProducts(
    product ? { category: product.category_slug, sort: "name" } : undefined
  );
  const relatedFiltered = related.filter((p) => p.id !== product?.id).slice(0, 4);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F6F7F6] p-6">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8">
          <Skeleton className="w-full aspect-square rounded-2xl" />
          <div className="space-y-4">
            <Skeleton className="h-6 w-32 rounded-full" />
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-10 w-32 rounded-full mt-4" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="min-h-screen bg-[#F6F7F6] flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 text-lg mb-4">Product not found.</p>
          <Button onClick={() => navigate("/catalog")} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Catalog
          </Button>
        </div>
      </div>
    );
  }

  const displayImage = selectedImage || product.image;
  const allImages = [
    ...(product.image ? [product.image] : []),
    ...product.additional_images.filter((i) => i.is_active).map((i) => i.image),
  ];

  const whatsappUrl = buildWhatsAppCheckoutURL(
    [{ name: product.name, quantity, price: parseDecimal(product.price), unit: product.unit }],
    WHATSAPP_PHONE
  );

  const productDesc = product.description
    ? product.description.substring(0, 155)
    : `${product.name} — KES ${product.price}. Available at Nicmah Agrovet, Naromoru, Nyeri County.`;

  return (
    <div className="min-h-screen bg-[#F6F7F6]">
      <title>{product.name} | Nicmah Agrovet</title>
      <meta name="description" content={productDesc} />
      {product.stock_status === 'out_of_stock' && (
        <meta name="robots" content="noindex" />
      )}
      <script type="application/ld+json">{JSON.stringify({
        "@context": "https://schema.org/",
        "@type": "Product",
        "name": product.name,
        "description": productDesc,
        "image": product.image ? [product.image] : [],
        "brand": { "@type": "Brand", "name": "Nicmah Agrovet" },
        "offers": {
          "@type": "Offer",
          "priceCurrency": "KES",
          "price": product.price,
          "availability": product.stock_status === 'out_of_stock'
            ? "https://schema.org/OutOfStock"
            : "https://schema.org/InStock",
          "seller": { "@type": "Organization", "name": "Nicmah Agrovet" }
        }
      })}</script>
      {/* Top bar */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 h-14 flex items-center gap-3">
          <button
            onClick={() => navigate("/catalog")}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Catalog
          </button>
          <span className="text-gray-300">/</span>
          <span className="text-sm text-gray-500">{product.category_name}</span>
          <span className="text-gray-300">/</span>
          <span className="text-sm font-medium text-gray-900 line-clamp-1">{product.name}</span>
        </div>
      </div>

      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 py-8">
        <div className="max-w-5xl mx-auto">
          {/* Product info */}
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {/* Left: Images */}
            <div className="space-y-3">
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden aspect-square flex items-center justify-center">
                {displayImage ? (
                  <img
                    src={displayImage}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Beef className="w-20 h-20 text-gray-200" />
                )}
              </div>
              {allImages.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {allImages.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImage(img)}
                      className={`shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${selectedImage === img || (!selectedImage && idx === 0) ? "border-[#0B3A2C]" : "border-gray-200 hover:border-gray-300"}`}
                    >
                      <img src={img} alt={`${product.name} ${idx + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Details */}
            <div className="space-y-5">
              <div>
                <span className="text-xs font-semibold text-[#0B3A2C] bg-[#e8f5ee] px-2 py-1 rounded-full">
                  {product.category_name}
                </span>
                {product.is_featured && (
                  <span className="ml-2 text-xs font-semibold text-[#E4B83A] bg-amber-50 px-2 py-1 rounded-full">
                    ★ Featured
                  </span>
                )}
              </div>

              <h1 className="text-2xl font-bold text-gray-900 leading-tight">{product.name}</h1>

              <div className="flex items-center gap-3">
                <StockBadge status={product.stock_status} />
                {product.sku && (
                  <span className="text-xs text-gray-400 font-mono">SKU: {product.sku}</span>
                )}
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-[#0B3A2C]">
                  {formatKES(parseDecimal(product.price))}
                </span>
                <span className="text-gray-400 text-sm">per {product.unit}</span>
              </div>

              {product.package_size && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Package className="w-4 h-4" />
                  Package size: <span className="font-medium text-gray-700">{product.package_size}</span>
                </div>
              )}

              <p className="text-gray-600 text-sm leading-relaxed">{product.description}</p>

              {/* AI semen details */}
              {product.is_ai_product && (
                <div className="bg-[#f0f9f4] rounded-2xl p-4 space-y-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Info className="w-4 h-4 text-[#0B3A2C]" />
                    <span className="text-sm font-semibold text-[#0B3A2C]">Genetic Details</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {product.breed && (
                      <div>
                        <p className="text-xs text-gray-400">Breed</p>
                        <p className="text-sm font-semibold text-gray-900">{product.breed}</p>
                      </div>
                    )}
                    {product.origin_country && (
                      <div>
                        <p className="text-xs text-gray-400">Origin</p>
                        <p className="text-sm font-semibold text-gray-900">{product.origin_country}</p>
                      </div>
                    )}
                    {product.sire_code && (
                      <div>
                        <p className="text-xs text-gray-400">Sire Code</p>
                        <p className="text-sm font-semibold text-gray-900 font-mono">{product.sire_code}</p>
                      </div>
                    )}
                    {Object.entries(product.genetic_traits || {}).map(([k, v]) => (
                      <div key={k}>
                        <p className="text-xs text-gray-400 capitalize">
                          {k.replace(/([A-Z])/g, " $1").trim()}
                        </p>
                        <p className="text-sm font-semibold text-gray-900">{v}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity stepper */}
              <div className="flex items-center gap-4 pt-2">
                <span className="text-sm font-medium text-gray-700">Quantity</span>
                <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="px-3 py-2 text-[#0B3A2C] hover:bg-gray-50 transition-colors"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="px-4 py-2 font-semibold text-[#111915] min-w-[2.5rem] text-center border-x border-gray-200">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity((q) => q + 1)}
                    className="px-3 py-2 text-[#0B3A2C] hover:bg-gray-50 transition-colors"
                    aria-label="Increase quantity"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* CTA buttons */}
              <div className="flex gap-3 pt-1">
                <Button
                  onClick={() => addItem(product, quantity)}
                  disabled={!product.in_stock}
                  className="flex-1 bg-[#0B3A2C] hover:bg-[#0a3226] text-white font-semibold py-5 rounded-xl"
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  {product.in_stock ? "Add to Cart" : "Out of Stock"}
                </Button>
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={!product.in_stock ? "pointer-events-none" : ""}
                >
                  <Button
                    variant="outline"
                    className="border-[#25D366] text-[#0B3A2C] hover:bg-[#25D366]/10 font-semibold py-5 rounded-xl px-4"
                    disabled={!product.in_stock}
                  >
                    <MessageCircle className="w-4 h-4 mr-1 text-[#25D366]" />
                    Order Now
                  </Button>
                </a>
              </div>

              {product.meta_description && (
                <p className="text-xs text-gray-400 italic border-t border-gray-100 pt-3">
                  {product.meta_description}
                </p>
              )}
            </div>
          </div>

          {/* Related products */}
          {relatedFiltered.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">More in {product.category_name}</h2>
                <button
                  onClick={() => navigate(`/catalog?category=${product.category_slug}`)}
                  className="text-sm text-[#0B3A2C] font-medium hover:underline"
                >
                  View all →
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {relatedFiltered.map((p) => (
                  <RelatedProductCard key={p.id} product={p} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
