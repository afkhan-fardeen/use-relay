"use server";

import { headers } from "next/headers";
import { COMPANY } from "@/lib/company";
import { SUPPORT_CATEGORIES, SUPPORT_PRODUCTS } from "./options";
import { allow } from "@/lib/ratelimit";
import { reportError } from "@/lib/report";

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

  // Email the request to support through Resend. Without a key (or if Resend fails) the visitor is pointed at email.
  const key = process.env.RESEND_API_KEY;
  if (!key) return { error: `Our form is not switched on yet. Please email ${COMPANY.supportEmail} instead.`, values };
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
      body: JSON.stringify({
        from: `Klyroo support <noreply@${COMPANY.domain}>`,
        to: [COMPANY.supportEmail],
        reply_to: values.email,
        subject: `[${values.category}] ${values.product}`,
        text: `From: ${values.email}\nStore: ${values.storeUrl || "-"}\nAbout: ${values.product}\nCategory: ${values.category}\n\n${values.message}`,
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      reportError("support email", new Error(`Resend ${res.status}`));
      return { error: `We couldn't send that just now. Please email ${COMPANY.supportEmail} instead.`, values };
    }
  } catch (e) {
    reportError("support email", e);
    return { error: `We couldn't send that just now. Please email ${COMPANY.supportEmail} instead.`, values };
  }
  return { ok: true };
}
