import { Page } from "@playwright/test";

export const ADMIN_CREDENTIALS = {
  username: "admin",
  password: "admin1234",
};

export const BASE_URL = "http://localhost:5173";
export const API_URL = "http://localhost:8000";

/**
 * Log in as admin via the login page and wait for redirect.
 */
export async function loginAsAdmin(page: Page) {
  await page.goto("/login");
  await page.waitForLoadState("networkidle");
  await page.getByLabel(/username/i).fill(ADMIN_CREDENTIALS.username);
  await page.getByLabel(/password/i).fill(ADMIN_CREDENTIALS.password);
  await page.getByRole("button", { name: /sign in/i }).click();
  // Wait for redirect to /admin
  await page.waitForURL(/\/admin/, { timeout: 15_000 });
}
