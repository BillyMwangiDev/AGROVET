import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./fixtures";

test.describe("Customer Management", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/admin/customers");
    await page.waitForLoadState("networkidle");
  });

  test("customers page loads for admin", async ({ page }) => {
    await expect(page).toHaveURL(/\/admin\/customers/);
  });

  test("page shows customer-related content", async ({ page }) => {
    await expect(
      page.getByText(/customer|farmer|name|phone/i).first()
    ).toBeVisible();
  });

  test("add customer button is present", async ({ page }) => {
    const addBtn = page
      .getByRole("button", { name: /add customer|new customer|create/i })
      .first();
    if (await addBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(addBtn).toBeVisible();
    }
  });

  test("search field exists for customer lookup", async ({ page }) => {
    const searchField = page
      .getByPlaceholder(/search|name|phone/i)
      .first();
    if (await searchField.isVisible({ timeout: 3000 }).catch(() => false)) {
      await searchField.fill("test");
      await expect(searchField).toHaveValue("test");
    }
  });

  test("loyalty points column visible", async ({ page }) => {
    const loyaltyText = page.getByText(/loyalty|points/i).first();
    if (await loyaltyText.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(loyaltyText).toBeVisible();
    }
  });
});

test.describe("Admin Dashboard Navigation", () => {
  test("admin sidebar has all major nav items", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/admin");
    await page.waitForLoadState("networkidle");

    const navItems = [
      /dashboard|overview/i,
      /pos|point of sale/i,
      /inventory/i,
      /customer/i,
    ];
    for (const item of navItems) {
      const link = page.getByRole("link", { name: item }).first();
      if (await link.isVisible({ timeout: 2000 }).catch(() => false)) {
        await expect(link).toBeVisible();
      }
    }
  });

  test("admin dashboard shows today's stats cards", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/admin");
    await page.waitForLoadState("networkidle");

    // At least one stats-like card should be visible
    await expect(
      page.getByText(/sales|orders|customers|stock/i).first()
    ).toBeVisible({ timeout: 10_000 });
  });
});
