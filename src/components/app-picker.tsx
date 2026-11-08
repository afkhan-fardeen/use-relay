"use client";

import { startTransition, useActionState, useState } from "react";
import { saveApps } from "@/app/onboarding/actions";
import { Notice } from "@/components/notice";
import { Button, Chip } from "@/components/ui";
import { APPS, type AppSlug } from "@/lib/apps";

type Props = { initial: AppSlug[]; submitLabel: string; mode: "single" | "multi"; intent: "onboarding" | "manage" };

export function AppPicker({ initial, submitLabel, mode, intent }: Props) {
  const [chosen, setChosen] = useState<AppSlug[]>(initial);
  const [state, action, pending] = useActionState(saveApps, undefined);
  const toggle = (s: AppSlug) =>
    setChosen((c) => (mode === "single" ? [s] : c.includes(s) ? c.filter((x) => x !== s) : [...c, s]));

  return (
    <form
      onSubmit={(e) => {
        // Submit by hand: <form action> makes React reset the checkboxes after an error,
        // which swallows the user's next click.
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(() => action(fd));
      }}
    >
      <input type="hidden" name="intent" value={intent} />
      {/* The submitted value comes from state, not the checkboxes. */}
      {chosen.map((slug) => <input key={slug} type="hidden" name="app" value={slug} />)}
      <div className="grid sm:grid-cols-2 gap-4">
        {APPS.map((a) => {
          const on = chosen.includes(a.slug);
          return (
            <label key={a.slug} className={`block cursor-pointer rounded-card border p-6 transition-colors ${on ? "border-primary bg-primary/[0.04]" : "border-line hover:border-line-strong"}`}>
              <input type={mode === "single" ? "radio" : "checkbox"} name="_pick" checked={on} onChange={() => toggle(a.slug)} className="sr-only" aria-label={a.fullName} />
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-[22px] leading-[1.2] font-light">{a.fullName}</h2>
                <span aria-hidden className={`grid place-items-center size-6 rounded-full border text-xs ${on ? "bg-primary border-primary text-white" : "border-line-strong text-transparent"}`}>✓</span>
              </div>
              <div className="mt-2"><Chip tone="outline">Own plan</Chip></div>
              <p className="mt-3 text-sm text-muted">{a.tagline}</p>
              <ul className="mt-4 space-y-1.5 text-sm text-muted">
                {a.points.map((p) => <li key={p} className="flex gap-2"><span aria-hidden className="text-primary">·</span>{p}</li>)}
              </ul>
            </label>
          );
        })}
      </div>
      {state?.error && <Notice tone="error" className="mt-5">{state.error}</Notice>}
      {state?.message && <Notice tone="success" className="mt-5">{state.message}</Notice>}
      <div className="mt-6 flex items-center gap-4">
        <Button type="submit" disabled={pending}>{pending ? "Saving…" : submitLabel}</Button>
        <p className="text-xs text-muted">Each app is separate, with its own plan and billing. You can add another any time.</p>
      </div>
    </form>
  );
}
