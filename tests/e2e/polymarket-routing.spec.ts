import { expect, test } from "@playwright/test";

test("polymarket feed route loads", async ({ page }) => {
  await page.goto("/zh/polymarket");
  await expect(page.getByRole("searchbox", { name: "搜尋市場" }).first()).toBeVisible();
  await expect(page.getByRole("article").first()).toBeVisible();
});

test("portfolio route loads disconnected state", async ({ page }) => {
  await page.goto("/zh/portfolio");
  await expect(page.getByText("連接錢包").first()).toBeVisible();
  await expect(
    page.getByText("未連接錢包，因此不顯示餘額、持倉、成交或掛單。")
  ).toBeVisible();
});
