"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button, Card, Chip, Eyebrow, Field, PageHeader, inputCls } from "@/components/ui";
import {
  buildRows,
  getResource,
  num,
  resources,
  templates,
  toDelimited,
  type ResourceId,
} from "@/lib/export";

type RunState = "idle" | "running" | "done";

function Section({ n, title, hint, children }: { n: number; title: string; hint?: string; children: React.ReactNode }) {
  return (
    <Card className="!p-6">
      <div className="flex items-start gap-4">
        <span aria-hidden className="grid place-items-center size-8 shrink-0 rounded-full border border-secondary/40 text-secondary text-sm font-normal">{n}</span>
        <div className="min-w-0 flex-1">
          <h2 className="text-[19px] leading-[26px] font-light">{title}</h2>
          {hint && <p className="text-sm text-muted mt-0.5">{hint}</p>}
          <div className="mt-5">{children}</div>
        </div>
      </div>
    </Card>
  );
}

export function Builder() {
  const params = useSearchParams();
  const tpl = templates.find((t) => t.id === params.get("template"));

  const [resource, setResource] = useState<ResourceId>(tpl?.resource ?? "products");
  const res = getResource(resource);
  const defaultCols = (id: ResourceId) => getResource(id).fields.filter((x) => x.on).map((x) => x.key);
  const [columns, setColumns] = useState<string[]>(tpl?.columns ?? defaultCols(resource));
  const [renames, setRenames] = useState<Record<string, string>>({});
  const [status, setStatus] = useState(tpl?.status ?? "");
  const [tag, setTag] = useState(tpl?.tag ?? "");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [format, setFormat] = useState<"csv" | "csv-bom" | "tsv">("csv-bom");
  const [name, setName] = useState(tpl?.name ?? "Untitled export");
  const [query, setQuery] = useState("");

  const [run, setRun] = useState<RunState>("idle");
  const [progress, setProgress] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);

  useEffect(() => () => { if (timer.current) clearInterval(timer.current); }, []);
  useEffect(() => () => { if (fileUrl) URL.revokeObjectURL(fileUrl); }, [fileUrl]);

  function changeResource(id: ResourceId) {
    setResource(id);
    setColumns(defaultCols(id));
    setRenames({});
    setStatus("");
    setRun("idle");
  }

  const cfg = useMemo(
    () => ({ resource, columns, renames, status, tag, dateFrom, dateTo }),
    [resource, columns, renames, status, tag, dateFrom, dateTo],
  );
  const preview = useMemo(() => buildRows(cfg, 8), [cfg]);
  const matching = useMemo(() => buildRows(cfg, 400).length, [cfg]);
  const estimate = Math.round((matching / 400) * res.total);

  const fieldByKey = (k: string) => res.fields.find((x) => x.key === k)!;
  const groups: Record<string, typeof res.fields> = {};
  res.fields
    .filter((x) => !query || x.label.toLowerCase().includes(query.toLowerCase()) || x.shopify.toLowerCase().includes(query.toLowerCase()))
    .forEach((x) => (groups[x.group] ??= []).push(x));

  function toggle(key: string) {
    setColumns((c) => (c.includes(key) ? c.filter((k) => k !== key) : [...c, key]));
    setRun("idle");
  }
  function move(key: string, dir: -1 | 1) {
    setColumns((c) => {
      const i = c.indexOf(key);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= c.length) return c;
      const next = [...c];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }

  function start() {
    if (columns.length === 0) return;
    setRun("running");
    setProgress(0);
    if (fileUrl) URL.revokeObjectURL(fileUrl);
    setFileUrl(null);
    timer.current = setInterval(() => {
      setProgress((p) => {
        const n = Math.min(100, p + 9 + Math.random() * 8);
        if (n >= 100) {
          if (timer.current) clearInterval(timer.current);
          const rows = buildRows(cfg, 400);
          const delim = format === "tsv" ? "\t" : ",";
          const text = toDelimited(rows, columns, columns.map((k) => renames[k] || fieldByKey(k).label), delim, format === "csv-bom");
          const type = format === "tsv" ? "text/tab-separated-values" : "text/csv";
          setFileUrl(URL.createObjectURL(new Blob([text], { type: `${type};charset=utf-8` })));
          setRun("done");
        }
        return n;
      });
    }, 280);
  }

  const stage = progress < 35 ? "Querying Shopify" : progress < 85 ? "Building file" : "Finishing";
  const ext = format === "tsv" ? "tsv" : "csv";
  const filename = `${name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "export"}.${ext}`;

  return (
    <>
      <PageHeader
        title="New export"
        sub={tpl ? `Started from the “${tpl.name}” template. Change anything below.` : "Choose what to export, narrow it down, pick columns, then run."}
        actions={
          <Link href="/app" className="text-sm font-normal text-muted hover:text-ink">← Templates</Link>
        }
      />

      <div className="grid xl:grid-cols-[minmax(0,1fr)_460px] gap-6 items-start">
        <div className="space-y-4">
          <Section n={1} title="What to export">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {resources.map((r) => {
                const on = r.id === resource;
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
                  </button>
                );
              })}
            </div>
          </Section>

          <Section n={2} title="Filters" hint="Leave blank to export everything.">
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Status">
                <select className={inputCls} value={status} onChange={(e) => { setStatus(e.target.value); setRun("idle"); }}>
                  <option value="">Any status</option>
                  {res.statuses.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
                </select>
              </Field>
              <Field label="Tag contains">
                <input className={inputCls} value={tag} onChange={(e) => { setTag(e.target.value); setRun("idle"); }} placeholder="e.g. vip" />
              </Field>
              <Field label="Created from"><input type="date" className={inputCls} value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setRun("idle"); }} /></Field>
              <Field label="Created to"><input type="date" className={inputCls} value={dateTo} onChange={(e) => { setDateTo(e.target.value); setRun("idle"); }} /></Field>
            </div>
            <p className="mt-4 text-sm text-muted">
              About <span className="text-ink font-normal tabular">{num(estimate)}</span> of {num(res.total)} {res.label.toLowerCase()} match.
            </p>
          </Section>

          <Section n={3} title="Columns" hint="Pick, reorder and rename. The Shopify field name is shown under each label.">
            <div className="grid gap-8">
              <div className="order-2">
                <input className={`${inputCls} !h-10 text-sm`} placeholder="Search columns" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search columns" />
                <div className="mt-4 max-h-[360px] overflow-y-auto pr-1 grid sm:grid-cols-2 gap-x-6 gap-y-5">
                  {Object.entries(groups).map(([g, fs]) => (
                    <fieldset key={g}>
                      <legend className="text-[13px] font-normal text-muted mb-2">{g}</legend>
                      <ul className="space-y-1">
                        {fs.map((x) => (
                          <li key={x.key}>
                            <label className="flex items-start gap-3 rounded-ctl px-2 py-1.5 hover:bg-wash cursor-pointer">
                              <input type="checkbox" className="mt-1.5 size-4 accent-[#533AFD]" checked={columns.includes(x.key)} onChange={() => toggle(x.key)} />
                              <span>
                                <span className="block text-sm font-normal leading-5">{x.label}</span>
                                <span className="block text-xs text-muted font-mono">{x.shopify}</span>
                              </span>
                            </label>
                          </li>
                        ))}
                      </ul>
                    </fieldset>
                  ))}
                </div>
              </div>
              <div className="order-1">
                <div className="flex items-center justify-between mb-2">
                  <Eyebrow>In your file ({columns.length})</Eyebrow>
                  <button type="button" className="text-xs text-muted hover:text-ink" onClick={() => setColumns(defaultCols(resource))}>Reset</button>
                </div>
                {columns.length === 0 ? (
                  <p className="text-sm text-danger border border-danger/40 rounded-ctl p-4">Pick at least one column.</p>
                ) : (
                  <ol className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1">
                    {columns.map((k, i) => (
                      <li key={k} className="flex items-center gap-2 rounded-ctl border border-line px-2 py-1.5">
                        <span className="w-5 text-center text-xs text-muted tabular">{i + 1}</span>
                        <input
                          aria-label={`Header for ${fieldByKey(k).label}`}
                          className="flex-1 min-w-0 bg-transparent text-sm font-normal px-1 h-8 rounded border border-transparent hover:border-line-strong focus:border-primary"
                          value={renames[k] ?? fieldByKey(k).label}
                          onChange={(e) => setRenames((r) => ({ ...r, [k]: e.target.value }))}
                        />
                        <button type="button" aria-label="Move up" disabled={i === 0} onClick={() => move(k, -1)} className="size-7 rounded text-muted hover:text-ink disabled:opacity-30">↑</button>
                        <button type="button" aria-label="Move down" disabled={i === columns.length - 1} onClick={() => move(k, 1)} className="size-7 rounded text-muted hover:text-ink disabled:opacity-30">↓</button>
                        <button type="button" aria-label="Remove" onClick={() => toggle(k)} className="size-7 rounded text-muted hover:text-danger">✕</button>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            </div>
          </Section>

          <Section n={4} title="Format">
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="File type" hint="“CSV for Excel” adds a UTF-8 marker so accents open correctly. Native .xlsx comes with the real export engine.">
                <select className={inputCls} value={format} onChange={(e) => setFormat(e.target.value as typeof format)}>
                  <option value="csv-bom">CSV for Excel</option>
                  <option value="csv">CSV (UTF-8)</option>
                  <option value="tsv">TSV (tabs)</option>
                </select>
              </Field>
              <Field label="Export name" hint={`File: ${filename}`}>
                <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} />
              </Field>
            </div>
          </Section>
        </div>

        <aside className="xl:sticky xl:top-6 space-y-4">
          <Card featured className="!p-6">
            <div className="flex items-center justify-between">
              <Eyebrow>Preview</Eyebrow>
              <Chip tone="outline">First {preview.length} rows</Chip>
            </div>
            {columns.length === 0 ? (
              <p className="mt-6 text-sm text-muted">Select columns to see a preview.</p>
            ) : preview.length === 0 ? (
              <p className="mt-6 text-sm text-muted">No rows match these filters.</p>
            ) : (
              <div className="mt-4 overflow-x-auto rounded-ctl border border-line">
                <table className="text-xs whitespace-nowrap">
                  <thead>
                    <tr className="text-left text-muted border-b border-line">
                      {columns.slice(0, 6).map((k) => <th key={k} className="px-3 py-2 font-normal">{renames[k] || fieldByKey(k).label}</th>)}
                      {columns.length > 6 && <th className="px-3 py-2 font-normal text-secondary">+{columns.length - 6} more</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((r, i) => (
                      <tr key={i} className="border-b border-line last:border-0">
                        {columns.slice(0, 6).map((k) => <td key={k} className="px-3 py-2 tabular max-w-[160px] truncate">{String(r[k] ?? "") || <span className="text-muted">–</span>}</td>)}
                        {columns.length > 6 && <td className="px-3 py-2 text-muted">…</td>}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          <Card className="!p-6">
            <Eyebrow>Run</Eyebrow>
            {run === "idle" && (
              <>
                <p className="mt-3 text-sm text-muted">
                  {num(estimate)} rows · {columns.length} columns · {format === "tsv" ? "TSV" : "CSV"}
                </p>
                <Button className="w-full mt-5" onClick={start} disabled={columns.length === 0}>Run export</Button>
                <Button variant="secondary" size="sm" className="w-full mt-3" href="/app/schedules">Schedule this export</Button>
              </>
            )}
            {run === "running" && (
              <div className="mt-3" role="status" aria-live="polite">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2"><span aria-hidden className="size-2 rounded-full bg-secondary animate-pulse" />{stage}</span>
                  <span className="tabular text-muted">{Math.floor(progress)}%</span>
                </div>
                <div className="mt-3 h-2 rounded-full bg-line overflow-hidden">
                  <div className="h-full rounded-full bg-secondary transition-[width] duration-300" style={{ width: `${progress}%` }} />
                </div>
                <p className="mt-3 text-xs text-muted tabular">{num(Math.floor((estimate * progress) / 100))} of {num(estimate)} rows</p>
              </div>
            )}
            {run === "done" && fileUrl && (
              <div className="mt-3" role="status" aria-live="polite">
                <p className="text-sm flex items-center gap-2"><span aria-hidden className="size-2 rounded-full bg-primary" />Ready. Demo file with {num(buildRows(cfg, 400).length)} sample rows.</p>
                <a
                  href={fileUrl}
                  download={filename}
                  className="mt-5 inline-flex w-full items-center justify-center h-12 rounded-ctl bg-primary text-white font-normal hover:bg-primary-hover"
                >
                  Download {filename}
                </a>
                <div className="mt-3 flex gap-3">
                  <Button variant="secondary" size="sm" className="flex-1" onClick={() => setRun("idle")}>Edit</Button>
                  <Button variant="secondary" size="sm" className="flex-1" href="/app/schedules">Schedule</Button>
                </div>
              </div>
            )}
          </Card>
        </aside>
      </div>
    </>
  );
}
