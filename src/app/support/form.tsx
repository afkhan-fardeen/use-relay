"use client";

import { startTransition, useActionState } from "react";
import { Notice } from "@/components/notice";
import { Button, Field, inputCls } from "@/components/ui";
import { sendSupport } from "./actions";
import { SUPPORT_CATEGORIES, SUPPORT_PRODUCTS } from "./options";

export function SupportForm() {
  const [state, action, pending] = useActionState(sendSupport, undefined);
  if (state?.ok) {
    return <Notice tone="success">Thanks, we&apos;ve got your message. We&apos;ll reply by email within 2 business days. For anything urgent about billing, email support@useklyroo.com too.</Notice>;
  }
  const d = state?.values ?? {};
  return (
    <form
      className="space-y-5"
      // Submitted by hand so React doesn't clear the fields after an error (its automatic form reset would).
      onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); startTransition(() => action(fd)); }}
    >
      <div className="grid sm:grid-cols-2 gap-5">
        <Field label="Your email"><input name="email" type="email" required autoComplete="email" className={inputCls} defaultValue={d.email ?? ""} placeholder="you@brand.com" /></Field>
        <Field label="Store address" hint="Optional. For example your-store.myshopify.com"><input name="storeUrl" autoComplete="off" className={inputCls} defaultValue={d.storeUrl ?? ""} placeholder="your-store.myshopify.com" /></Field>
        <Field label="This is about">
          <select name="product" required className={inputCls} defaultValue={d.product ?? ""}>
            <option value="" disabled>Choose one</option>
            {SUPPORT_PRODUCTS.map((p) => <option key={p}>{p}</option>)}
          </select>
        </Field>
        <Field label="Category">
          <select name="category" required className={inputCls} defaultValue={d.category ?? ""}>
            <option value="" disabled>Choose one</option>
            {SUPPORT_CATEGORIES.map((p) => <option key={p}>{p}</option>)}
          </select>
        </Field>
      </div>
      <Field label="Message" hint="Never include passwords or your Shopify client secret.">
        <textarea name="message" required minLength={10} maxLength={4000} rows={7} className={`${inputCls} !h-auto py-3`} defaultValue={d.message ?? ""} />
      </Field>
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden"><label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
      {state?.error && <Notice tone="error">{state.error}</Notice>}
      <Button type="submit" disabled={pending}>{pending ? "Sending…" : "Send message"}</Button>
    </form>
  );
}
