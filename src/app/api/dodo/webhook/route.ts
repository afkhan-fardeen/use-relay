import { processDodoWebhook } from "@/lib/billing/webhook";

// Dodo Payments posts subscription events here. The body must be read as raw text:
// the signature is computed over the exact bytes Dodo sent.
export async function POST(req: Request) {
  const raw = await req.text();
  if (raw.length > 1_000_000) return new Response("Payload too large", { status: 413 });
  const result = await processDodoWebhook(raw, {
    id: req.headers.get("webhook-id"),
    timestamp: req.headers.get("webhook-timestamp"),
    signature: req.headers.get("webhook-signature"),
  });
  return Response.json(result.body, { status: result.status });
}
