"use client";

import { useActionState } from "react";
import { setNewPassword } from "@/app/login/actions";
import { Notice } from "@/components/notice";
import { Button, Field, inputCls } from "@/components/ui";

export function ResetForm() {
  const [state, action, pending] = useActionState(setNewPassword, undefined);
  return (
    <form action={action} className="space-y-5">
      <Field label="New password" hint="At least 10 characters.">
        <input name="password" type="password" required minLength={10} autoComplete="new-password" className={inputCls} />
      </Field>
      <Field label="Confirm new password">
        <input name="confirm" type="password" required minLength={10} autoComplete="new-password" className={inputCls} />
      </Field>
      {state?.error && <Notice tone="error">{state.error}</Notice>}
      <Button type="submit" className="w-full" disabled={pending}>{pending ? "Saving…" : "Save new password"}</Button>
    </form>
  );
}
