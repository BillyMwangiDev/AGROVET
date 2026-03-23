import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./fixtures";

test.describe("POS Terminal", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/admin/pos");
    await page.waitForLoadState("networkidle");
  });

  test("POS terminal page loads for admin", async ({ page }) => {
    await expect(page).toHaveURL(/\/admin\/pos/);
    // Should have a product search area
    await expect(
      page.getByPlaceholder(/search|barcode|product/i).first()
        .or(page.getByRole("searchbox").first())
    ).toBeVisible({ timeout: 10_000 });
  });

  test("product search input is present and interactive", async ({ page }) => {
    const searchInput = page
      .getByPlaceholder(/search|barcode|product/i)
      .or(page.getByRole("searchbox"))
      .first();
    await expect(searchInput).toBeVisible();
    await searchInput.fill("feeds");
    // Just verify input accepts text
    await expect(searchInput).toHaveValue("feeds");
  });

  test("cart area is visible", async ({ page }) => {
    // Cart / order summary panel should be present on POS
    await expect(
      page.getByText(/cart|order|items|total/i).first()
    ).toBeVisible();
  });

  test("payment method selector is present", async ({ page }) => {
    // Should have cash/mpesa/card options
    await expect(
      page.getByText(/cash|mpesa|payment/i).first()
    ).toBeVisible();
  });

  test("payment buttons are visible in checkout summary", async ({ page }) => {
    // The POS right panel shows Cash, M-Pesa and Card payment buttons
    const cashBtn = page.getByRole("button", { name: "Cash" });
    await expect(cashBtn).toBeVisible({ timeout: 8_000 });
  });
});
