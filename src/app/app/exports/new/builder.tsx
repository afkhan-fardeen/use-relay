"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Button, Card, Chip, Eyebrow, Field, PageHeader, inputCls } from "@/components/ui";
import {
  MF_KEY,
  columnLabel,
  fileName,
  getResource,
  resources,
  templates,
  type ExportConfig,
  type FileFormat,
  type ResourceId,
} from "@/lib/export";
import { getJobStatus, previewExport, startExport, type JobStatus, type PreviewResult } from "../actions";

type StoreOpt = { id: string; domain: string; scopes: string[] };

const STAGE: Record<string, string> = {
  queued: "Waiting in line…",
  starting: "Starting…",
  shopify_running: "Shopify is preparing your data…",
  downloading: "Building your file…",
  building: "Building your file…",
  publishing: "Saving your file…",
};

function Section({ n, title, hint, children }: { n: number; title: string; hint?: string; children: React.ReactNode }) {
  return (
    <Card className="!p-6">
      <div className="flex items-start gap-4">
        <span aria-hidden className="grid place-items-center size-8 shrink-0 rounded-full border border-secondary/40 text-secondary text-sm">{n}</span>
        <div className="min-w-0 flex-1">
          <h2 className="text-[19px] leading-[26px] font-light">{title}</h2>
          {hint && <p className="text-sm text-muted mt-0.5">{hint}</p>}
          <div className="mt-5">{children}</div>
        </div>
      </div>
    </Card>
  );
}

export function Builder({ stores }: { stores: StoreOpt[] }) {
  const params = useSearchParams();
  const tpl = templates.find((t) => t.id === params.get("template"));

  const [storeId, setStoreId] = useState(stores[0]?.id ?? "");
  const [resource, setResource] = useState<ResourceId>(tpl?.resource ?? "products");
  const res = getResource(resource);
  const defaultCols = (id: ResourceId) => getResource(id).fields.filter((x) => x.on).map((x) => x.key);
  const [columns, setColumns] = useState<string[]>(tpl?.columns ?? defaultCols(resource));
  const [renames, setRenames] = useState<Record<string, string>>({});
  const [status, setStatus] = useState(tpl?.status ?? "");
  const [tag, setTag] = useState(tpl?.tag ?? "");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [format, setFormat] = useState<FileFormat>("csv-bom");
  const [name, setName] = useState(tpl?.name ?? "My export");
  const [query, setQuery] = useState("");
  const [mfInput, setMfInput] = useState("");
  const [mfError, setMfError] = useState("");

  const config: ExportConfig = { storeId, resource, columns, renames, status, tag, dateFrom, dateTo, format, name };
  const configKey = JSON.stringify(config);

  // ───── live preview (debounced; stale answers are ignored) ─────
  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const seq = useRef(0);
  useEffect(() => {
    if (!storeId || columns.length === 0) return;
    const mine = ++seq.current;
    // Defer all state changes into the timer so the effect itself stays side-effect free.
    const t = setTimeout(async () => {
      setPreviewing(true);
      const r = await previewExport(JSON.parse(configKey));
      if (seq.current === mine) {
        setPreview(r);
        setPreviewing(false);
      }
    }, 700);
    return () => clearTimeout(t);
  }, [configKey, storeId, columns.length]);

  // ───── run + progress ─────
  const [phase, setPhase] = useState<"idle" | "starting" | "running" | "done" | "failed">("idle");
  const [job, setJob] = useState<JobStatus | null>(null);
  const [runError, setRunError] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const poll = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clock = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => () => {
    if (poll.current) clearTimeout(poll.current);
    if (clock.current) clearInterval(clock.current);
  }, []);

  function stopTimers() {
    if (poll.current) clearTimeout(poll.current);
    if (clock.current) clearInterval(clock.current);
  }

  async function run() {
    setRunError("");
    setJob(null);
    setPhase("starting");
    const started = await startExport(config);
    if (!started.ok) {
      setPhase("idle");
      setRunError(started.error);
      return;
    }
    setPhase("running");
    setElapsed(0);
    clock.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    const tick = async () => {
      const s = await getJobStatus(started.jobId);
      if (s) setJob(s);
      if (s?.status === "succeeded") {
        stopTimers();
        setPhase("done");
        return;
      }
      if (s?.status === "failed") {
        stopTimers();
        setPhase("failed");
        return;
      }
      poll.current = setTimeout(tick, 2000);
    };
    tick();
  }

  function changeResource(id: ResourceId) {
    setResource(id);
    setColumns(defaultCols(id));
    setRenames({});
    setStatus("");
    setTag("");
    setDateFrom("");
    setDateTo("");
    setPreview(null);
    setPhase("idle");
  }

  const touch = () => { if (phase === "done" || phase === "failed") setPhase("idle"); };
  const toggle = (key: string) => { setColumns((c) => (c.includes(key) ? c.filter((k) => k !== key) : [...c, key])); touch(); };
  const move = (key: string, dir: -1 | 1) => {
    setColumns((c) => {
      const i = c.indexOf(key);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= c.length) return c;
      const next = [...c];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  };
  function addMetafield() {
    const key = `mf:${mfInput.trim().toLowerCase()}`;
    if (!MF_KEY.test(key)) { setMfError("Use the format namespace.key, for example custom.material"); return; }
    if (columns.includes(key)) { setMfError("Already added."); return; }
    setMfError("");
    setMfInput("");
    setColumns((c) => [...c, key]);
    touch();
  }

  const label = (k: string) => renames[k] || columnLabel(res, k);
  const groups: Record<string, typeof res.fields> = {};
  res.fields
    .filter((x) => !query || x.label.toLowerCase().includes(query.toLowerCase()) || x.shopify.toLowerCase().includes(query.toLowerCase()))
    .forEach((x) => (groups[x.group] ??= []).push(x));

  const filename = fileName(name, format);
  const store = stores.find((s) => s.id === storeId);

  // ───── no connected store ─────
  if (stores.length === 0) {
    return (
      <>
        <PageHeader title="New export" sub="Connect a store first, then come back to build your export." />
        <Card featured className="!p-8 max-w-xl">
          <h2 className="text-[22px] leading-[1.2] font-light">No connected store</h2>
          <p className="mt-2 text-sm text-muted">Exports run against your Shopify store, so you need to connect one first. It takes about two minutes.</p>
          <div className="mt-6"><Button href="/app/stores">Connect a store</Button></div>
        </Card>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="New export"
        sub={tpl ? `Started from the “${tpl.name}” template. Change anything below.` : "Choose what to export, narrow it down, pick columns, then run."}
        actions={<Link href="/app" className="text-sm text-muted hover:text-ink">← Templates</Link>}
      />

      <div className="grid xl:grid-cols-[minmax(0,1fr)_460px] gap-6 items-start">
        <div className="space-y-4">
          {stores.length > 1 && (
            <Card className="!p-6">
              <Field label="Store">
                <select className={inputCls} value={storeId} onChange={(e) => { setStoreId(e.target.value); setPreview(null); touch(); }}>
                  {stores.map((s) => <option key={s.id} value={s.id}>{s.domain}</option>)}
                </select>
              </Field>
            </Card>
          )}

          <Section n={1} title="What to export">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {resources.map((r) => {
                const on = r.id === resource;
                const allowed = !store || store.scopes.includes(r.scope);
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => changeResource(r.id)}
                    aria-pressed={on}
                    className={`text-left rounded-ctl border p-4 transition-colors ${on ? "border-primary bg-primary/[0.06]" : "border-line-strong hover:bg-wash"}`}
                  >
                    <span className="flex items-center justify-between">
                      <span className="font-normal">{r.label}</span>
                      {on && <span aria-hidden className="text-primary">●</span>}
                    </span>
                    <span className="block text-xs text-muted mt-1">{r.blurb}</span>
                    {!allowed && <span className="block text-xs text-danger mt-2">Needs {r.scope}</span>}
                  </button>
                );
              })}
            </div>
          </Section>

          <Section n={2} title="Filters" hint="Leave blank to export everything.">
            <div className="grid sm:grid-cols-2 gap-4">
              {res.statuses.length > 0 && (
                <Field label="Status">
                  <select className={inputCls} value={status} onChange={(e) => { setStatus(e.target.value); touch(); }}>
                    <option value="">Any status</option>
                    {res.statuses.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
                  </select>
                </Field>
              )}
              {res.tagFilter && (
                <Field label="Tag is">
                  <input className={inputCls} value={tag} onChange={(e) => { setTag(e.target.value); touch(); }} placeholder="e.g. vip" maxLength={50} />
                </Field>
              )}
              {res.dateFilter && (
                <>
                  <Field label="Created from"><input type="date" className={inputCls} value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); touch(); }} /></Field>
                  <Field label="Created to"><input type="date" className={inputCls} value={dateTo} onChange={(e) => { setDateTo(e.target.value); touch(); }} /></Field>
                </>
              )}
            </div>
            {res.statuses.length === 0 && !res.tagFilter && !res.dateFilter && (
              <p className="text-sm text-muted">This export has no filters. It includes everything.</p>
            )}
          </Section>

          <Section n={3} title="Columns" hint="Pick, reorder and rename. The Shopify field name is shown under each label.">
            <div className="grid gap-8">
              <div className="order-1">
                <div className="flex items-center justify-between mb-2">
                  <Eyebrow>In your file ({columns.length})</Eyebrow>
                  <button type="button" className="text-xs text-muted hover:text-ink" onClick={() => { setColumns(defaultCols(resource)); setRenames({}); touch(); }}>Reset</button>
                </div>
                {columns.length === 0 ? (
                  <p className="text-sm text-danger border border-danger/40 rounded-ctl p-4">Pick at least one column.</p>
                ) : (
                  <ol className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1">
                    {columns.map((k, i) => (
                      <li key={k} className="flex items-center gap-2 rounded-ctl border border-line px-2 py-1.5">
                        <span className="w-5 text-center text-xs text-muted tabular">{i + 1}</span>
                        <input
                          aria-label={`Header for ${columnLabel(res, k)}`}
                          className="flex-1 min-w-0 bg-transparent text-sm px-1 h-8 rounded border border-transparent hover:border-line-strong focus:border-primary"
                          value={label(k)}
                          maxLength={100}
                          onChange={(e) => setRenames((r) => ({ ...r, [k]: e.target.value }))}
                        />
                        {MF_KEY.test(k) && <Chip tone="outline">metafield</Chip>}
                        <button type="button" aria-label="Move up" disabled={i === 0} onClick={() => move(k, -1)} className="size-7 rounded text-muted hover:text-ink disabled:opacity-30">↑</button>
                        <button type="button" aria-label="Move down" disabled={i === columns.length - 1} onClick={() => move(k, 1)} className="size-7 rounded text-muted hover:text-ink disabled:opacity-30">↓</button>
                        <button type="button" aria-label="Remove" onClick={() => toggle(k)} className="size-7 rounded text-muted hover:text-danger">✕</button>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
              <div className="order-2">
                <input className={`${inputCls} !h-10 text-sm`} placeholder="Search columns" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search columns" />
                <div className="mt-4 max-h-[360px] overflow-y-auto pr-1 grid sm:grid-cols-2 gap-x-6 gap-y-5">
                  {Object.entries(groups).map(([g, fs]) => (
                    <fieldset key={g}>
                      <legend className="text-[13px] text-muted mb-2">{g}</legend>
                      <ul className="space-y-1">
                        {fs.map((x) => (
                          <li key={x.key}>
                            <label className="flex items-start gap-3 rounded-ctl px-2 py-1.5 hover:bg-wash cursor-pointer">
                              <input type="checkbox" className="mt-1.5 size-4 accent-[#533AFD]" checked={columns.includes(x.key)} onChange={() => toggle(x.key)} />
                              <span>
                                <span className="block text-sm leading-5">{x.label}</span>
                                <span className="block text-xs text-muted font-mono">{x.shopify}</span>
                              </span>
                            </label>
                          </li>
                        ))}
                      </ul>
                    </fieldset>
                  ))}
                </div>
                {res.metafields && (
                  <div className="mt-6 pt-5 border-t border-line">
                    <Field label="Add a metafield" hint="Type namespace.key, like custom.material. We read its value.">
                      <div className="flex gap-2">
                        <input className={`${inputCls} !h-10 text-sm`} value={mfInput} onChange={(e) => setMfInput(e.target.value)} placeholder="custom.material" onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addMetafield(); } }} />
                        <Button type="button" variant="secondary" size="sm" className="!h-10" onClick={addMetafield}>Add</Button>
                      </div>
                    </Field>
                    {mfError && <p role="alert" className="mt-2 text-sm text-danger">{mfError}</p>}
                  </div>
                )}
              </div>
            </div>
          </Section>

          <Section n={4} title="Format">
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="File type" hint="“CSV for Excel” adds a UTF-8 marker so accents open correctly. Native .xlsx is planned.">
                <select className={inputCls} value={format} onChange={(e) => { setFormat(e.target.value as FileFormat); touch(); }}>
                  <option value="csv-bom">CSV for Excel</option>
                  <option value="csv">CSV (UTF-8)</option>
                  <option value="tsv">TSV (tabs)</option>
                </select>
              </Field>
              <Field label="Export name" hint={`File: ${filename}`}>
                <input className={inputCls} value={name} maxLength={80} onChange={(e) => { setName(e.target.value); touch(); }} />
              </Field>
            </div>
          </Section>
        </div>

        <aside className="xl:sticky xl:top-6 space-y-4">
          <Card featured className="!p-6">
            <div className="flex items-center justify-between">
              <Eyebrow>Preview from {store?.domain.replace(".myshopify.com", "")}</Eyebrow>
              {previewing ? <Chip tone="info">Loading</Chip> : preview?.ok ? <Chip tone="outline">First {preview.rows.length} rows</Chip> : null}
            </div>
            {columns.length === 0 ? (
              <p className="mt-6 text-sm text-muted">Select columns to see a preview.</p>
            ) : !preview ? (
              <p className="mt-6 text-sm text-muted">{previewing ? "Fetching rows from Shopify…" : "Preview appears here."}</p>
            ) : !preview.ok ? (
              <p role="alert" className="mt-6 text-sm text-danger">{preview.error}</p>
            ) : preview.empty ? (
              <p className="mt-6 text-sm text-muted">No rows match these filters.</p>
            ) : (
              <div className={`mt-4 overflow-x-auto rounded-ctl border border-line ${previewing ? "opacity-50" : ""}`}>
                <table className="text-xs whitespace-nowrap">
                  <thead>
                    <tr className="text-left text-muted border-b border-line">
                      {preview.headers.slice(0, 6).map((h, i) => <th key={i} className="px-3 py-2 font-normal">{h}</th>)}
                      {preview.headers.length > 6 && <th className="px-3 py-2 font-normal text-secondary">+{preview.headers.length - 6} more</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.rows.map((r, i) => (
                      <tr key={i} className="border-b border-line last:border-0">
                        {r.slice(0, 6).map((c, j) => <td key={j} className="px-3 py-2 tabular max-w-[160px] truncate">{c || <span className="text-muted">–</span>}</td>)}
                        {r.length > 6 && <td className="px-3 py-2 text-muted">…</td>}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <p className="mt-4 text-xs text-muted">The preview shows a few rows. The file includes everything that matches.</p>
          </Card>

          <Card className="!p-6">
            <Eyebrow>Run</Eyebrow>
            {(phase === "idle" || phase === "starting") && (
              <>
                <p className="mt-3 text-sm text-muted">{columns.length} columns · {format === "tsv" ? "TSV" : "CSV"} · {filename}</p>
                {runError && <p role="alert" className="mt-3 text-sm text-danger">{runError}</p>}
                <Button className="w-full mt-5" onClick={run} disabled={columns.length === 0 || phase === "starting"}>
                  {phase === "starting" ? "Starting…" : "Run export"}
                </Button>
                <p className="mt-3 text-xs text-muted">Large exports can take a few minutes. You can leave this page; the file will be in History.</p>
              </>
            )}
            {phase === "running" && (
              <div className="mt-3" role="status" aria-live="polite">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2"><span aria-hidden className="size-2 rounded-full bg-secondary animate-pulse" />{STAGE[job?.status ?? "queued"] ?? "Working…"}</span>
                  <span className="tabular text-muted">{Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, "0")}</span>
                </div>
                <div className="mt-3 h-1.5 rounded-full bg-line overflow-hidden">
                  <div className="h-full w-1/3 rounded-full bg-secondary animate-[slide_1.4s_ease-in-out_infinite]" />
                </div>
                <p className="mt-3 text-xs text-muted">You can leave this page. Your file will appear in <Link href="/app/history" className="text-primary">History</Link>.</p>
              </div>
            )}
            {phase === "done" && job && (
              <div className="mt-3" role="status" aria-live="polite">
                <p className="text-sm flex items-center gap-2"><span aria-hidden className="size-2 rounded-full bg-primary" />Ready: {job.rows.toLocaleString("en-US")} rows.</p>
                {job.errorDetail && <p className="mt-2 text-xs text-muted">{job.errorDetail}</p>}
                {job.fileId && (
                  <a href={`/api/exports/${job.fileId}/download`} className="mt-5 inline-flex w-full items-center justify-center h-12 rounded-ctl bg-primary text-white hover:bg-primary-hover">
                    Download {job.fileName ?? filename}
                  </a>
                )}
                <div className="mt-3 flex gap-3">
                  <Button variant="secondary" size="sm" className="flex-1" onClick={() => setPhase("idle")}>Edit</Button>
                  <Button variant="secondary" size="sm" className="flex-1" href="/app/history">History</Button>
                </div>
                <p className="mt-3 text-xs text-muted">Files are kept for 7 days.</p>
              </div>
            )}
            {phase === "failed" && (
              <div className="mt-3" role="alert">
                <p className="text-sm text-danger">{job?.errorDetail ?? "The export failed."}</p>
                <Button className="w-full mt-5" onClick={run}>Try again</Button>
                <Button variant="secondary" size="sm" className="w-full mt-3" onClick={() => setPhase("idle")}>Edit settings</Button>
              </div>
            )}
          </Card>
        </aside>
      </div>
    </>
  );
}
