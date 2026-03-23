/**
 * Format a number as Kenyan Shillings.
 * e.g. 8500 → "KES 8,500" or "8,500"
 */
export function formatKES(amount: number | string, includePrefix = true): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num)) return includePrefix ? "KES 0" : "0";
  const formatted = num.toLocaleString("en-KE", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  return includePrefix ? `KES ${formatted}` : formatted;
}

/**
 * Parse a Django DecimalField string to a JS number.
 * e.g. "8500.00" → 8500
 */
export function parseDecimal(value: string | number): number {
  if (typeof value === "number") return value;
  return parseFloat(value) || 0;
}
