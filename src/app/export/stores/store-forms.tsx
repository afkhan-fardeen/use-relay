"use client";

import { useActionState, useState } from "react";
import { Modal } from "@/components/kit/modal";
import { Notice } from "@/components/notice";
import { Button, Field, inputCls } from "@/components/ui";
import { connectStore, disconnectStore, testStore, type StoreState } from "./actions";

function StateNotice({ state }: { state: StoreState }) {
  if (!state) return null;
  return state.error ? <Notice tone="error">{state.error}</Notice> : state.message ? <Notice tone="success">{state.message}</Notice> : null;
}

export function ConnectForm() {
  const [state, action, pending] = useActionState(connectStore, undefined);
  return (
    <form action={action} className="mt-6 space-y-4">
      <Field label="Store address" hint="The address ending in .myshopify.com, not your custom domain.">
        <input name="domain" required className={inputCls} placeholder="your-store.myshopify.com" autoComplete="off" autoCapitalize="off" spellCheck={false} defaultValue={state?.values?.domain ?? ""} />
      </Field>
      <Field label="Client ID">
        <input name="clientId" required className={inputCls} autoComplete="off" spellCheck={false} defaultValue={state?.values?.clientId ?? ""} />
      </Field>
      <Field label="Client secret" hint="Encrypted before it is saved. You can revoke it in Shopify at any time.">
        <input name="clientSecret" type="password" required className={inputCls} autoComplete="new-password" spellCheck={false} />
      </Field>
      <StateNotice state={state} />
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Testing connection…" : "Test and connect"}
      </Button>
    </form>
  );
}

export function StoreActions({ storeId, connected }: { storeId: string; connected: boolean }) {
  const [testState, testAction, testing] = useActionState(testStore, undefined);
  const [discState, discAction, disconnecting] = useActionState(disconnectStore, undefined);
  const [confirm, setConfirm] = useState(false);
  return (
    <div className="mt-5 space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <form action={testAction}>
          <input type="hidden" name="storeId" value={storeId} />
          <Button type="submit" variant="secondary" size="sm" disabled={testing || !connected}>
            {testing ? "Testing…" : "Test connection"}
          </Button>
        </form>
        <Button type="button" variant="tertiary" className="text-sm text-muted hover:text-danger" onClick={() => setConfirm(true)}>Disconnect</Button>
        <Modal open={confirm} onClose={() => setConfirm(false)} title="Disconnect this store?" tone="danger">
          <p>Klyroo will delete the saved Shopify secret for this store and you won&apos;t be able to export from it until you connect it again. Your export history stays.</p>
          <form action={discAction} className="mt-5 flex items-center justify-end gap-3" onSubmit={() => setConfirm(false)}>
            <input type="hidden" name="storeId" value={storeId} />
            <Button type="button" variant="secondary" size="sm" onClick={() => setConfirm(false)}>Keep connected</Button>
            <Button type="submit" size="sm" className="!bg-danger hover:!bg-danger/90" disabled={disconnecting}>{disconnecting ? "Disconnecting…" : "Disconnect store"}</Button>
          </form>
        </Modal>
      </div>
      <StateNotice state={testState} />
      <StateNotice state={discState} />
    </div>
  );
}
