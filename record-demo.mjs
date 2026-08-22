import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

const outputDir = "recordings";
await mkdir(outputDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  recordVideo: { dir: outputDir, size: { width: 1440, height: 900 } },
});
const page = await context.newPage();

async function setCaption(text) {
  await page.evaluate((caption) => {
    let banner = document.getElementById("recording-caption");
    if (!banner) {
      banner = document.createElement("div");
      banner.id = "recording-caption";
      banner.style.cssText = [
        "position: fixed",
        "top: 18px",
        "left: 50%",
        "transform: translateX(-50%)",
        "z-index: 9999",
        "padding: 10px 18px",
        "border: 1px solid rgba(129, 140, 248, .5)",
        "border-radius: 999px",
        "background: rgba(10, 14, 30, .94)",
        "color: #f8fafc",
        "font: 600 15px Segoe UI, sans-serif",
        "letter-spacing: .01em",
        "box-shadow: 0 8px 30px rgba(0, 0, 0, .3)",
      ].join(";");
      document.body.appendChild(banner);
    }
    banner.textContent = caption;
  }, text);
}

await page.goto("http://localhost:5173", { waitUntil: "networkidle" });
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: "networkidle" });
await setCaption("LuminaShop | AI shopping concierge");
await page.waitForTimeout(8000);

await setCaption("1. Describe what you need in plain language");
await page.getByRole("button", { name: /premium smartphone/ }).click();
await page.waitForTimeout(42000);

await setCaption("2. Sort by match, price, or savings");
await page.locator("select").selectOption("price");
await page.waitForTimeout(7000);

await setCaption("3. Save favorites and share product photos");
await page.getByRole("button", { name: "Save product" }).first().click();
await page.getByRole("button", { name: "Share product photo" }).first().click();
await page.waitForTimeout(8000);

await setCaption("4. Compare products using clear tie-breakers");
const compareButtons = page.getByRole("button", { name: "Compare product" });
await compareButtons.nth(0).click();
await compareButtons.nth(1).click();
await compareButtons.nth(2).click();
await page.waitForTimeout(12000);

await setCaption("5. Gemini negotiates a protected counteroffer");
await page.getByRole("button", { name: "Negotiate" }).first().click();
await page.waitForTimeout(45000);

await setCaption("6. Accept the approved offer with one click");
const acceptButton = page.getByRole("button", { name: /Accept \$/ }).last();
if (await acceptButton.count()) await acceptButton.click();
await page.waitForTimeout(18000);

await setCaption("7. Review savings and complete secure checkout");
await page.getByRole("button", { name: "Secure Checkout" }).click();
await page.waitForTimeout(50000);
await setCaption("Order ready | secure payment link generated");
await page.waitForTimeout(22000);

await context.close();
await browser.close();
console.log("Recording complete");
