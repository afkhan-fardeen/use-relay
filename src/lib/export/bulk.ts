// Shopify Admin GraphQL helpers for exports: plain queries, bulk operations, JSONL download.

import { FRIENDLY, SHOPIFY_API_VERSION, ShopifyError, call, origin } from "../shopify.ts";
import { LimitError } from "./processors.ts";

/** An export failure with a code, a merchant-readable message, and whether a retry could help. */
export class JobError extends Error {
  code: string;
  retryable: boolean;
  constructor(code: string, message: string, retryable = false) {
    super(message);
    this.code = code;
    this.retryable = retryable;
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Json = any;

export async function gql(domain: string, token: string, query: string, variables?: Record<string, unknown>): Promise<Json> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const res = await call(
      `${origin(domain)}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`,
      {
        method: "POST",
        headers: { "content-type": "application/json", "x-shopify-access-token": token },
        body: JSON.stringify({ query, variables }),
      },
      60_000,
    );
    if (res.status === 401 || res.status === 403) throw new ShopifyError("invalid_credentials", FRIENDLY.invalid_credentials);
    if (res.status === 429 || res.status >= 500) {
      await sleep(Math.min(8000, 500 * 2 ** attempt));
      continue;
    }
    if (!res.ok) throw new ShopifyError("unexpected", FRIENDLY.unexpected);
    const body = (await res.json().catch(() => null)) as Json;
    if (!body) throw new ShopifyError("unexpected", FRIENDLY.unexpected);
    if (body.errors?.length) {
      const throttled = body.errors.some((e: Json) => e?.extensions?.code === "THROTTLED");
      if (throttled) {
        await sleep(Math.min(8000, 1000 * 2 ** attempt));
        continue;
      }
      const first = String(body.errors[0]?.message ?? "Shopify returned an error.").slice(0, 300);
      if (/access denied|not approved|scope/i.test(first)) {
        throw new JobError("missing_scope", `Shopify denied access to some data this export needs. ${first}`);
      }
      throw new JobError("query_error", `Shopify couldn't run this export: ${first}`);
    }
    return body.data;
  }
  throw new ShopifyError("unavailable", FRIENDLY.unavailable);
}

export async function startBulk(domain: string, token: string, inner: string): Promise<string> {
  const data = await gql(
    domain,
    token,
    `mutation ($q: String!) { bulkOperationRunQuery(query: $q) { bulkOperation { id status } userErrors { field message } } }`,
    { q: inner },
  );
  const r = data?.bulkOperationRunQuery;
  const err = r?.userErrors?.[0]?.message as string | undefined;
  if (err) {
    if (/already (in progress|running)|in progress/i.test(err)) throw new JobError("busy", "Another export is running for this store. Retrying shortly.", true);
    if (/not (enabled|allowed)|enable/i.test(err)) {
      throw new JobError("bulk_not_enabled", `Shopify says bulk exports aren't enabled for this app yet: ${err.slice(0, 200)}`);
    }
    throw new JobError("bulk_rejected", `Shopify rejected the export: ${err.slice(0, 300)}`);
  }
  const id = r?.bulkOperation?.id as string | undefined;
  if (!id) throw new JobError("bulk_rejected", "Shopify didn't start the export. Try again.", true);
  return id;
}

export type BulkStatus = {
  id: string;
  status: string;
  errorCode: string | null;
  objectCount: string | null;
  url: string | null;
  partialDataUrl: string | null;
};

export async function pollBulk(domain: string, token: string, id: string): Promise<BulkStatus | null> {
  const data = await gql(
    domain,
    token,
    `query ($id: ID!) { node(id: $id) { ... on BulkOperation { id status errorCode objectCount url partialDataUrl } } }`,
    { id },
  );
  return (data?.node as BulkStatus | null) ?? null;
}

/** Waits until Shopify finishes the bulk operation. `tick` is called on every poll (heartbeat + progress). */
export async function waitForBulk(
  domain: string,
  token: string,
  id: string,
  tick: (objectCount: number) => Promise<void>,
  maxWaitMs = 45 * 60_000,
): Promise<{ url: string | null; objectCount: number }> {
  const started = Date.now();
  let delay = 1500;
  for (;;) {
    const op = await pollBulk(domain, token, id);
    if (!op) throw new JobError("bulk_lost", "Shopify lost track of the export. Retrying.", true);
    const count = Number(op.objectCount ?? 0);
    await tick(count);
    switch (op.status) {
      case "COMPLETED":
        return { url: op.url, objectCount: count };
      case "FAILED":
        if (op.errorCode === "ACCESS_DENIED") {
          throw new JobError("missing_scope", "Your Shopify app is missing a permission this export needs. Add the read scope in the Dev Dashboard, release a new version, and try again.");
        }
        throw new JobError("bulk_failed", `Shopify couldn't finish the export (${op.errorCode ?? "unknown"}). Retrying.`, true);
      case "CANCELED":
      case "CANCELING":
      case "EXPIRED":
        throw new JobError("bulk_canceled", "Shopify stopped the export. Retrying.", true);
    }
    if (Date.now() - started > maxWaitMs) throw new JobError("timeout", "Shopify took too long to prepare this export. Try narrowing it with filters.");
    await sleep(delay);
    delay = Math.min(10_000, Math.round(delay * 1.4));
  }
}

/** Streams the JSONL result file line by line without holding it in memory. */
export async function streamJsonl(
  url: string,
  onLine: (line: Json) => void,
  afterChunk: () => Promise<void>,
): Promise<number> {
  const u = new URL(url);
  const testing = process.env.NODE_ENV !== "production";
  if (u.protocol !== "https:" && !(testing && u.protocol === "http:")) throw new JobError("bad_result_url", "Shopify returned an unexpected download address.");

  let res: Response;
  try {
    res = await fetch(url, { redirect: "manual", signal: AbortSignal.timeout(10 * 60_000), cache: "no-store" });
  } catch {
    throw new JobError("download_failed", "Couldn't download the data from Shopify. Retrying.", true);
  }
  if (!res.ok || !res.body) throw new JobError("download_failed", "Couldn't download the data from Shopify. Retrying.", true);

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let tail = "";
  let lines = 0;
  const handle = (text: string) => {
    if (!text.trim()) return;
    let parsed: Json;
    try {
      parsed = JSON.parse(text);
    } catch {
      throw new JobError("bad_data", "Shopify sent data we couldn't read. Retrying.", true);
    }
    lines++;
    onLine(parsed);
  };
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      tail += decoder.decode(value, { stream: true });
      let nl: number;
      while ((nl = tail.indexOf("\n")) >= 0) {
        handle(tail.slice(0, nl));
        tail = tail.slice(nl + 1);
      }
      await afterChunk();
    }
    tail += decoder.decode();
    handle(tail);
  } catch (e) {
    if (e instanceof JobError || e instanceof LimitError) throw e;
    throw new JobError("download_failed", "The download from Shopify was interrupted. Retrying.", true);
  } finally {
    reader.releaseLock?.();
  }
  return lines;
}
