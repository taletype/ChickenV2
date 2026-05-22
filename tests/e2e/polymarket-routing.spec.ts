import { expect, test } from "@playwright/test";

test("polymarket feed route loads", async ({ page }) => {
  await page.goto("/zh/polymarket");
  await expect(page.getByRole("textbox", { name: "Search markets" })).toBeVisible();
  await expect(page.getByRole("article").first()).toBeVisible();
});

test("portfolio route loads disconnected state", async ({ page }) => {
  await page.goto("/zh/portfolio");
  await expect(page.getByText("Connect wallet")).toBeVisible();
  await expect(
    page.getByText("No wallet session is active, so balances and positions are not displayed.")
  ).toBeVisible();
});
