"use client";

import { useActionState, useState } from "react";
import { Button, Field, inputCls } from "@/components/ui";
import { resendConfirmation, signIn, signUp } from "./actions";

export function AuthForm() {
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
        {state?.error && <p role="alert" className="text-sm text-danger">{state.error}</p>}
        {state?.message && <p role="status" className="text-sm text-primary">{state.message}</p>}
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
          {resent?.message && <p role="status" className="mt-2 text-sm text-primary">{resent.message}</p>}
          {resent?.error && <p role="alert" className="mt-2 text-sm text-danger">{resent.error}</p>}
        </form>
      )}
    </div>
  );
}
