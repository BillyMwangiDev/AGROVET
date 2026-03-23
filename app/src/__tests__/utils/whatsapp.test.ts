import { describe, it, expect } from "vitest";
import { buildWhatsAppCheckoutURL, buildWhatsAppContactURL } from "@/utils/whatsapp";
import type { CartItem } from "@/utils/whatsapp";

const PHONE = "254740368581";

const sampleCart: CartItem[] = [
  { name: "Dairy Meal 50kg", quantity: 2, price: 800, unit: "bag" },
  { name: "Friesian Semen", quantity: 1, price: 2000 },
];

describe("buildWhatsAppCheckoutURL", () => {
  it("builds a valid wa.me URL", () => {
    const url = buildWhatsAppCheckoutURL(sampleCart, PHONE);
    expect(url).toMatch(/^https:\/\/wa\.me\//);
  });

  it("includes the phone number in the URL", () => {
    const url = buildWhatsAppCheckoutURL(sampleCart, PHONE);
    expect(url).toContain(PHONE);
  });

  it("includes encoded product names", () => {
    const url = buildWhatsAppCheckoutURL(sampleCart, PHONE);
    expect(url).toContain(encodeURIComponent("Dairy Meal 50kg").slice(0, 5));
  });

  it("includes total amount in message", () => {
    const url = buildWhatsAppCheckoutURL(sampleCart, PHONE);
    // totalAmount = 2*800 + 1*2000 = 3600; URL is encoded so decode first
    expect(decodeURIComponent(url)).toContain("3,600");
  });

  it("includes total items count", () => {
    const url = buildWhatsAppCheckoutURL(sampleCart, PHONE);
    // totalItems = 2 + 1 = 3
    expect(decodeURIComponent(url)).toContain("Total Items: 3");
  });

  it("handles empty cart", () => {
    const url = buildWhatsAppCheckoutURL([], PHONE);
    expect(url).toMatch(/^https:\/\/wa\.me\//);
    expect(decodeURIComponent(url)).toContain("Total Amount: KSh 0.00");
  });

  it("handles single item cart", () => {
    const cart: CartItem[] = [{ name: "Maize", quantity: 5, price: 200 }];
    const url = buildWhatsAppCheckoutURL(cart, PHONE);
    expect(decodeURIComponent(url)).toContain("Total Items: 5");
    // total = 5 * 200 = 1000
    expect(decodeURIComponent(url)).toContain("1,000.00");
  });
});

describe("buildWhatsAppContactURL", () => {
  it("builds a contact URL with default message", () => {
    const url = buildWhatsAppContactURL(PHONE);
    expect(url).toContain(PHONE);
    expect(url).toContain("Nicmah");
  });

  it("builds a contact URL with custom message", () => {
    const url = buildWhatsAppContactURL(PHONE, "I need help with my order");
    expect(decodeURIComponent(url)).toContain("I need help with my order");
  });
});
