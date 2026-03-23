import { describe, it, expect } from "vitest";
import { formatKES, parseDecimal } from "@/utils/formatCurrency";

describe("formatKES", () => {
  it("formats a whole number with KES prefix", () => {
    const result = formatKES(1000);
    expect(result).toBe("KES 1,000");
  });

  it("formats zero as KES 0", () => {
    expect(formatKES(0)).toBe("KES 0");
  });

  it("formats large numbers with commas", () => {
    const result = formatKES(8500);
    expect(result).toBe("KES 8,500");
  });

  it("handles string input", () => {
    const result = formatKES("2500.00");
    expect(result).toBe("KES 2,500");
  });

  it("excludes prefix when includePrefix is false", () => {
    const result = formatKES(5000, false);
    expect(result).not.toContain("KES");
    expect(result).toBe("5,000");
  });

  it("returns KES 0 for NaN input", () => {
    const result = formatKES("not-a-number");
    expect(result).toBe("KES 0");
  });

  it("handles decimal amounts", () => {
    const result = formatKES(1234.5);
    expect(result).toContain("1,234");
  });

  it("handles very large numbers", () => {
    const result = formatKES(1000000);
    expect(result).toBe("KES 1,000,000");
  });
});

describe("parseDecimal", () => {
  it("converts a decimal string to number", () => {
    expect(parseDecimal("8500.00")).toBe(8500);
  });

  it("handles a float string", () => {
    expect(parseDecimal("1234.56")).toBeCloseTo(1234.56);
  });

  it("returns number input unchanged", () => {
    expect(parseDecimal(500)).toBe(500);
  });

  it("returns 0 for empty string", () => {
    expect(parseDecimal("")).toBe(0);
  });

  it("returns 0 for non-numeric string", () => {
    expect(parseDecimal("abc")).toBe(0);
  });

  it("handles integer string", () => {
    expect(parseDecimal("100")).toBe(100);
  });
});
