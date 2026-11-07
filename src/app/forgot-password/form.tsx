"use client";

import { useActionState } from "react";
import { requestPasswordReset } from "@/app/login/actions";
import { Notice } from "@/components/notice";
import { Button, Field, inputCls } from "@/components/ui";

export function ForgotForm() {
  const [state, action, pending] = useActionState(requestPasswordReset, undefined);
  return (
    <form action={action} className="space-y-5">
      <Field label="Email">
        <input name="email" type="email" required autoComplete="email" className={inputCls} placeholder="you@brand.com" defaultValue={state?.email ?? ""} />
      </Field>
      {state?.error && <Notice tone="error">{state.error}</Notice>}
      {state?.message && <Notice tone="success">{state.message}</Notice>}
      <Button type="submit" className="w-full" disabled={pending}>{pending ? "Sending…" : "Send reset link"}</Button>
    </form>
  );
}
