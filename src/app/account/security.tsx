"use client";

import { useActionState, useState } from "react";
import { Notice } from "@/components/notice";
import { Button, Card, Eyebrow, Field, inputCls } from "@/components/ui";
import { changePassword, deleteAccount } from "./actions";

export function ChangePassword() {
  const [state, action, pending] = useActionState(changePassword, undefined);
  return (
    <Card className="!p-6">
      <Eyebrow>Password</Eyebrow>
      <form action={action} className="mt-4 space-y-4 max-w-sm">
        <Field label="Current password"><input name="current" type="password" required autoComplete="current-password" className={inputCls} /></Field>
        <Field label="New password" hint="At least 10 characters."><input name="next" type="password" required minLength={10} autoComplete="new-password" className={inputCls} /></Field>
        <Field label="Confirm new password"><input name="confirm" type="password" required minLength={10} autoComplete="new-password" className={inputCls} /></Field>
        {state?.error && <Notice tone="error">{state.error}</Notice>}
        {state?.message && <Notice tone="success">{state.message}</Notice>}
        <Button type="submit" variant="secondary" size="sm" disabled={pending}>{pending ? "Saving…" : "Change password"}</Button>
      </form>
    </Card>
  );
}

export function DeleteAccount({ isOwner }: { isOwner: boolean }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(deleteAccount, undefined);
  return (
    <Card className="!p-6 !border-danger/40">
      <Eyebrow>Delete account</Eyebrow>
      <p className="mt-3 text-sm text-muted max-w-xl leading-[22px]">
        This permanently deletes your account, your connected stores, saved QR codes (printed dynamic codes will stop working), export history and files. Any paid plan is cancelled first. This can&apos;t be undone.
      </p>
      {!isOwner ? (
        <p className="mt-4 text-sm text-muted">Only the account owner can delete the account.</p>
      ) : !open ? (
        <Button type="button" variant="secondary" size="sm" className="mt-5 !text-danger !border-danger/40 hover:!bg-danger/5" onClick={() => setOpen(true)}>Delete my account…</Button>
      ) : (
        <form action={action} className="mt-5 space-y-4 max-w-sm">
          <Field label="Type your email to confirm"><input name="email" type="email" required autoComplete="off" className={inputCls} /></Field>
          <Field label="Your password"><input name="password" type="password" required autoComplete="current-password" className={inputCls} /></Field>
          {state?.error && <Notice tone="error">{state.error}</Notice>}
          <div className="flex items-center gap-3">
            <Button type="submit" size="sm" className="!bg-danger hover:!bg-danger/90" disabled={pending}>{pending ? "Deleting…" : "Permanently delete everything"}</Button>
            <button type="button" className="text-sm text-muted hover:text-ink" onClick={() => setOpen(false)}>Cancel</button>
          </div>
        </form>
      )}
    </Card>
  );
}
