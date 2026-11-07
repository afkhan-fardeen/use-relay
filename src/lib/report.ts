import "server-only";
import { allow } from "./ratelimit.ts";

/**
 * Report an unexpected server error: always logged as one JSON line; if ERROR_WEBHOOK_URL is set
 * (a Slack or Discord incoming webhook) it is also posted there, at most 10 a minute.
 * Never include secrets or customer data in `context`.
 */
export function reportError(where: string, err: unknown, context: Record<string, unknown> = {}): void {
  const message = err instanceof Error ? err.message : String(err);
  console.error(JSON.stringify({ level: "error", where, message: message.slice(0, 500), ...context }));
  const hook = process.env.ERROR_WEBHOOK_URL;
  if (!hook || !hook.startsWith("https://") || !allow("report", 10, 60_000)) return;
  const text = `Klyroo error in ${where}: ${message.slice(0, 300)}`;
  void fetch(hook, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ text, content: text }), signal: AbortSignal.timeout(5000) }).catch(() => undefined);
}
