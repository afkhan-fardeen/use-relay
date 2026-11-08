// QR engine tests. The important one: every code we generate is decoded back by a real QR decoder.
// Usage: npm run test:qr
import assert from "node:assert/strict";
import jsQR from "jsqr";
const { buildContent, normalizeUrl, safeDestination, validateSlug, randomSlug, QR_KINDS } = await import("../src/lib/qr/payload.ts");
const { qrRaster, qrSvg, qrLayout, contrastRatio, isInverted, DEFAULT_STYLE, isHexColor, isLogoDataUrl } = await import("../src/lib/qr/render.ts");

let pass = 0;
const ok = (n) => { pass++; console.log("ok  ", n); };
const decode = (content, style, scale = 8) => {
  const { data, width, height } = qrRaster(content, style, scale);
  return jsQR(data, width, height, { inversionAttempts: "dontInvert" })?.data;
};

// ───── 1. every kind builds the right content and it scans back exactly ─────
const samples = {
  url: [{ url: "example.com/shop?x=1&y=2" }, "https://example.com/shop?x=1&y=2"],
  text: [{ text: "Hello, wörld! 你好 ✓" }, "Hello, wörld! 你好 ✓"],
  wifi: [{ ssid: 'Cafe; "Blue"', password: "pa:ss,word\\1", security: "WPA", hidden: "false" }, 'WIFI:T:WPA;S:Cafe\\; \\"Blue\\";P:pa\\:ss\\,word\\\\1;H:false;;'],
  vcard: [{ firstName: "Ana", lastName: "Silva", org: "Northwind, Ltd", phone: "+44 7700 900123", email: "ana@example.com", website: "example.com" }, null],
  email: [{ to: "hi@example.com", subject: "Order #12 & more", body: "Hello there" }, "mailto:hi@example.com?subject=Order%20%2312%20%26%20more&body=Hello%20there"],
  sms: [{ number: "+44 7700 900123", message: "Hi" }, "SMSTO:+447700900123:Hi"],
  phone: [{ number: "+44 (0)20 7946 0958" }, "tel:+4402079460958"],
};
for (const k of QR_KINDS) {
  const [fields, expected] = samples[k.kind];
  const b = buildContent(k.kind, fields);
  assert.ok(b.ok, `${k.kind}: ${b.error}`);
  if (expected) assert.equal(b.content, expected, k.kind);
  assert.equal(decode(b.content, DEFAULT_STYLE), b.content, `${k.kind} did not scan back`);
}
ok("all 7 kinds (link, text, Wi-Fi, contact card, email, SMS, phone) build correctly and scan back exactly");

// vCard content shape
{
  const v = buildContent("vcard", samples.vcard[0]).content;
  assert.match(v, /^BEGIN:VCARD\r\nVERSION:3\.0\r\nN:Silva;Ana;;;\r\nFN:Ana Silva\r\nORG:Northwind\\, Ltd\r\nTEL;TYPE=CELL:\+44 7700 900123\r\nEMAIL:ana@example\.com\r\nURL:https:\/\/example\.com\/\r\nEND:VCARD$/);
}
ok("contact card is valid vCard 3.0 with special characters escaped");

// ───── 2. styles still scan ─────
const url = "https://useklyroo.com/r/abc2345";
const styles = [
  { ...DEFAULT_STYLE, shape: "rounded" },
  { ...DEFAULT_STYLE, shape: "dots" },
  { fg: "#533AFD", bg: "#FFFFFF", shape: "square" },
  { fg: "#1F2937", bg: "#FDE68A", shape: "rounded" },
  { fg: "#000000", bg: "#FFFFFF", shape: "dots" },
];
for (const s of styles) assert.equal(decode(url, s), url, JSON.stringify(s));
ok("rounded, dotted and coloured styles all scan");

// ───── 3. a logo in the middle still scans (worst case: a solid block) ─────
const logo = "data:image/png;base64,iVBORw0KGgo=";
assert.ok(isLogoDataUrl(logo));
for (const shape of ["square", "rounded", "dots"]) assert.equal(decode(url, { ...DEFAULT_STYLE, shape, logo }, 10), url, `logo ${shape}`);
const longish = "https://example.com/" + "a".repeat(120);
assert.equal(decode(longish, { ...DEFAULT_STYLE, logo }, 10), longish);
ok("codes with a logo scan, even when the logo is drawn as a solid block, and use high error correction");

// ───── 4. the SVG is what we say it is ─────
{
  const svg = qrSvg(url, { ...DEFAULT_STYLE, shape: "dots", logo });
  assert.match(svg, /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" viewBox="0 0 \d+ \d+"/);
  assert.ok(svg.includes("<circle") && svg.includes("<image href=\"data:image/png;base64,"));
  assert.ok(!/<script|onload|javascript:/i.test(svg));
  const L = qrLayout(url, {});
  assert.equal(L.total, L.n + 8);
  // evil colours and logos are ignored, never injected
  const evil = qrSvg(url, { fg: '"><script>alert(1)</script>', bg: "red", shape: "square", logo: 'data:image/svg+xml;base64,PHN2Zz4=" onload="x' });
  assert.ok(!/script|onload|svg\+xml/.test(evil.replace('xmlns="http://www.w3.org/2000/svg"', "")), "unsafe style values never reach the SVG");
  assert.ok(!isHexColor("#12345") && isHexColor("#a1B2c3"));
  assert.ok(!isLogoDataUrl("data:image/svg+xml;base64,AAAA") && !isLogoDataUrl("https://x/y.png"));
}
ok("SVG output is clean: validated colours, only png/jpeg/webp logos, nothing injectable");

// ───── 5. scannability helpers ─────
assert.ok(contrastRatio("#000000", "#FFFFFF") > 20);
assert.ok(contrastRatio("#777777", "#888888") < 1.5);
assert.ok(isInverted({ fg: "#FFFFFF", bg: "#000000", shape: "square" }) && !isInverted(DEFAULT_STYLE));
ok("contrast and inverted-colour checks work");

// ───── 6. validation ─────
assert.deepEqual(normalizeUrl("example.com"), { ok: true, url: "https://example.com/" });
for (const bad of ["", "javascript:alert(1)", "ftp://x.com", "has space.com", "localhost nothing", "data:text/html,hi"]) assert.ok(!normalizeUrl(bad).ok, bad);
assert.ok(!buildContent("wifi", { ssid: "x", security: "WPA", password: "" }).ok);
assert.ok(buildContent("wifi", { ssid: "open", security: "nopass" }).ok);
assert.ok(!buildContent("email", { to: "nope" }).ok);
assert.ok(!buildContent("phone", { number: "12" }).ok);
assert.ok(!buildContent("vcard", {}).ok);
assert.throws(() => qrLayout("x".repeat(3000), {}), "content too long is refused");
ok("bad input is rejected with clear errors (including too much data for a QR code)");

// ───── 7. dynamic-link safety ─────
for (const bad of ["http://127.0.0.1/x", "http://localhost:3000", "http://192.168.1.4", "https://user:pw@example.com", "http://[::1]/", "https://intranet.local/a", "https://useklyroo.com/r/abc"]) assert.ok(!safeDestination(bad, "useklyroo.com").ok, bad);
assert.ok(safeDestination("https://shop.example.com/spring?x=1", "useklyroo.com").ok);
assert.ok(safeDestination("https://useklyroo.com/pricing", "useklyroo.com").ok);
ok("dynamic links refuse private addresses, credentials, non-web schemes and loops");

// ───── 8. slugs ─────
for (const g of ["my-brand", "spring24", "a-b-c"]) assert.ok(validateSlug(g).ok, g);
for (const b of ["ab", "-x-", "UPPER", "has space", "api", "login", "x".repeat(41)]) assert.ok(!validateSlug(b).ok, b);
const s1 = randomSlug(crypto.getRandomValues(new Uint8Array(8)));
assert.match(s1, /^[a-z2-9]{7}$/);
assert.ok(!/[ilo01]/.test(randomSlug(new Uint8Array([0, 1, 2, 3, 4, 5, 6]))));
ok("short link names: valid ones pass; reserved, short, uppercase and spaced names are refused; random ones avoid look-alike characters");

console.log(`\nAll ${pass} QR checks passed.`);
