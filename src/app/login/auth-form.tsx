"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useActionState, useState } from "react";
import { Notice } from "@/components/notice";
import { Button, Field, inputCls } from "@/components/ui";
import { resendConfirmation, signIn, signUp } from "./actions";

export function AuthForm() {
  const params = useSearchParams();
  const wanted = params.get("app");
  const [mode, setMode] = useState<"signup" | "login">("signup");
  const [state, action, pending] = useActionState(mode === "signup" ? signUp : signIn, undefined);
  const [resent, resend, resending] = useActionState(resendConfirmation, undefined);
  const needsConfirm = !!state?.email && (!!state?.message || /confirm your email/i.test(state?.error ?? ""));

  return (
    <div>
      <div role="tablist" aria-label="Sign up or log in" className="grid grid-cols-2 gap-1 p-1 rounded-ctl border border-line mb-6">
        {(["signup", "login"] as const).map((m) => (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={mode === m}
            onClick={() => setMode(m)}
            className={`h-9 rounded-ctl text-sm font-normal transition-colors ${mode === m ? "bg-wash text-primary" : "text-muted hover:text-ink"}`}
          >
            {m === "signup" ? "Create account" : "Log in"}
          </button>
        ))}
      </div>

      <form action={action} className="space-y-5">
        {wanted && <input type="hidden" name="app" value={wanted} />}
        {mode === "signup" && (
          <>
            <Field label="Your name">
              <input name="fullName" required maxLength={80} autoComplete="name" className={inputCls} placeholder="Alex Morgan" defaultValue={state?.fullName ?? ""} />
            </Field>
            <Field label="Company" hint="Optional. Shown as your account name.">
              <input name="company" maxLength={80} autoComplete="organization" className={inputCls} placeholder="Northwind Active" defaultValue={state?.company ?? ""} />
            </Field>
          </>
        )}
        <Field label="Email">
          <input name="email" type="email" required autoComplete="email" className={inputCls} placeholder="you@brand.com" defaultValue={state?.email ?? ""} />
        </Field>
        <Field label="Password" hint={mode === "signup" ? "At least 10 characters." : undefined}>
          <input
            name="password"
            type="password"
            required
            minLength={mode === "signup" ? 10 : undefined}
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            className={inputCls}
          />
        </Field>
        {mode === "login" && <p className="-mt-2 text-sm"><Link href="/forgot-password" className="text-primary hover:text-primary-hover">Forgot your password?</Link></p>}
        {params.get("link") === "expired" && !state && <Notice tone="warning">That email link has expired or was already used. Log in, or ask for a new one.</Notice>}
        {state?.error && <Notice tone="error">{state.error}</Notice>}
        {state?.message && <Notice tone="success">{state.message}</Notice>}
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "One moment…" : mode === "signup" ? "Create account" : "Log in"}
        </Button>
      </form>

      {needsConfirm && (
        <form action={resend} className="mt-5 pt-5 border-t border-line">
          <input type="hidden" name="email" value={state?.email} />
          <p className="text-sm text-muted">Didn&apos;t get it? Check spam, or</p>
          <button type="submit" disabled={resending} className="mt-1 text-sm text-primary hover:text-primary-hover disabled:opacity-50">
            {resending ? "Sending…" : "resend the confirmation email"}
          </button>
          {resent?.message && <Notice tone="success" className="mt-3">{resent.message}</Notice>}
          {resent?.error && <Notice tone="error" className="mt-3">{resent.error}</Notice>}
        </form>
      )}
    </div>
  );
}
