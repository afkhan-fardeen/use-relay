"use client";

import { useState } from "react";
import { FakeQr } from "@/components/fake-qr";
import { Button, Card, Chip, Field, PageHeader, inputCls } from "@/components/ui";

const kinds = ["Link", "Text", "Wi-Fi", "Email"] as const;

export function QrDesigner() {
  const [kind, setKind] = useState<(typeof kinds)[number]>("Link");
  const [content, setContent] = useState("https://example.com");
  const [color, setColor] = useState("#0A2540");
  const [name, setName] = useState("My QR code");
  // Changing the content changes the sample pattern so the preview feels alive.
  const seed = [...content].reduce((a, c) => a + c.charCodeAt(0), 1);

  return (
    <>
      <PageHeader title="Create a QR code" sub="Design a code, then download it for print or screens." actions={<Chip tone="info">Preview</Chip>} />
      <div className="grid lg:grid-cols-[1fr_380px] gap-6 items-start max-w-5xl">
        <Card className="!p-6 space-y-5">
          <Field label="Name"><input className={inputCls} value={name} maxLength={60} onChange={(e) => setName(e.target.value)} /></Field>
          <div>
            <span className="block text-sm mb-1.5">Type</span>
            <div role="radiogroup" aria-label="QR type" className="flex flex-wrap gap-2">
              {kinds.map((k) => (
                <button key={k} type="button" role="radio" aria-checked={kind === k} onClick={() => setKind(k)} className={`h-9 px-4 rounded-ctl border text-sm ${kind === k ? "border-primary bg-primary/[0.06] text-primary" : "border-line-strong text-muted hover:bg-wash"}`}>{k}</button>
              ))}
            </div>
          </div>
          <Field label={kind === "Link" ? "Web address" : kind === "Wi-Fi" ? "Network name" : kind === "Email" ? "Email address" : "Text"}>
            <input className={inputCls} value={content} maxLength={300} onChange={(e) => setContent(e.target.value)} />
          </Field>
          <Field label="Colour"><input type="color" aria-label="QR colour" className="h-12 w-24 rounded-ctl border border-line-strong bg-surface p-1" value={color} onChange={(e) => setColor(e.target.value)} /></Field>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button disabled>Save code</Button>
            <Button variant="secondary" disabled>Download PNG</Button>
            <span className="text-xs text-muted">Saving and downloading are coming soon.</span>
          </div>
        </Card>
        <Card featured className="!p-6">
          <div className="grid place-items-center rounded-ctl bg-wash p-8"><FakeQr seed={seed} size={220} color={color} label="Preview (not scannable)" /></div>
          <p className="mt-4 text-sm">{name || "Untitled"}</p>
          <p className="text-xs text-muted mt-0.5">Sample preview. This graphic is not scannable yet.</p>
        </Card>
      </div>
    </>
  );
}
