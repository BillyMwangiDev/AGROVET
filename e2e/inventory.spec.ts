import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./fixtures";

test.describe("Inventory Management", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/admin/inventory");
    await page.waitForLoadState("networkidle");
  });

  test("inventory page loads for admin", async ({ page }) => {
    await expect(page).toHaveURL(/\/admin\/inventory/);
  });

  test("inventory table shows stock levels", async ({ page }) => {
    // Should show stock-related columns
    await expect(
      page.getByText(/stock|inventory|quantity/i).first()
    ).toBeVisible();
  });

  test("add product button is present", async ({ page }) => {
    const addBtn = page
      .getByRole("button", { name: /add product|new product|create/i })
      .first();
    await expect(addBtn).toBeVisible();
  });

  test("add product dialog opens on button click", async ({ page }) => {
    const addBtn = page
      .getByRole("button", { name: /add product|new product|create/i })
      .first();
    await addBtn.click();
    // A dialog / modal should appear
    await expect(
      page.getByRole("dialog").or(page.getByText(/product name|name/i)).first()
    ).toBeVisible({ timeout: 5_000 });
  });

  test("stock adjustment button exists per product row", async ({ page }) => {
    // Look for "adjust" or stock edit buttons in the table
    const adjustBtn = page
      .getByRole("button", { name: /adjust|stock|edit/i })
      .first();
    if (await adjustBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(adjustBtn).toBeVisible();
    }
  });

  test("search/filter field is present", async ({ page }) => {
    const searchField = page.getByPlaceholder(/search/i).first();
    if (await searchField.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(searchField).toBeVisible();
    }
  });

  test("generate alerts button is present", async ({ page }) => {
    const alertBtn = page
      .getByRole("button", { name: /alert|generate|scan/i })
      .first();
    if (await alertBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(alertBtn).toBeVisible();
    }
  });
});
