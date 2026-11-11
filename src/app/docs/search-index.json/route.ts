import { DOCS } from "@/lib/docs-content";

// Plain text of every guide, built once at build time, so the docs search box needs no server work.
// The guides are React element trees; this walks them and collects the words (skipping attributes such as href and className).
const SKIP = new Set(["href", "className", "id", "key", "style", "src", "alt", "tone"]);
function words(node: unknown, out: string[]): void {
  if (node == null || typeof node === "boolean") return;
  if (typeof node === "string" || typeof node === "number") { out.push(String(node)); return; }
  if (Array.isArray(node)) { for (const n of node) words(n, out); return; }
  if (typeof node === "object") for (const [k, v] of Object.entries(node as Record<string, unknown>)) if (!SKIP.has(k) && k !== "type" && k !== "_owner" && k !== "$$typeof") words(v, out);
}
const plain = (n: unknown) => { const o: string[] = []; words(n, o); return o.join(" ").replace(/\s+/g, " ").toLowerCase().slice(0, 8000); };

export function GET() {
  return Response.json(DOCS.map((d) => ({ slug: d.slug, group: d.group, title: d.title, summary: d.summary, text: plain(d.body()) })));
}
