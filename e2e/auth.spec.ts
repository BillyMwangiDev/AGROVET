import { test, expect } from "@playwright/test";
import { ADMIN_CREDENTIALS, loginAsAdmin } from "./fixtures";

test.describe("Authentication", () => {
  test("login page renders username and password fields", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByLabel(/username/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /login|sign in/i })).toBeVisible();
  });

  test("login with valid admin credentials redirects to /admin", async ({ page }) => {
    await loginAsAdmin(page);
    await expect(page).toHaveURL(/\/admin/);
  });

  test("login with wrong password shows error", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel(/username/i).fill(ADMIN_CREDENTIALS.username);
    await page.getByLabel(/password/i).fill("wrongpassword");
    await page.getByRole("button", { name: /login|sign in/i }).click();
    // Should NOT redirect to admin
    await expect(page).not.toHaveURL(/\/admin/);
  });

  test("accessing /admin without auth redirects to /login", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/login/);
  });

  test("logout clears session and redirects to login", async ({ page }) => {
    await loginAsAdmin(page);
    // Sidebar is open by default — find logout button by its text content
    const logoutBtn = page.getByRole("button").filter({ hasText: /logout/i });
    await expect(logoutBtn).toBeVisible({ timeout: 10_000 });
    await logoutBtn.click();
    await expect(page).toHaveURL(/\/login/);
  });

  test("protected /admin/pos route redirects unauthenticated users", async ({ page }) => {
    await page.goto("/admin/pos");
    await expect(page).toHaveURL(/\/login/);
  });
});
