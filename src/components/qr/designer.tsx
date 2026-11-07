"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { Icon } from "@/components/icons";
import { Notice } from "@/components/notice";
import { Button, Card, Chip, Eyebrow, Field, inputCls } from "@/components/ui";
import { saveQrCode } from "@/app/qr/actions";
import { QR_KINDS, buildContent, kindInfo, safeDestination, type QrKind } from "@/lib/qr/payload";
import { DEFAULT_STYLE, contrastRatio, isInverted, qrSvg, type QrShape, type QrStyle } from "@/lib/qr/render";
import { shortUrl } from "@/lib/qr/site";
import { downloadPng, downloadSvg, prepareLogo, safeFileName } from "./download";

export type DesignerLimits = { maxDynamic: number; dynamicUsed: number; customSlug: boolean };

const SWATCHES = ["#0A2540", "#533AFD", "#000000", "#137A48", "#B54708", "#D92D20"];
const SHAPES: { value: QrShape; label: string }[] = [
  { value: "square", label: "Square" },
  { value: "rounded", label: "Rounded" },
  { value: "dots", label: "Dots" },
];
const SIZES = [512, 1024, 2048];

export function QrDesigner({ mode, limits, host = "useklyroo.com" }: { mode: "app" | "public"; limits?: DesignerLimits; host?: string }) {
  const router = useRouter();
  const [kind, setKind] = useState<QrKind>("url");
  const [fields, setFields] = useState<Record<string, string>>({ url: "https://" , security: "WPA", hidden: "false" });
  const [style, setStyle] = useState<QrStyle>(DEFAULT_STYLE);
  const [name, setName] = useState("My QR code");
  const [dynamic, setDynamic] = useState(false);
  const [slug, setSlug] = useState("");
  const [pxSize, setPxSize] = useState(1024);
  const [error, setError] = useState("");
  const [logoError, setLogoError] = useState("");
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const info = kindInfo(kind);
  const canDynamic = mode === "app" && kind === "url";
  const dynamicAllowed = !!limits && limits.maxDynamic > 0 && limits.dynamicUsed < limits.maxDynamic;
  const useDynamic = dynamic && canDynamic;

  // What the QR code contains right now (or why it can't be drawn yet).
  const { svg, problem, content } = useMemo(() => {
    const built = buildContent(kind, fields);
    if (!built.ok) return { svg: null, problem: built.error, content: "" };
    let toEncode = built.content;
    if (useDynamic) {
      const dest = safeDestination(fields.url ?? "", host);
      if (!dest.ok) return { svg: null, problem: dest.error, content: "" };
      toEncode = shortUrl(slug.trim().toLowerCase() || "preview");
    }
    try {
      return { svg: qrSvg(toEncode, style), problem: "", content: toEncode };
    } catch {
      return { svg: null, problem: "There's too much information for one QR code. Shorten it.", content: "" };
    }
  }, [kind, fields, style, useDynamic, slug, host]);

  const ratio = contrastRatio(style.fg, style.bg);
  const set = (k: string, v: string) => setFields((f) => ({ ...f, [k]: v }));

  async function onLogo(file: File | undefined) {
    setLogoError("");
    if (!file) return;
    try {
      const logo = await prepareLogo(file);
      setStyle((s) => ({ ...s, logo }));
    } catch (e) {
      setLogoError(e instanceof Error ? e.message : "Couldn't use that image.");
    }
    if (fileRef.current) fileRef.current.value = "";
  }

  async function save() {
    setError("");
    setSaving(true);
    const r = await saveQrCode({ name, kind, fields, mode: useDynamic ? "dynamic" : "static", style, slug: useDynamic ? slug : "" });
    if (!r.ok) {
      setSaving(false);
      setError(r.error);
      return;
    }
    router.push(`/qr/${r.id}`);
  }

  async function png() {
    if (!svg) return;
    setBusy(true);
    try {
      await downloadPng(svg, pxSize, safeFileName(name, "png"));
    } catch {
      setError("We couldn't make the PNG in this browser. Download the SVG instead.");
    }
    setBusy(false);
  }

  return (
    <div className="grid lg:grid-cols-[minmax(0,1fr)_400px] gap-6 items-start">
      <div className="space-y-4 order-2 lg:order-1">
        <Card className="!p-6">
          <Eyebrow>1. What should the code do?</Eyebrow>
          <div role="radiogroup" aria-label="Type of QR code" className="mt-4 flex flex-wrap gap-2">
            {QR_KINDS.map((k) => (
              <button
                key={k.kind}
                type="button"
                role="radio"
                aria-checked={kind === k.kind}
                onClick={() => { setKind(k.kind); setError(""); if (k.kind !== "url") setDynamic(false); }}
                className={`h-10 px-4 rounded-ctl border text-sm transition-colors ${kind === k.kind ? "border-primary bg-primary/[0.06] text-primary" : "border-line-strong text-muted hover:bg-wash hover:text-ink"}`}
              >
                {k.label}
              </button>
            ))}
          </div>
          <p className="mt-3 text-sm text-muted">{info.hint}.</p>

          <div className="mt-5 grid sm:grid-cols-2 gap-4">
            {info.fields.map((f) => (
              <div key={f.key} className={f.multiline || info.fields.length === 1 ? "sm:col-span-2" : ""}>
                <Field label={f.label + (f.required ? "" : " (optional)")}>
                  {f.options ? (
                    <select className={inputCls} value={fields[f.key] ?? f.options[0].value} onChange={(e) => set(f.key, e.target.value)}>
                      {f.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  ) : f.multiline ? (
                    <textarea className={`${inputCls} !h-28 py-3`} value={fields[f.key] ?? ""} placeholder={f.placeholder} onChange={(e) => set(f.key, e.target.value)} />
                  ) : (
                    <input className={inputCls} value={fields[f.key] ?? ""} placeholder={f.placeholder} onChange={(e) => set(f.key, e.target.value)} autoComplete="off" spellCheck={false} />
                  )}
                </Field>
              </div>
            ))}
          </div>

          {mode === "app" && kind === "url" && (
            <div className="mt-6 pt-5 border-t border-line">
              <Eyebrow>Static or dynamic</Eyebrow>
              <div className="mt-3 grid sm:grid-cols-2 gap-3" role="radiogroup" aria-label="Static or dynamic">
                <button type="button" role="radio" aria-checked={!dynamic} onClick={() => setDynamic(false)} className={`text-left rounded-ctl border p-4 ${!dynamic ? "border-primary bg-primary/[0.04]" : "border-line-strong hover:bg-wash"}`}>
                  <span className="block text-sm">Static</span>
                  <span className="block text-xs text-muted mt-1">The address is built into the picture. Free and permanent, but it can&apos;t be changed.</span>
                </button>
                <button type="button" role="radio" aria-checked={dynamic} onClick={() => dynamicAllowed && setDynamic(true)} disabled={!dynamicAllowed} className={`text-left rounded-ctl border p-4 disabled:opacity-60 ${dynamic ? "border-primary bg-primary/[0.04]" : "border-line-strong hover:bg-wash"}`}>
                  <span className="block text-sm">Dynamic</span>
                  <span className="block text-xs text-muted mt-1">Points at a short link you can change later, with scan counts.</span>
                </button>
              </div>
              {!dynamicAllowed && limits && (
                <Notice tone="warning" className="mt-3">
                  {limits.maxDynamic <= 0 ? <>Dynamic links are part of the Pro and Business plans. <Link href="/qr/billing" className="underline">See plans</Link>.</> : <>You&apos;re using all {limits.maxDynamic} dynamic links on your plan. <Link href="/qr/billing" className="underline">Upgrade</Link> or delete one.</>}
                </Notice>
              )}
              {useDynamic && limits?.customSlug && (
                <div className="mt-4 max-w-sm">
                  <Field label="Short link name (optional)" hint={`Your link: ${shortUrl(slug.trim().toLowerCase() || "random-name")}`}>
                    <input className={inputCls} value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="spring-sale" maxLength={40} autoComplete="off" spellCheck={false} />
                  </Field>
                </div>
              )}
            </div>
          )}
        </Card>

        <Card className="!p-6">
          <Eyebrow>2. Make it yours</Eyebrow>
          <div className="mt-4 grid sm:grid-cols-2 gap-6">
            <div>
              <span className="block text-sm mb-2">Code colour</span>
              <div className="flex flex-wrap items-center gap-2">
                {SWATCHES.map((c) => (
                  <button key={c} type="button" aria-label={`Use ${c}`} onClick={() => setStyle((s) => ({ ...s, fg: c }))} className={`size-8 rounded-full border ${style.fg.toLowerCase() === c.toLowerCase() ? "ring-2 ring-primary ring-offset-2" : "border-line-strong"}`} style={{ background: c }} />
                ))}
                <input type="color" aria-label="Custom code colour" value={style.fg} onChange={(e) => setStyle((s) => ({ ...s, fg: e.target.value.toUpperCase() }))} className="size-8 rounded border border-line-strong bg-surface p-0.5" />
              </div>
            </div>
            <div>
              <span className="block text-sm mb-2">Background</span>
              <div className="flex flex-wrap items-center gap-2">
                {["#FFFFFF", "#F3F4F6", "#FDE68A", "#DBEAFE"].map((c) => (
                  <button key={c} type="button" aria-label={`Use background ${c}`} onClick={() => setStyle((s) => ({ ...s, bg: c }))} className={`size-8 rounded-full border ${style.bg.toLowerCase() === c.toLowerCase() ? "ring-2 ring-primary ring-offset-2" : "border-line-strong"}`} style={{ background: c }} />
                ))}
                <input type="color" aria-label="Custom background colour" value={style.bg} onChange={(e) => setStyle((s) => ({ ...s, bg: e.target.value.toUpperCase() }))} className="size-8 rounded border border-line-strong bg-surface p-0.5" />
              </div>
            </div>
            <div>
              <span className="block text-sm mb-2">Shape</span>
              <div role="radiogroup" aria-label="Shape" className="flex gap-2">
                {SHAPES.map((s) => (
                  <button key={s.value} type="button" role="radio" aria-checked={style.shape === s.value} onClick={() => setStyle((x) => ({ ...x, shape: s.value }))} className={`h-9 px-4 rounded-ctl border text-sm ${style.shape === s.value ? "border-primary bg-primary/[0.06] text-primary" : "border-line-strong text-muted hover:bg-wash"}`}>{s.label}</button>
                ))}
              </div>
            </div>
            <div>
              <span className="block text-sm mb-2">Logo (optional)</span>
              <div className="flex items-center gap-3">
                <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" id="qr-logo" onChange={(e) => onLogo(e.target.files?.[0])} />
                <label htmlFor="qr-logo" className="inline-flex h-9 items-center px-4 rounded-ctl border border-line-strong text-sm text-primary cursor-pointer hover:bg-wash">{style.logo ? "Change logo" : "Upload logo"}</label>
                {style.logo && <button type="button" className="text-sm text-muted hover:text-danger" onClick={() => setStyle((s) => ({ ...s, logo: null }))}>Remove</button>}
              </div>
              {logoError && <Notice tone="error" className="mt-3">{logoError}</Notice>}
            </div>
          </div>
          {ratio < 3 && <Notice tone="warning" className="mt-5">These colours are close together. Some phones may not scan the code. Use a much darker code on a lighter background.</Notice>}
          {ratio >= 3 && isInverted(style) && <Notice tone="warning" className="mt-5">A light code on a dark background doesn&apos;t scan on every phone. Test it before printing.</Notice>}
        </Card>
      </div>

      <div className="order-1 lg:order-2 lg:sticky lg:top-6">
        <Card featured className="!p-6">
          <div className="flex items-center justify-between">
            <Eyebrow>Preview</Eyebrow>
            {useDynamic ? <Chip tone="info">Dynamic</Chip> : <Chip tone="outline">Static</Chip>}
          </div>
          <div className="mt-4 grid place-items-center rounded-ctl border border-line p-4" style={{ background: style.bg }}>
            {svg ? (
              <div className="w-full max-w-[280px] aspect-square" role="img" aria-label="QR code preview" dangerouslySetInnerHTML={{ __html: svg }} />
            ) : (
              <div className="w-full max-w-[280px] aspect-square grid place-items-center text-center text-sm text-muted px-4">{problem || "Fill in the details to see your code."}</div>
            )}
          </div>
          {svg && <p className="mt-3 text-xs text-muted break-all">{useDynamic ? `Encodes: ${content}` : "Scan it with your phone to test."}</p>}

          <div className="mt-5 space-y-4">
            <Field label="Name"><input className={inputCls} value={name} maxLength={80} onChange={(e) => setName(e.target.value)} /></Field>
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <span className="block text-sm mb-1.5">PNG size</span>
                <select className={`${inputCls} !h-10 text-sm !w-[120px]`} value={pxSize} onChange={(e) => setPxSize(Number(e.target.value))} aria-label="PNG size in pixels">
                  {SIZES.map((s) => <option key={s} value={s}>{s} px</option>)}
                </select>
              </div>
              <Button variant="secondary" size="sm" className="!h-10" disabled={!svg || busy} onClick={png}><Icon name="download" size={16} />{busy ? "Preparing…" : "PNG"}</Button>
              <Button variant="secondary" size="sm" className="!h-10" disabled={!svg} onClick={() => svg && downloadSvg(svg, safeFileName(name, "svg"))}><Icon name="download" size={16} />SVG</Button>
            </div>
            {error && <Notice tone="error">{error}</Notice>}
            {mode === "app" ? (
              <Button className="w-full" disabled={!svg || saving} onClick={save}>{saving ? "Saving…" : useDynamic ? "Save dynamic code" : "Save to my codes"}</Button>
            ) : (
              <Notice tone="info">Want to save codes, change a link later and see scans? <Link href="/login?app=qr" className="underline">Create a free account</Link>.</Notice>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
