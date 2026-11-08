// What goes inside a QR code, for each kind of code. Client-safe (used by the designer and the server).

export type QrKind = "url" | "text" | "wifi" | "vcard" | "email" | "sms" | "phone";

export type FieldDef = {
  key: string;
  label: string;
  placeholder?: string;
  required?: boolean;
  multiline?: boolean;
  options?: { value: string; label: string }[];
};

export const QR_KINDS: { kind: QrKind; label: string; hint: string; fields: FieldDef[] }[] = [
  { kind: "url", label: "Link", hint: "Opens a web page", fields: [{ key: "url", label: "Web address", placeholder: "https://example.com", required: true }] },
  { kind: "text", label: "Text", hint: "Shows plain text", fields: [{ key: "text", label: "Text", placeholder: "Any text, up to 900 characters", required: true, multiline: true }] },
  {
    kind: "wifi",
    label: "Wi-Fi",
    hint: "Joins a Wi-Fi network",
    fields: [
      { key: "ssid", label: "Network name", required: true },
      { key: "password", label: "Password" },
      { key: "security", label: "Security", options: [{ value: "WPA", label: "WPA / WPA2 / WPA3" }, { value: "WEP", label: "WEP" }, { value: "nopass", label: "No password" }] },
      { key: "hidden", label: "Hidden network", options: [{ value: "false", label: "No" }, { value: "true", label: "Yes" }] },
    ],
  },
  {
    kind: "vcard",
    label: "Contact card",
    hint: "Saves a contact",
    fields: [
      { key: "firstName", label: "First name" },
      { key: "lastName", label: "Last name" },
      { key: "org", label: "Company" },
      { key: "title", label: "Job title" },
      { key: "phone", label: "Phone" },
      { key: "email", label: "Email" },
      { key: "website", label: "Website" },
    ],
  },
  {
    kind: "email",
    label: "Email",
    hint: "Starts an email",
    fields: [
      { key: "to", label: "To", placeholder: "hello@example.com", required: true },
      { key: "subject", label: "Subject" },
      { key: "body", label: "Message", multiline: true },
    ],
  },
  { kind: "sms", label: "SMS", hint: "Starts a text message", fields: [{ key: "number", label: "Phone number", placeholder: "+44 7700 900123", required: true }, { key: "message", label: "Message", multiline: true }] },
  { kind: "phone", label: "Phone", hint: "Starts a call", fields: [{ key: "number", label: "Phone number", placeholder: "+44 7700 900123", required: true }] },
];

export const isQrKind = (v: unknown): v is QrKind => QR_KINDS.some((k) => k.kind === v);
export const kindInfo = (k: QrKind) => QR_KINDS.find((x) => x.kind === k)!;

export type Built = { ok: true; content: string } | { ok: false; error: string };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const clean = (v: unknown, max = 300) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const digits = (v: string) => v.replace(/\D/g, "");

/** Turns "example.com" into "https://example.com" and rejects anything that is not a web address. */
export function normalizeUrl(input: string): { ok: true; url: string } | { ok: false; error: string } {
  let v = input.trim();
  if (!v) return { ok: false, error: "Enter a web address." };
  if (/\s/.test(v)) return { ok: false, error: "A web address can't contain spaces." };
  if (!/^[a-z][a-z0-9+.-]*:/i.test(v)) v = `https://${v}`;
  let u: URL;
  try {
    u = new URL(v);
  } catch {
    return { ok: false, error: "That doesn't look like a web address." };
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") return { ok: false, error: "Only http and https links are allowed." };
  if (!u.hostname.includes(".") && u.hostname !== "localhost") return { ok: false, error: "Enter a full address, like example.com." };
  if (v.length > 2000) return { ok: false, error: "That address is too long (2000 characters at most)." };
  return { ok: true, url: u.toString() };
}

const wifiEsc = (s: string) => s.replace(/([\\;,:"])/g, "\\$1");
const vEsc = (s: string) => s.replace(/\\/g, "\\\\").replace(/\r?\n/g, "\\n").replace(/([;,])/g, "\\$1");

export function buildContent(kind: QrKind, f: Record<string, string>): Built {
  switch (kind) {
    case "url": {
      const r = normalizeUrl(clean(f.url, 2100));
      return r.ok ? { ok: true, content: r.url } : r;
    }
    case "text": {
      const t = clean(f.text, 900);
      return t ? { ok: true, content: t } : { ok: false, error: "Enter some text." };
    }
    case "wifi": {
      const ssid = clean(f.ssid, 32);
      if (!ssid) return { ok: false, error: "Enter the network name." };
      const sec = ["WPA", "WEP", "nopass"].includes(f.security) ? f.security : "WPA";
      const pw = clean(f.password, 63);
      if (sec !== "nopass" && !pw) return { ok: false, error: "Enter the Wi-Fi password, or choose “No password”." };
      const hidden = f.hidden === "true" ? "true" : "false";
      return { ok: true, content: `WIFI:T:${sec};S:${wifiEsc(ssid)};${sec === "nopass" ? "" : `P:${wifiEsc(pw)};`}H:${hidden};;` };
    }
    case "vcard": {
      const first = clean(f.firstName, 60);
      const last = clean(f.lastName, 60);
      const org = clean(f.org, 80);
      if (!first && !last && !org) return { ok: false, error: "Enter a name or a company." };
      const email = clean(f.email, 120);
      if (email && !EMAIL.test(email)) return { ok: false, error: "That email address doesn't look right." };
      const phone = clean(f.phone, 30);
      if (phone && digits(phone).length < 5) return { ok: false, error: "That phone number looks too short." };
      let website = clean(f.website, 200);
      if (website) {
        const w = normalizeUrl(website);
        if (!w.ok) return { ok: false, error: `Website: ${w.error}` };
        website = w.url;
      }
      const lines = [
        "BEGIN:VCARD",
        "VERSION:3.0",
        `N:${vEsc(last)};${vEsc(first)};;;`,
        `FN:${vEsc([first, last].filter(Boolean).join(" ") || org)}`,
        org && `ORG:${vEsc(org)}`,
        clean(f.title, 80) && `TITLE:${vEsc(clean(f.title, 80))}`,
        phone && `TEL;TYPE=CELL:${phone.replace(/[^\d+()\- ]/g, "")}`,
        email && `EMAIL:${email}`,
        website && `URL:${website}`,
        "END:VCARD",
      ].filter(Boolean);
      return { ok: true, content: lines.join("\r\n") };
    }
    case "email": {
      const to = clean(f.to, 120);
      if (!EMAIL.test(to)) return { ok: false, error: "Enter a valid email address." };
      const q = [
        clean(f.subject, 200) && `subject=${encodeURIComponent(clean(f.subject, 200))}`,
        clean(f.body, 600) && `body=${encodeURIComponent(clean(f.body, 600))}`,
      ].filter(Boolean);
      return { ok: true, content: `mailto:${to}${q.length ? `?${q.join("&")}` : ""}` };
    }
    case "sms": {
      const n = clean(f.number, 30);
      if (digits(n).length < 5) return { ok: false, error: "Enter a valid phone number." };
      const msg = clean(f.message, 400);
      return { ok: true, content: `SMSTO:${n.replace(/[^\d+]/g, "")}:${msg}` };
    }
    case "phone": {
      const n = clean(f.number, 30);
      if (digits(n).length < 5) return { ok: false, error: "Enter a valid phone number." };
      return { ok: true, content: `tel:${n.replace(/[^\d+]/g, "")}` };
    }
  }
}

// ───────── dynamic links ─────────
const PRIVATE_HOST = /^(localhost|.*\.local|.*\.internal)$/i;

/** A destination we are willing to redirect people to. Blocks private addresses, credentials and our own redirect links. */
export function safeDestination(input: string, ownHost: string): { ok: true; url: string } | { ok: false; error: string } {
  const r = normalizeUrl(input);
  if (!r.ok) return r;
  const u = new URL(r.url);
  if (u.username || u.password) return { ok: false, error: "Links with a username or password aren't allowed." };
  const h = u.hostname.toLowerCase();
  if (PRIVATE_HOST.test(h) || /^\d{1,3}(\.\d{1,3}){3}$/.test(h) || h.includes(":") || /^\[/.test(h)) return { ok: false, error: "Links to private or numeric addresses aren't allowed." };
  if (h === ownHost.toLowerCase() && u.pathname.startsWith("/r/")) return { ok: false, error: "A dynamic link can't point to another Klyroo short link." };
  return { ok: true, url: r.url };
}

const RESERVED_SLUGS = new Set(["admin", "api", "app", "login", "qr", "export", "account", "r", "terms", "privacy", "refunds", "docs", "new", "help", "support"]);

export function validateSlug(slug: string): { ok: true } | { ok: false; error: string } {
  if (!/^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/.test(slug)) return { ok: false, error: "Use 3 to 40 letters, numbers or dashes (no dash at the start or end)." };
  if (RESERVED_SLUGS.has(slug)) return { ok: false, error: "That name is reserved. Try another." };
  return { ok: true };
}

const ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789"; // no look-alike characters
export function randomSlug(bytes: Uint8Array, length = 7): string {
  let s = "";
  for (let i = 0; i < length; i++) s += ALPHABET[bytes[i] % ALPHABET.length];
  return s;
}
