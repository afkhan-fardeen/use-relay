"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icon } from "@/components/icons";
import { Notice } from "@/components/notice";
import { Button, Field, inputCls } from "@/components/ui";
import { deleteQrCode, updateQrCode } from "@/app/qr/actions";
import { downloadPng, downloadSvg, safeFileName } from "./download";

export function DownloadButtons({ svg, name }: { svg: string; name: string }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  return (
    <div>
      <div className="flex flex-wrap gap-3">
        <Button variant="secondary" size="sm" disabled={busy} onClick={async () => { setBusy(true); setErr(""); try { await downloadPng(svg, 1024, safeFileName(name, "png")); } catch { setErr("We couldn't make the PNG in this browser. Download the SVG instead."); } setBusy(false); }}>
          <Icon name="download" size={16} />{busy ? "Preparing…" : "Download PNG"}
        </Button>
        <Button variant="secondary" size="sm" onClick={() => downloadSvg(svg, safeFileName(name, "svg"))}><Icon name="download" size={16} />Download SVG</Button>
      </div>
      {err && <Notice tone="error" className="mt-3">{err}</Notice>}
    </div>
  );
}

export function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <Button variant="secondary" size="sm" onClick={async () => { try { await navigator.clipboard.writeText(text); setDone(true); setTimeout(() => setDone(false), 1800); } catch { /* clipboard blocked */ } }}>
      <Icon name={done ? "check" : "copy"} size={16} className={done ? "text-success" : ""} />{done ? "Copied" : label}
    </Button>
  );
}

export function EditDetails({ id, name, destination, dynamic, active }: { id: string; name: string; destination: string; dynamic: boolean; active: boolean }) {
  const router = useRouter();
  const [n, setN] = useState(name);
  const [dest, setDest] = useState(destination);
  const [state, setState] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [pending, setPending] = useState(false);

  async function run(patch: Record<string, unknown>, ok: string) {
    setPending(true);
    setState(null);
    const r = await updateQrCode(id, patch);
    setPending(false);
    if (r.ok) { setState({ tone: "success", text: ok }); router.refresh(); } else setState({ tone: "error", text: r.error });
  }

  return (
    <div className="space-y-5">
      <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); run({ name: n, ...(dynamic ? { destination: dest } : {}) }, "Saved."); }}>
        <Field label="Name"><input className={inputCls} value={n} maxLength={80} onChange={(e) => setN(e.target.value)} /></Field>
        {dynamic && (
          <Field label="Where the code sends people" hint="Change this any time. Printed codes keep working and go to the new address.">
            <input className={inputCls} value={dest} onChange={(e) => setDest(e.target.value)} autoComplete="off" spellCheck={false} />
          </Field>
        )}
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" size="sm" disabled={pending}>{pending ? "Saving…" : "Save changes"}</Button>
          {dynamic && (
            <Button type="button" variant="secondary" size="sm" disabled={pending} onClick={() => run({ active: !active }, active ? "The code is switched off. Scans show a “not active” page." : "The code is switched on.")}>
              {active ? "Switch off" : "Switch on"}
            </Button>
          )}
        </div>
      </form>
      {state && <Notice tone={state.tone}>{state.text}</Notice>}
    </div>
  );
}

export function DeleteButton({ id, dynamic }: { id: string; dynamic: boolean }) {
  const router = useRouter();
  const [confirm, setConfirm] = useState(false);
  const [err, setErr] = useState("");
  const [pending, setPending] = useState(false);
  return (
    <div>
      {!confirm ? (
        <Button variant="secondary" size="sm" className="!text-danger !border-danger/30 hover:!bg-danger/[0.05]" onClick={() => setConfirm(true)}><Icon name="trash" size={16} />Delete code</Button>
      ) : (
        <div className="rounded-ctl border border-danger/30 bg-danger/[0.04] p-4 max-w-md">
          <p className="text-sm text-danger">{dynamic ? "Delete this code? Anything already printed with it will stop working. This can't be undone." : "Delete this code from your list? Files you already downloaded aren't affected."}</p>
          <div className="mt-3 flex gap-3">
            <Button size="sm" className="!bg-danger hover:!bg-danger/90" disabled={pending} onClick={async () => { setPending(true); const r = await deleteQrCode(id); if (r.ok) router.push("/qr"); else { setPending(false); setErr(r.error); } }}>{pending ? "Deleting…" : "Yes, delete"}</Button>
            <Button variant="secondary" size="sm" onClick={() => setConfirm(false)}>Keep it</Button>
          </div>
          {err && <Notice tone="error" className="mt-3">{err}</Notice>}
        </div>
      )}
    </div>
  );
}
