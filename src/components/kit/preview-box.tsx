"use client";

import { useState } from "react";
import { Button } from "@/components/ui";

type Links = {
  domain: string; expiresAt: string | null; mcpUrl: string; token: string;
  markdown: { llmsTxt: string; fullContext: string; documents: { title: string; url: string }[] };
};

function Copy({ label, value }: { label: string; value: string }) {
  return (
    <label className="block text-left">
      <span className="text-sm text-muted">{label}</span>
      <input readOnly value={value} onFocus={(e) => e.currentTarget.select()}
        className="mt-1 h-10 w-full rounded-ctl border border-line-strong bg-white px-3 text-sm" />
    </label>
  );
}

/**
 * The "paste your store address" box. With no preview API configured (before launch) it falls back to an early-access email link,
 * so the page never shows a form that cannot work.
 */
export function PreviewBox({ api, fallbackHref }: { api: string | null; fallbackHref: string }) {
  const [url, setUrl] = useState("");
  const [state, setState] = useState<"idle" | "working" | "error">("idle");
  const [message, setMessage] = useState("");
  const [links, setLinks] = useState<Links | null>(null);

  if (!api) {
    return (
      <div className="max-w-xl">
        <Button href={fallbackHref}>Request early access</Button>
        <p className="mt-3 text-sm text-muted">The free preview opens soon. Email us and we will tell you the day it does.</p>
      </div>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState("working"); setMessage(""); setLinks(null);
    try {
      const res = await fetch(`${api}/api/preview`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ url }) });
      const data = await res.json();
      if (!res.ok) { setState("error"); setMessage(data.message ?? "Something went wrong. Try again."); return; }
      setLinks(data); setState("idle");
    } catch {
      setState("error"); setMessage("We could not reach the service. Try again in a moment.");
    }
  }

  return (
    <div className="max-w-xl">
      <form onSubmit={submit} className="flex flex-col sm:flex-row gap-3">
        <label className="sr-only" htmlFor="store-url">Your store address</label>
        <input id="store-url" required value={url} onChange={(e) => setUrl(e.target.value)} placeholder="yourstore.com" inputMode="url" autoComplete="url"
          className="h-12 flex-1 rounded-ctl border border-line-strong bg-white px-4 text-[16px]" />
        <Button type="submit" disabled={state === "working"}>{state === "working" ? "Reading your site…" : "Build my preview"}</Button>
      </form>
      <p className="mt-3 text-sm text-muted">Free. No account. We read only your public pages, and the preview link expires after 24 hours.</p>
      <div aria-live="polite">
        {state === "error" && <p className="mt-4 rounded-ctl border border-primary px-4 py-3 text-sm">{message}</p>}
        {links && (
          <div className="mt-6 space-y-4 rounded-card border border-line bg-surface p-5">
            <p className="text-[17px]">Your preview for {links.domain} is ready.</p>
            <Copy label="MCP link (Claude, Cursor and other MCP tools)" value={links.mcpUrl} />
            <Copy label="Access token (send as a Bearer token)" value={links.token} />
            <Copy label="Markdown guide for any other tool" value={links.markdown.fullContext} />
            <p className="text-sm text-muted">Keep these private. Anyone with them can read the guide until it expires{links.expiresAt ? ` on ${new Date(links.expiresAt).toLocaleString()}` : ""}.</p>
          </div>
        )}
      </div>
    </div>
  );
}
