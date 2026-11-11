"use server";

import { headers } from "next/headers";
import { COMPANY } from "@/lib/company";
import { SUPPORT_CATEGORIES, SUPPORT_PRODUCTS } from "./options";
import { allow } from "@/lib/ratelimit";
import { reportError } from "@/lib/report";
import { supabaseAdmin } from "@/lib/supabase/admin";

export type SupportState = { error?: string; ok?: boolean; values?: Record<string, string> } | undefined;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Stores the request, then emails it to support when Resend is configured. Never reveals which part failed. */
export async function sendSupport(_prev: SupportState, formData: FormData): Promise<SupportState> {
  const v = (k: string, max: number) => String(formData.get(k) ?? "").trim().slice(0, max);
  const values = { email: v("email", 200), storeUrl: v("storeUrl", 200), product: v("product", 40), category: v("category", 40), message: v("message", 4000) };

  if (v("website", 100)) return { ok: true }; // honeypot: bots fill the hidden field; pretend it worked
  if (!EMAIL.test(values.email)) return { error: "Enter a valid email address so we can reply.", values };
  if (!(SUPPORT_PRODUCTS as readonly string[]).includes(values.product)) return { error: "Choose what your message is about.", values };
  if (!(SUPPORT_CATEGORIES as readonly string[]).includes(values.category)) return { error: "Choose a category.", values };
  if (values.message.length < 10) return { error: "Tell us a little more, at least a sentence.", values };
  if (values.storeUrl) {
    const host = values.storeUrl.replace(/^https?:\/\//i, "").split("/")[0].toLowerCase();
    if (!/^[a-z0-9][a-z0-9.-]*\.[a-z]{2,}$/.test(host)) return { error: "The store address should look like your-store.myshopify.com.", values };
    values.storeUrl = host;
  }

  const h = await headers();
  const ip = (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || "unknown";
  if (!allow(`support:${ip}`, 5, 3_600_000) || !allow(`support:${values.email.toLowerCase()}`, 3, 3_600_000)) {
    return { error: "You've sent several messages already. Please wait a while, or email us directly.", values };
  }

  const ins = await supabaseAdmin().from("support_requests").insert({
    email: values.email, store_url: values.storeUrl || null, product: values.product, category: values.category, message: values.message,
  }).select("id").single();
  if (ins.error) {
    reportError("support form", ins.error);
    return { error: `We couldn't save that just now. Please email ${COMPANY.supportEmail} instead.`, values };
  }

  // Best effort: email the team. The request is already saved, so a failure here loses nothing.
  const key = process.env.RESEND_API_KEY;
  if (key) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
        body: JSON.stringify({
          from: `Klyroo support <noreply@${COMPANY.domain}>`,
          to: [COMPANY.supportEmail],
          reply_to: values.email,
          subject: `[${values.category}] ${values.product} (${ins.data.id.slice(0, 8)})`,
          text: `From: ${values.email}\nStore: ${values.storeUrl || "-"}\nAbout: ${values.product}\nCategory: ${values.category}\n\n${values.message}`,
        }),
        signal: AbortSignal.timeout(8000),
      });
      if (res.ok) await supabaseAdmin().from("support_requests").update({ emailed: true }).eq("id", ins.data.id);
      else reportError("support email", new Error(`Resend ${res.status}`));
    } catch (e) {
      reportError("support email", e);
    }
  }
  return { ok: true };
}
