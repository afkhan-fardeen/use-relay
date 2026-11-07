"use client";

import { useActionState } from "react";
import { Button, Field, inputCls } from "@/components/ui";
import { connectStore, disconnectStore, testStore, type StoreState } from "./actions";

function Notice({ state }: { state: StoreState }) {
  if (!state) return null;
  return state.error ? (
    <p role="alert" className="text-sm text-danger">{state.error}</p>
  ) : state.message ? (
    <p role="status" className="text-sm text-primary">{state.message}</p>
  ) : null;
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
      <Notice state={state} />
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Testing connection…" : "Test and connect"}
      </Button>
    </form>
  );
}

export function StoreActions({ storeId, connected }: { storeId: string; connected: boolean }) {
  const [testState, testAction, testing] = useActionState(testStore, undefined);
  const [discState, discAction, disconnecting] = useActionState(disconnectStore, undefined);
  return (
    <div className="mt-5 space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <form action={testAction}>
          <input type="hidden" name="storeId" value={storeId} />
          <Button type="submit" variant="secondary" size="sm" disabled={testing || !connected}>
            {testing ? "Testing…" : "Test connection"}
          </Button>
        </form>
        <form action={discAction}>
          <input type="hidden" name="storeId" value={storeId} />
          <Button type="submit" variant="tertiary" className="text-sm text-muted hover:text-danger" disabled={disconnecting}>
            {disconnecting ? "Disconnecting…" : "Disconnect"}
          </Button>
        </form>
      </div>
      <Notice state={testState} />
      <Notice state={discState} />
    </div>
  );
}
