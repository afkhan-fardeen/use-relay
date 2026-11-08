"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/dal";
import { COMPANY } from "@/lib/company";
import { allow } from "@/lib/ratelimit";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { buildContent, isQrKind, randomSlug, safeDestination, validateSlug } from "@/lib/qr/payload";
import { DEFAULT_STYLE, contrastRatio, isHexColor, isLogoDataUrl, qrLayout, type QrShape } from "@/lib/qr/render";
import { qrUsage } from "@/lib/qr/usage";

export type SaveResult = { ok: true; id: string } | { ok: false; error: string };
export type SimpleResult = { ok: true } | { ok: false; error: string };

type StyleInput = { fg?: unknown; bg?: unknown; shape?: unknown; logo?: unknown };

function cleanStyle(s: StyleInput | undefined): { ok: true; style: { fg: string; bg: string; shape: QrShape; logo: string | null } } | { ok: false; error: string } {
  const fg = isHexColor(s?.fg) ? s.fg : DEFAULT_STYLE.fg;
  const bg = isHexColor(s?.bg) ? s.bg : DEFAULT_STYLE.bg;
  const shape: QrShape = s?.shape === "rounded" || s?.shape === "dots" ? s.shape : "square";
  const logo = s?.logo ? (isLogoDataUrl(s.logo) ? s.logo : undefined) : null;
  if (logo === undefined) return { ok: false, error: "The logo must be a PNG, JPEG or WebP image under about 150 KB." };
  if (contrastRatio(fg, bg) < 2.5) return { ok: false, error: "The two colours are too similar, so the code wouldn't scan. Pick a darker code colour or a lighter background." };
  return { ok: true, style: { fg, bg, shape, logo } };
}

const cleanName = (v: unknown) => (typeof v === "string" ? v.trim().slice(0, 80) : "");
const cleanFields = (v: unknown): Record<string, string> => {
  const out: Record<string, string> = {};
  if (v && typeof v === "object") for (const [k, val] of Object.entries(v as Record<string, unknown>)) if (typeof val === "string" && k.length <= 20) out[k] = val.slice(0, 2100);
  return out;
};

export async function saveQrCode(input: unknown): Promise<SaveResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Your session ended. Log in again." };
  if (!allow(`qr:${session.userId}`, 60, 3_600_000)) return { ok: false, error: "You're creating codes very quickly. Try again in a few minutes." };
  const x = (input ?? {}) as Record<string, unknown>;

  const name = cleanName(x.name);
  if (!name) return { ok: false, error: "Give your code a name." };
  if (!isQrKind(x.kind)) return { ok: false, error: "Choose what the code should do." };
  const kind = x.kind;
  const mode = x.mode === "dynamic" ? "dynamic" : "static";
  const fields = cleanFields(x.fields);
  const st = cleanStyle(x.style as StyleInput);
  if (!st.ok) return st;

  const built = buildContent(kind, fields);
  if (!built.ok) return built;

  const db = supabaseAdmin();
  let content = built.content;
  let slug: string | null = null;

  if (mode === "dynamic") {
    if (kind !== "url") return { ok: false, error: "Only links can be dynamic." };
    const dest = safeDestination(fields.url ?? "", COMPANY.domain);
    if (!dest.ok) return dest;
    content = dest.url;

    const usage = await qrUsage(session.accountId);
    if (usage.ent.limits.maxDynamic <= 0) return { ok: false, error: "Dynamic links are part of the Pro and Business plans. Upgrade in Billing to use them." };
    if (usage.dynamicUsed >= usage.ent.limits.maxDynamic) return { ok: false, error: `You're using all ${usage.ent.limits.maxDynamic} dynamic links on your plan. Delete one or upgrade in Billing.` };

    const custom = typeof x.slug === "string" ? x.slug.trim().toLowerCase() : "";
    if (custom) {
      if (!usage.ent.limits.customSlug) return { ok: false, error: "Custom short link names are part of the Pro and Business plans." };
      const v = validateSlug(custom);
      if (!v.ok) return v;
      slug = custom;
    }
  } else {
    // Prove the code can actually be drawn (too much data is rejected here, not later).
    try { qrLayout(content, { logo: st.style.logo }); } catch { return { ok: false, error: "There's too much information for one QR code. Shorten it and try again." }; }
  }

  for (let attempt = 0; attempt < 6; attempt++) {
    const useSlug = mode === "dynamic" ? slug ?? randomSlug(randomBytes(8)) : null;
    const ins = await db
      .from("qr_codes")
      .insert({ account_id: session.accountId, name, kind, mode, fields, content, slug: useSlug, style: st.style })
      .select("id")
      .single();
    if (!ins.error && ins.data) {
      revalidatePath("/qr");
      return { ok: true, id: ins.data.id };
    }
    const taken = ins.error?.code === "23505";
    if (taken && slug) return { ok: false, error: "That short link name is already taken. Try another." };
    if (!taken) return { ok: false, error: "We couldn't save the code. Try again." };
  }
  return { ok: false, error: "We couldn't create a unique short link. Try again." };
}

async function ownedCode(id: string, accountId: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const { data } = await supabaseAdmin().from("qr_codes").select("id, account_id, mode, kind").eq("id", id).maybeSingle();
  return data && data.account_id === accountId ? data : null;
}

/** Rename, switch on/off, or change the destination of a dynamic link. */
export async function updateQrCode(id: string, patch: unknown): Promise<SimpleResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Your session ended. Log in again." };
  const code = await ownedCode(id, session.accountId);
  if (!code) return { ok: false, error: "Code not found." };
  const p = (patch ?? {}) as Record<string, unknown>;
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (p.name !== undefined) {
    const n = cleanName(p.name);
    if (!n) return { ok: false, error: "The name can't be empty." };
    update.name = n;
  }
  if (p.active !== undefined) {
    if (code.mode !== "dynamic") return { ok: false, error: "Only dynamic links can be switched off." };
    if (p.active === true) {
      const usage = await qrUsage(session.accountId);
      if (usage.dynamicUsed >= usage.ent.limits.maxDynamic) return { ok: false, error: "You're using all the dynamic links on your plan." };
    }
    update.active = p.active === true;
  }
  if (p.destination !== undefined) {
    if (code.mode !== "dynamic") return { ok: false, error: "Only dynamic links have a destination you can change." };
    const dest = safeDestination(String(p.destination), COMPANY.domain);
    if (!dest.ok) return dest;
    update.content = dest.url;
    update.fields = { url: dest.url };
  }
  const { error } = await supabaseAdmin().from("qr_codes").update(update).eq("id", id);
  if (error) return { ok: false, error: "We couldn't save that. Try again." };
  revalidatePath("/qr");
  revalidatePath(`/qr/${id}`);
  return { ok: true };
}

export async function deleteQrCode(id: string): Promise<SimpleResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Your session ended. Log in again." };
  const code = await ownedCode(id, session.accountId);
  if (!code) return { ok: false, error: "Code not found." };
  const { error } = await supabaseAdmin().from("qr_codes").delete().eq("id", id);
  if (error) return { ok: false, error: "We couldn't delete that. Try again." };
  revalidatePath("/qr");
  return { ok: true };
}
