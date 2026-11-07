import { createHmac, createHash } from "node:crypto";
import { allow } from "@/lib/ratelimit";
import { supabaseAdmin } from "@/lib/supabase/admin";

// The public redirect behind every dynamic QR code. One database round trip: find the destination
// and record the scan. No cookies, and no IP address is stored: a "visitor" is a hash that changes daily.

const BOT = /bot|crawl|spider|slurp|preview|facebookexternalhit|whatsapp|slackbot|telegram|discord|headless|curl|wget|python-requests/i;

function device(ua: string): string {
  if (/iphone|ipad|ipod/i.test(ua)) return "ios";
  if (/android/i.test(ua)) return "android";
  if (/windows|macintosh|linux|cros/i.test(ua)) return "desktop";
  return "other";
}

function visitorHash(ip: string, ua: string): string {
  const key = createHmac("sha256", process.env.MASTER_KEY ?? "").update("qr-visitor").digest();
  const day = new Date().toISOString().slice(0, 10); // the hash changes every day, so visitors can't be followed
  return createHash("sha256").update(key).update(`${day}|${ip}|${ua}`).digest("hex").slice(0, 16);
}

function notFound() {
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>QR code not active</title></head>
<body style="font-family:system-ui,sans-serif;color:#0A2540;display:grid;place-items:center;min-height:100vh;margin:0;padding:24px;text-align:center">
<main><h1 style="font-weight:300;font-size:28px;margin:0 0 12px">This QR code isn’t active</h1>
<p style="color:#627A96;margin:0 0 20px">The link may have been turned off or removed by its owner.</p>
<a href="https://useklyroo.com" style="color:#533AFD">Klyroo</a></main></body></html>`;
  return new Response(html, { status: 404, headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } });
}

export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!/^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/.test(slug)) return notFound();

  const ua = req.headers.get("user-agent") ?? "";
  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim();
  const country = (req.headers.get("cf-ipcountry") ?? req.headers.get("x-vercel-ip-country") ?? "").toUpperCase();
  let referrer: string | null = null;
  try {
    const ref = req.headers.get("referer");
    if (ref) referrer = new URL(ref).hostname.replace(/^www\./, "");
  } catch { /* ignore a malformed referrer */ }

  const visitor = visitorHash(ip, ua);
  // The redirect always works, but one visitor can't flood the scan log: past 20 hits a minute on a
  // code we stop recording (a person scanning twice is fine, a script is not).
  const record = !BOT.test(ua) && allow(`scan:${slug}:${visitor}`, 20, 60_000);

  const { data, error } = await supabaseAdmin().rpc("qr_resolve_and_log", {
    p_slug: slug,
    p_log: record,
    p_country: /^[A-Z]{2}$/.test(country) && country !== "XX" ? country : null,
    p_device: device(ua),
    p_referrer: referrer,
    p_visitor: visitor,
  });
  if (error) {
    console.error("qr redirect failed", error.message);
    return new Response("Temporarily unavailable. Please scan again in a moment.", { status: 503, headers: { "retry-after": "5" } });
  }
  if (!data) return notFound();
  return new Response(null, { status: 302, headers: { location: data as string, "cache-control": "no-store", "referrer-policy": "no-referrer" } });
}
