import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { CartProvider, useCart } from "@/contexts/CartContext";
import type { Product } from "@/types";

// Minimal Product mock matching the Product type shape
function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: overrides.id ?? "product-uuid-001",
    name: overrides.name ?? "Test Product",
    slug: overrides.slug ?? "test-product",
    category: overrides.category ?? {
      id: 1,
      name: "Feeds",
      slug: "feeds",
      is_active: true,
      is_admin_only: false,
    },
    price: overrides.price ?? "500.00",
    unit: overrides.unit ?? "bag",
    description: overrides.description ?? "",
    is_active: overrides.is_active ?? true,
    is_featured: overrides.is_featured ?? false,
    is_ai_product: overrides.is_ai_product ?? false,
    stock_status: overrides.stock_status ?? "stocked",
    image: overrides.image ?? null,
    additional_images: overrides.additional_images ?? [],
    ...overrides,
  } as Product;
}

function renderCartHook() {
  return renderHook(() => useCart(), {
    wrapper: CartProvider,
  });
}

describe("CartContext", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("starts with empty cart", () => {
    const { result } = renderCartHook();
    expect(result.current.items).toHaveLength(0);
    expect(result.current.totalItems).toBe(0);
    expect(result.current.totalAmount).toBe(0);
  });

  it("addItem increases totalItems", () => {
    const { result } = renderCartHook();
    const product = makeProduct();
    act(() => {
      result.current.addItem(product);
    });
    expect(result.current.totalItems).toBe(1);
  });

  it("addItem with default quantity adds 1", () => {
    const { result } = renderCartHook();
    const product = makeProduct();
    act(() => {
      result.current.addItem(product);
    });
    expect(result.current.items[0].quantity).toBe(1);
  });

  it("addItem with explicit quantity", () => {
    const { result } = renderCartHook();
    const product = makeProduct();
    act(() => {
      result.current.addItem(product, 3);
    });
    expect(result.current.items[0].quantity).toBe(3);
    expect(result.current.totalItems).toBe(3);
  });

  it("adding same product increases quantity instead of duplicating", () => {
    const { result } = renderCartHook();
    const product = makeProduct();
    act(() => {
      result.current.addItem(product, 2);
      result.current.addItem(product, 1);
    });
    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].quantity).toBe(3);
  });

  it("removeItem removes the product from cart", () => {
    const { result } = renderCartHook();
    const product = makeProduct();
    act(() => {
      result.current.addItem(product);
      result.current.removeItem(product.id);
    });
    expect(result.current.items).toHaveLength(0);
  });

  it("updateQuantity changes item quantity", () => {
    const { result } = renderCartHook();
    const product = makeProduct();
    act(() => {
      result.current.addItem(product, 2);
      result.current.updateQuantity(product.id, 5);
    });
    expect(result.current.items[0].quantity).toBe(5);
    expect(result.current.totalItems).toBe(5);
  });

  it("updateQuantity with 0 removes item", () => {
    const { result } = renderCartHook();
    const product = makeProduct();
    act(() => {
      result.current.addItem(product);
      result.current.updateQuantity(product.id, 0);
    });
    expect(result.current.items).toHaveLength(0);
  });

  it("clearCart empties all items", () => {
    const { result } = renderCartHook();
    const p1 = makeProduct({ id: "p1", name: "Product 1" });
    const p2 = makeProduct({ id: "p2", name: "Product 2" });
    act(() => {
      result.current.addItem(p1, 2);
      result.current.addItem(p2, 3);
      result.current.clearCart();
    });
    expect(result.current.items).toHaveLength(0);
    expect(result.current.totalItems).toBe(0);
    expect(result.current.totalAmount).toBe(0);
  });

  it("totalAmount is sum of price × quantity", () => {
    const { result } = renderCartHook();
    // price = "500.00", qty = 2 → 1000
    const product = makeProduct({ price: "500.00" });
    act(() => {
      result.current.addItem(product, 2);
    });
    expect(result.current.totalAmount).toBeCloseTo(1000);
  });

  it("totalAmount handles multiple products", () => {
    const { result } = renderCartHook();
    const p1 = makeProduct({ id: "p1", price: "200.00" });
    const p2 = makeProduct({ id: "p2", price: "300.00" });
    act(() => {
      result.current.addItem(p1, 1); // 200
      result.current.addItem(p2, 2); // 600
    });
    expect(result.current.totalAmount).toBeCloseTo(800);
  });

  it("persists cart to localStorage on add", () => {
    const { result } = renderCartHook();
    const product = makeProduct();
    act(() => {
      result.current.addItem(product, 3);
    });
    const stored = JSON.parse(localStorage.getItem("agrovet_cart") ?? "[]");
    expect(stored).toHaveLength(1);
    expect(stored[0].quantity).toBe(3);
  });

  it("totalItems sums all quantities", () => {
    const { result } = renderCartHook();
    const p1 = makeProduct({ id: "a" });
    const p2 = makeProduct({ id: "b" });
    act(() => {
      result.current.addItem(p1, 3);
      result.current.addItem(p2, 4);
    });
    expect(result.current.totalItems).toBe(7);
  });
});
