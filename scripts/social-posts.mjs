// Renders the six Instagram carousel images (1080x1350) to ../social/. Usage: node scripts/social-posts.mjs
import fs from "node:fs";
import { chromium } from "playwright-core";
import { qrSvg } from "../src/lib/qr/render.ts";

const OUT = new URL("../../social/", import.meta.url).pathname;
fs.mkdirSync(OUT, { recursive: true });
const art = (n) => fs.readFileSync(new URL(`../public/brand/${n}.svg`, import.meta.url), "utf8").replace(/ width="\d+" height="\d+"/, "");
const qr = (content, fg, shape = "rounded") => qrSvg(content, { fg, bg: "#FFFFFF", shape, logo: null });

const C = { violet: "#533AFD", navy: "#0A2540", teal: "#00A99D", pink: "#E5398B", wash: "#F6F9FC", line: "#E3E8EE", muted: "#627A96", soft: "#B9B9F9" };
const base = `
*{box-sizing:border-box;margin:0}
body{width:1080px;height:1350px;font-family:-apple-system,BlinkMacSystemFont,"SF Pro Display","Helvetica Neue",Arial,sans-serif;color:${C.navy};overflow:hidden;position:relative}
.logo{height:92px}.logo svg{height:92px;width:auto;display:block}
.foot{position:absolute;left:80px;right:80px;bottom:64px;display:flex;justify-content:space-between;align-items:center;font-size:30px;color:${C.muted}}
.dots{display:flex;gap:10px}.dots i{width:14px;height:14px;border-radius:50%;background:${C.line}}.dots i.on{background:${C.violet}}
h1{font-weight:300;letter-spacing:-0.03em;line-height:1.04}
.pill{display:inline-block;border:2px solid ${C.soft};background:#EEF0FF;color:#2F1FB5;border-radius:999px;padding:12px 28px;font-size:30px}
`;
const dots = (n) => `<div class="dots">${[1, 2, 3, 4, 5, 6].map((i) => `<i class="${i === n ? "on" : ""}"></i>`).join("")}</div>`;
const foot = (n) => `<div class="foot"><span>useklyroo.com</span>${dots(n)}</div>`;
const page = (css, body) => `<!doctype html><html><head><meta charset="utf-8"><style>${base}${css}</style></head><body>${body}</body></html>`;

const rows = [["#10420", "Maya Reyes", "Austin, US", "LEG-BL-M", "1"], ["#10421", "Jo Okafor", "Leeds, GB", "JAC-SA-L", "2"], ["#10422", "Dee Lindqvist", "Lyon, FR", "TEE-OL-S", "1"], ["#10423", "Lena Patel", "Toronto, CA", "BOT-SL-XS", "3"]];

const posts = [
  // 1. Intro
  page(`body{background:linear-gradient(160deg,#FFFFFF 40%,#EEF0FF);padding:80px}
  h1{font-size:122px;margin-top:150px}h1 b{font-weight:300;color:${C.violet}}
  p.s{font-size:44px;line-height:1.35;color:${C.muted};margin-top:44px;max-width:860px}
  .row{position:absolute;left:80px;right:80px;bottom:190px;display:flex;gap:28px}
  .chip{flex:1;border:2px solid ${C.line};border-radius:28px;padding:34px;background:#fff;display:flex;align-items:center;gap:26px;font-size:36px}
  .chip svg{width:84px;height:84px;flex:none}`,
  `<div class="logo">${art("klyroo")}</div><div class="pill" style="margin-top:70px">Small, sharp tools for commerce teams</div>
   <h1>Two focused apps.<br><b>One account.</b></h1>
   <p class="s">Shopify data exports and QR codes, without the busywork.</p>
   <div class="row"><div class="chip">${art("klyroo-export-icon")}<span>Klyroo<br>Export</span></div><div class="chip">${art("klyroo-qr-icon")}<span>Klyroo<br>QR</span></div></div>${foot(1)}`),

  // 2. Export
  page(`body{background:#fff;padding:80px}
  h1{font-size:104px;margin-top:50px}h1 b{font-weight:300;color:${C.teal}}
  .card{margin-top:44px;border:2px solid ${C.line};border-radius:32px;padding:40px;box-shadow:0 30px 80px rgba(10,37,64,.10)}
  .top{display:flex;justify-content:space-between;align-items:center;font-size:36px}.top small{display:block;font-size:26px;color:${C.muted};margin-top:6px}
  .ok{background:#E8F7EF;color:#137A48;border-radius:999px;padding:10px 24px;font-size:26px}
  table{width:100%;margin-top:30px;border-collapse:collapse;font-size:30px}th{color:${C.muted};font-weight:400;text-align:left;padding:16px 12px;border-bottom:2px solid ${C.line}}td{padding:18px 12px;border-bottom:2px solid ${C.line}}tr:last-child td{border:0}
  .tag{margin-top:34px;font-size:34px;color:${C.muted};line-height:1.4}`,
  `<div class="logo">${art("klyroo-export")}</div>
   <h1>Shopify data,<br><b>as clean spreadsheets.</b></h1>
   <div class="card"><div class="top"><div>Orders for 3PL<small>Live preview from your store</small></div><span class="ok">Ready to export</span></div>
   <table><tr>${["Order", "Ship to", "City", "SKU", "Qty"].map((h) => `<th>${h}</th>`).join("")}</tr>${rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`).join("")}</table></div>
   <p class="tag">Products, orders, customers, inventory and collections. Read-only access, CSV in minutes.</p>${foot(2)}`),

  // 3. QR
  page(`body{background:linear-gradient(160deg,#FFFFFF 45%,#FDEBF3);padding:80px}
  h1{font-size:104px;margin-top:70px}h1 b{font-weight:300;color:${C.pink}}
  .grid{display:grid;grid-template-columns:1fr 1fr;gap:28px;margin-top:48px}
  .q{background:#fff;border:2px solid ${C.line};border-radius:32px;padding:22px 22px 16px;text-align:center;font-size:28px;color:${C.muted}}
  .q svg{width:270px;height:270px;display:block;margin:0 auto 8px}`,
  `<div class="logo">${art("klyroo-qr")}</div>
   <h1>QR codes you can<br><b>print, change and track.</b></h1>
   <div class="grid"><div class="q">${qr("https://useklyroo.com", C.violet)}Link</div><div class="q">${qr("WIFI:T:WPA;S:Cafe Blue;P:welcome2024;H:false;;", C.navy, "dots")}Wi-Fi</div><div class="q">${qr("mailto:hello@useklyroo.com", "#137A48")}Email</div><div class="q">${qr("BEGIN:VCARD\nVERSION:3.0\nFN:Klyroo\nEND:VCARD", "#B54708")}Contact card</div></div>${foot(3)}`),

  // 4. Why Export
  page(`body{background:${C.navy};color:#fff;padding:80px}
  .logo svg path{fill:#fff}
  h1{font-size:98px;margin-top:70px}h1 b{font-weight:300;color:#7DE3DA}
  ul{list-style:none;padding:0;margin-top:64px}li{display:flex;gap:28px;align-items:flex-start;font-size:42px;line-height:1.3;margin-bottom:38px}
  li i{flex:none;width:56px;height:56px;border-radius:50%;background:${C.teal};display:grid;place-items:center;font-style:normal;font-size:34px;margin-top:2px}
  li span{color:#C9D6E6}li b{font-weight:400;color:#fff}
  .cta{position:absolute;left:80px;bottom:150px;font-size:36px;color:#7DE3DA}`,
  `<div class="logo">${art("klyroo-export")}</div>
   <h1>Built for the<br><b>people who run ops.</b></h1>
   <ul><li><i>✓</i><span><b>Pick the columns</b> you need, rename them, reorder them</span></li>
   <li><i>✓</i><span><b>Filter</b> by status, tag and date before you export</span></li>
   <li><i>✓</i><span><b>Excel-ready</b> CSV that keeps accents and symbols intact</span></li>
   <li><i>✓</i><span><b>Read-only.</b> Nothing in your store is ever changed</span></li></ul><div class="cta">Free plan for 1 store. Start at useklyroo.com</div>${foot(4)}`),

  // 5. Dynamic QR
  page(`body{background:#fff;padding:80px}
  h1{font-size:98px;margin-top:70px}h1 b{font-weight:300;color:${C.pink}}
  .flow{display:flex;align-items:center;gap:30px;margin-top:70px}
  .q{width:330px;flex:none;border:2px solid ${C.line};border-radius:32px;padding:26px;box-shadow:0 30px 80px rgba(10,37,64,.10)}.q svg{width:100%;height:auto;display:block}
  .arrow{font-size:70px;color:${C.violet}}
  .dest{flex:1;display:grid;gap:22px}.d{border:2px solid ${C.line};border-radius:24px;padding:26px 30px;font-size:32px}.d small{display:block;color:${C.muted};font-size:24px;margin-bottom:6px}
  .d.new{border-color:${C.violet};background:#EEF0FF}
  .note{margin-top:64px;font-size:38px;line-height:1.4;color:${C.muted}}.note b{color:${C.navy};font-weight:400}`,
  `<div class="logo">${art("klyroo-qr")}</div>
   <h1>Printed it already?<br><b>Change where it goes.</b></h1>
   <div class="flow"><div class="q">${qr("https://useklyroo.com/r/spring-sale", C.violet)}</div><div class="arrow">→</div>
   <div class="dest"><div class="d"><small>Before</small>shop.example.com/spring</div><div class="d new"><small>Now</small>shop.example.com/summer</div></div></div>
   <p class="note"><b>Dynamic links</b> point your code at a short link. Edit the destination any time and see scans, devices and countries. No cookies, no IP addresses stored.</p>${foot(5)}`),

  // 6. CTA
  page(`body{background:linear-gradient(160deg,#6B55FF,${C.violet} 55%,#2F1FB5);color:#fff;padding:80px}
  .logo svg path{fill:#fff}.logo svg circle:nth-child(1){fill:#fff}
  h1{font-size:112px;margin-top:60px}
  p.s{font-size:42px;line-height:1.35;color:#DAD6FF;margin-top:32px}
  .plans{display:flex;gap:28px;margin-top:48px}.p{flex:1;background:rgba(255,255,255,.12);border:2px solid rgba(255,255,255,.28);border-radius:28px;padding:34px;font-size:34px}.p b{display:block;font-size:64px;font-weight:300;margin-top:10px}.p small{font-size:28px;color:#DAD6FF}
  .btn{display:inline-block;margin-top:44px;background:#fff;color:${C.violet};border-radius:20px;padding:30px 56px;font-size:44px}
  .foot{color:#DAD6FF}.dots i{background:rgba(255,255,255,.35)}.dots i.on{background:#fff}`,
  `<div class="logo">${art("klyroo")}</div>
   <h1>Start free.<br>Upgrade when<br>you need to.</h1>
   <p class="s">Every paid plan starts with a 3-day free trial. Cancel any time.</p>
   <div class="plans"><div class="p">Klyroo Export<b>from £19</b><small>per month</small></div><div class="p">Klyroo QR<b>from £20</b><small>per month</small></div></div>
   <div class="btn">useklyroo.com</div>${foot(6)}`),
];

const browser = await chromium.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: true });
const page1 = await (await browser.newContext({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 1 })).newPage();
for (const [i, html] of posts.entries()) {
  await page1.setContent(html, { waitUntil: "load" });
  const file = `${OUT}klyroo-post-${i + 1}.png`;
  await page1.screenshot({ path: file });
  console.log("wrote", file);
}
await browser.close();
