// Browser checks for the public site: every page loads, has no console errors, and passes an axe accessibility scan.
// Usage: npm run test:ux   (starts its own dev server)
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import fs from "node:fs";
import { createRequire } from "node:module";
import { chromium } from "playwright-core";

const axeSource = fs.readFileSync(createRequire(import.meta.url).resolve("axe-core/axe.min.js"), "utf8");
const PORT = 3355;
const server = spawn("node", ["node_modules/next/dist/bin/next", "dev", "-p", String(PORT)], { env: { ...process.env, NODE_ENV: "development" }, stdio: ["ignore", "pipe", "pipe"] });
let log = "";
server.stdout.on("data", (d) => (log += d));
server.stderr.on("data", (d) => (log += d));
for (let i = 0; i < 60 && !/Ready in/.test(log); i++) await new Promise((r) => setTimeout(r, 500));
assert.match(log, /Ready in/);
const base = `http://localhost:${PORT}`;
const browser = await chromium.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: true });
let pass = 0;

async function scan(page, name) {
  await page.addStyleTag({ content: "*,*::before,*::after{animation:none!important;transition:none!important} .reveal{opacity:1!important;transform:none!important}" });
  await page.addScriptTag({ content: axeSource });
  const res = await page.evaluate(async () => await window.axe.run(document, { runOnly: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"] }));
  const bad = res.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
  assert.deepEqual(bad.map((v) => `${v.id}: ${v.help} (${v.nodes.length}) e.g. ${v.nodes[0]?.html.slice(0, 120)}`), [], `${name}: accessibility problems`);
}

try {
  const page = await (await browser.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
  page.setDefaultTimeout(60000);
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));

  for (const path of ["/", "/data-exporter", "/pricing", "/docs", "/docs/getting-started", "/privacy", "/terms", "/security", "/about", "/changelog", "/refunds", "/cookies", "/dpa", "/contact", "/support"]) {
    const r = await page.goto(base + path, { waitUntil: "networkidle" });
    assert.equal(r.status(), 200, path);
    await scan(page, path);
    console.log("ok  ", `${path} loads and passes the accessibility scan`);
    pass++;
  }

  const nf = await page.goto(`${base}/this-page-does-not-exist`, { waitUntil: "networkidle" });
  assert.equal(nf.status(), 404);
  await scan(page, "404");
  console.log("ok  ", "404 page passes the accessibility scan");
  pass++;

  // Old product routes redirect to the home page.
  const old = await page.goto(`${base}/apps/qr`, { waitUntil: "networkidle" });
  assert.ok(new URL(page.url()).pathname === "/data-exporter" && old.status() === 200);
  console.log("ok  ", "old /apps/qr redirects to the app page");
  pass++;

  assert.deepEqual(errors, [], "no page errors");
  console.log(`\n${pass} checks passed`);
} finally {
  await browser.close();
  server.kill();
}
