export interface CartItem {
  name: string;
  quantity: number;
  price: number;
  unit?: string;
}

/**
 * Build a WhatsApp wa.me URL with a pre-filled order message.
 * Phone should be in international format without '+', e.g. "254740368581".
 */
export function buildWhatsAppCheckoutURL(cart: CartItem[], phone: string): string {
  const itemLines = cart
    .map(
      (item) =>
        `• ${item.name} - Qty: ${item.quantity} - KSh ${(item.price * item.quantity).toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    )
    .join("\n");

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const message = [
    "Hello! I would like to place an order from Nicmah Agrovet:",
    "",
    itemLines,
    "",
    `Total Items: ${totalItems}`,
    `Total Amount: KSh ${totalAmount.toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    "",
    "Please confirm my order and arrange delivery. Thank you!",
  ].join("\n");

  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

/**
 * Simple WhatsApp link without cart (for direct contact).
 */
export function buildWhatsAppContactURL(phone: string, message?: string): string {
  const text = message ?? "Hello Nicmah Agrovet, I need assistance.";
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}
