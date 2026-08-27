import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import puppeteer from "puppeteer-core";

const chrome =
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const outDir = path.resolve("review/phase-0a-home");
mkdirSync(outDir, { recursive: true });
writeFileSync(path.join(outDir, "sample.jpg"), Buffer.from([0xff, 0xd8, 0xff, 0xd9]));

const browser = await puppeteer.launch({
  executablePath: chrome,
  headless: "new",
  args: ["--no-sandbox", "--disable-gpu"],
});

async function waitForFeed(page) {
  await page.waitForFunction(
    () => document.body.innerText.includes("פעילות אחרונה"),
    { timeout: 15000 },
  );
}

try {
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true });
  await page.goto("http://localhost:3000/", { waitUntil: "domcontentloaded" });
  await page.evaluate(() => localStorage.removeItem("certify-p0"));
  await page.reload({ waitUntil: "domcontentloaded" });
  await waitForFeed(page);

  await page.screenshot({ path: path.join(outDir, "01-mobile-home.png") });

  await page.evaluate(() => {
    const card = [...document.querySelectorAll("h3")].find((el) =>
      el.textContent?.includes("יפוג בעוד 14"),
    );
    card?.closest("article")?.scrollIntoView({ block: "center" });
  });
  await new Promise((r) => setTimeout(r, 250));
  await page.screenshot({ path: path.join(outDir, "02-mobile-alert-card.png") });

  await page.evaluate(() => window.scrollTo(0, 0));
  await page.evaluate(() => {
    document.querySelector('nav[aria-label="ניווט ראשי"] button')?.click();
  });
  await page.waitForSelector('input[type="file"]');
  const inputs = await page.$$('input[type="file"]');
  await inputs[0].uploadFile(path.join(outDir, "sample.jpg"));
  await page.waitForFunction(
    () =>
      document.body.innerText.includes("מעבדים") &&
      !document.body.innerText.includes("מסמך חדש"),
    { timeout: 8000 },
  );
  await new Promise((r) => setTimeout(r, 200));
  await page.screenshot({ path: path.join(outDir, "03-mobile-processing.png") });

  await page.evaluate(() => {
    [...document.querySelectorAll("button")]
      .find((el) => el.textContent?.includes("מעבדים מסמך"))
      ?.click();
  });
  await page.waitForFunction(
    () => document.body.innerText.includes("עיבוד מסמכים"),
    { timeout: 8000 },
  );
  await new Promise((r) => setTimeout(r, 200));
  await page.screenshot({ path: path.join(outDir, "04-mobile-jobs-sheet.png") });

  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1, isMobile: false });
  await page.goto("http://localhost:3000/", { waitUntil: "domcontentloaded" });
  await waitForFeed(page);
  await page.screenshot({ path: path.join(outDir, "05-desktop-home.png") });

  console.log("saved screenshots to", outDir);
} finally {
  await browser.close();
}
