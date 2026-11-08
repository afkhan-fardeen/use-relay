// Renders the six Instagram carousel images (1080x1350) to ../social/. Usage: node scripts/social-posts.mjs
import fs from "node:fs";
import { chromium } from "playwright-core";

const OUT = new URL("../../social/", import.meta.url).pathname;
fs.mkdirSync(OUT, { recursive: true });
const art = (n) => fs.readFileSync(new URL(`../public/brand/${n}.svg`, import.meta.url), "utf8").replace(/ width="\d+" height="\d+"/, "");

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
  page(`body{background:linear-gradient(160deg,#FFFFFF 40%,#E6F7F5);padding:80px}
  h1{font-size:118px;margin-top:130px}h1 b{font-weight:300;color:${C.teal}}
  p.s{font-size:44px;line-height:1.35;color:${C.muted};margin-top:44px;max-width:880px}
  .row{position:absolute;left:80px;right:80px;bottom:190px;display:flex;gap:20px}
  .chip{flex:1;border:2px solid ${C.line};border-radius:28px;padding:30px 20px;background:#fff;text-align:center;font-size:32px}.chip b{display:block;font-weight:300;font-size:56px;color:${C.navy};margin-bottom:6px}`,
  `<div class="logo">${art("klyroo-export")}</div><div class="pill" style="margin-top:70px">For Shopify stores</div>
   <h1>Shopify data,<br><b>ready in minutes.</b></h1>
   <p class="s">Products, orders, customers, inventory and collections as clean spreadsheets.</p>
   <div class="row"><div class="chip"><b>5</b>data types</div><div class="chip"><b>CSV</b>Excel-ready</div><div class="chip"><b>Free</b>to start</div></div>${foot(1)}`),

  // 2. Preview table
  page(`body{background:#fff;padding:80px}
  h1{font-size:104px;margin-top:50px}h1 b{font-weight:300;color:${C.teal}}
  .card{margin-top:44px;border:2px solid ${C.line};border-radius:32px;padding:40px;box-shadow:0 30px 80px rgba(10,37,64,.10)}
  .top{display:flex;justify-content:space-between;align-items:center;font-size:36px}.top small{display:block;font-size:26px;color:${C.muted};margin-top:6px}
  .ok{background:#E8F7EF;color:#137A48;border-radius:999px;padding:10px 24px;font-size:26px}
  table{width:100%;margin-top:30px;border-collapse:collapse;font-size:30px}th{color:${C.muted};font-weight:400;text-align:left;padding:16px 12px;border-bottom:2px solid ${C.line}}td{padding:18px 12px;border-bottom:2px solid ${C.line}}tr:last-child td{border:0}
  .tag{margin-top:34px;font-size:34px;color:${C.muted};line-height:1.4}`,
  `<div class="logo">${art("klyroo-export")}</div>
   <h1>See your rows<br><b>before you export.</b></h1>
   <div class="card"><div class="top"><div>Orders for 3PL<small>Live preview from your store</small></div><span class="ok">Ready to export</span></div>
   <table><tr>${["Order", "Ship to", "City", "SKU", "Qty"].map((h) => `<th>${h}</th>`).join("")}</tr>${rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`).join("")}</table></div>
   <p class="tag">A real preview from your store, so the file is right the first time.</p>${foot(2)}`),

  // 3. Templates
  page(`body{background:#fff;padding:80px}
  h1{font-size:100px;margin-top:60px}h1 b{font-weight:300;color:${C.teal}}
  .grid{display:grid;grid-template-columns:1fr 1fr;gap:26px;margin-top:60px}
  .t{border:2px solid ${C.line};border-radius:28px;padding:34px;font-size:36px;line-height:1.25}.t small{display:block;margin-top:10px;font-size:27px;color:${C.muted}}
  .t i{display:block;width:16px;height:16px;border-radius:50%;background:${C.teal};margin-bottom:22px}`,
  `<div class="logo">${art("klyroo-export")}</div>
   <h1>Ready-made<br><b>templates.</b></h1>
   <div class="grid"><div class="t"><i></i>Orders for your 3PL<small>Line items and shipping addresses</small></div><div class="t"><i></i>Full product catalog<small>Variants, prices, SKUs, images</small></div><div class="t"><i></i>Inventory by location<small>Quantities per warehouse</small></div><div class="t"><i></i>Customer list<small>Contacts and order history</small></div></div>${foot(3)}`),

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

  // 5. Safe
  page(`body{background:linear-gradient(160deg,#FFFFFF 45%,#E6F7F5);padding:80px}
  h1{font-size:100px;margin-top:60px}h1 b{font-weight:300;color:${C.teal}}
  .list{margin-top:60px;display:grid;gap:26px}
  .r{border:2px solid ${C.line};background:#fff;border-radius:28px;padding:34px 38px;font-size:38px;line-height:1.3}.r b{font-weight:400;display:block;margin-bottom:6px}.r span{color:${C.muted};font-size:32px}`,
  `<div class="logo">${art("klyroo-export")}</div>
   <h1>Safe by<br><b>design.</b></h1>
   <div class="list"><div class="r"><b>Read-only access</b><span>Credentials you create in your own Shopify account. Revoke any time.</span></div>
   <div class="r"><b>Encrypted credentials</b><span>Your Shopify secret is encrypted before it is stored.</span></div>
   <div class="r"><b>Private files, deleted after 7 days</b><span>Only you can download them.</span></div></div>${foot(5)}`),

  // 6. CTA
  page(`body{background:linear-gradient(160deg,#6B55FF,${C.violet} 55%,#2F1FB5);color:#fff;padding:80px}
  .logo svg path{fill:#fff}.logo svg circle:nth-child(1){fill:#fff}
  h1{font-size:112px;margin-top:60px}
  p.s{font-size:42px;line-height:1.35;color:#DAD6FF;margin-top:32px}
  .plans{display:flex;gap:20px;margin-top:48px}.p{flex:1;background:rgba(255,255,255,.12);border:2px solid rgba(255,255,255,.28);border-radius:28px;padding:30px;font-size:32px}.p b{display:block;font-size:56px;font-weight:300;margin-top:8px}
  .btn{display:inline-block;margin-top:44px;background:#fff;color:${C.violet};border-radius:20px;padding:30px 56px;font-size:44px}
  .foot{color:#DAD6FF}.dots i{background:rgba(255,255,255,.35)}.dots i.on{background:#fff}`,
  `<div class="logo">${art("klyroo")}</div>
   <h1>Start free.<br>Upgrade when<br>you need to.</h1>
   <p class="s">Every paid plan starts with a 3-day free trial. Cancel any time.</p>
   <div class="plans"><div class="p">Starter<b>£19</b></div><div class="p">Growth<b>£49</b></div><div class="p">Scale<b>£99</b></div></div>
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
