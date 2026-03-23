import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ShoppingCart, Trash2, Minus, Plus, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/contexts/CartContext";
import { formatKES, parseDecimal } from "@/utils/formatCurrency";
import { buildWhatsAppCheckoutURL } from "@/utils/whatsapp";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";
const WHATSAPP_PHONE = import.meta.env.VITE_WHATSAPP_PHONE ?? "254740368581";

function getImageUrl(image: string | null): string | null {
  if (!image) return null;
  if (image.startsWith("http")) return image;
  return `${API_URL}${image}`;
}

export default function CartPage() {
  const navigate = useNavigate();
  const { items, removeItem, updateQuantity, clearCart, totalItems, totalAmount } = useCart();
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  function handleCheckout() {
    const waCart = items.map((i) => ({
      name: i.product.name,
      quantity: i.quantity,
      price: parseDecimal(i.product.price),
      unit: i.product.unit,
    }));
    const url = buildWhatsAppCheckoutURL(waCart, WHATSAPP_PHONE);
    setIsCheckingOut(true);
    window.open(url, "_blank", "noopener,noreferrer");
    setTimeout(() => {
      clearCart();
      setIsCheckingOut(false);
    }, 800);
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-[#F6F7F6] flex flex-col items-center justify-center px-4">
        <ShoppingCart className="w-20 h-20 text-gray-300 mb-4" />
        <h2 className="text-2xl font-bold text-[#111915] mb-2">Your cart is empty</h2>
        <p className="text-[#6B7A72] mb-6 text-center">
          Add products from our catalog to get started.
        </p>
        <Button
          onClick={() => navigate("/catalog")}
          className="bg-[#0B3A2C] hover:bg-[#0a3226] text-white"
        >
          Browse Products
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F6F7F6]">
      <title>Your Cart | Nicmah Agrovet</title>
      <meta name="robots" content="noindex, nofollow" />
      {/* Header */}
      <div className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-sm text-[#6B7A72] hover:text-[#0B3A2C] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Continue Shopping
          </button>
          <Separator orientation="vertical" className="h-4" />
          <span className="font-semibold text-[#111915]">
            Cart ({totalItems} {totalItems === 1 ? "item" : "items"})
          </span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-3">
            {items.map(({ product, quantity }) => {
              const imageUrl = getImageUrl(product.image);
              const lineTotal = parseDecimal(product.price) * quantity;

              return (
                <div
                  key={product.id}
                  className="bg-white rounded-xl border border-gray-100 p-4 flex gap-4"
                >
                  {/* Product image */}
                  <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-50 flex-shrink-0 border border-gray-100">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <ShoppingCart className="w-8 h-8" />
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold text-[#111915] leading-tight line-clamp-2">
                          {product.name}
                        </p>
                        <Badge
                          variant="secondary"
                          className="mt-1 text-xs bg-[#0B3A2C]/10 text-[#0B3A2C] border-0"
                        >
                          {product.category_name}
                        </Badge>
                      </div>
                      <button
                        onClick={() => removeItem(product.id)}
                        className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0 p-1"
                        aria-label="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-4">
                      {/* Quantity stepper */}
                      <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                        <button
                          onClick={() => updateQuantity(product.id, quantity - 1)}
                          className="px-2.5 py-1.5 text-[#0B3A2C] hover:bg-gray-50 transition-colors"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-3 py-1.5 text-sm font-semibold text-[#111915] min-w-[2rem] text-center border-x border-gray-200">
                          {quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(product.id, quantity + 1)}
                          className="px-2.5 py-1.5 text-[#0B3A2C] hover:bg-gray-50 transition-colors"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Line total */}
                      <div className="text-right">
                        <p className="font-bold text-[#111915]">{formatKES(lineTotal)}</p>
                        <p className="text-xs text-[#6B7A72]">
                          {formatKES(parseDecimal(product.price))} / {product.unit || "unit"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-gray-100 p-5 sticky top-20">
              <h3 className="font-bold text-[#111915] text-lg mb-4">Order Summary</h3>

              <div className="space-y-2 mb-4">
                {items.map(({ product, quantity }) => (
                  <div key={product.id} className="flex justify-between text-sm">
                    <span className="text-[#6B7A72] truncate pr-2">
                      {product.name} ×{quantity}
                    </span>
                    <span className="text-[#111915] font-medium flex-shrink-0">
                      {formatKES(parseDecimal(product.price) * quantity)}
                    </span>
                  </div>
                ))}
              </div>

              <Separator className="my-3" />

              <div className="flex justify-between font-bold text-[#111915] mb-5">
                <span>Subtotal</span>
                <span>{formatKES(totalAmount)}</span>
              </div>

              <Button
                onClick={handleCheckout}
                disabled={isCheckingOut}
                className="w-full bg-[#25D366] hover:bg-[#1ebe5c] text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-5 h-5" />
                {isCheckingOut ? "Opening WhatsApp…" : "Order via WhatsApp"}
              </Button>

              <p className="text-xs text-[#6B7A72] text-center mt-3 leading-relaxed">
                We'll confirm availability and arrange delivery via WhatsApp.
              </p>

              <Separator className="my-4" />

              <button
                onClick={() => navigate("/catalog")}
                className="w-full text-sm text-[#0B3A2C] hover:underline text-center"
              >
                + Add more items
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
