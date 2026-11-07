import { processPaddleWebhook } from "@/lib/billing/webhook";

// Paddle posts subscription events here. The body must be read as raw text: the signature
// is computed over the exact bytes Paddle sent.
export async function POST(req: Request) {
  const raw = await req.text();
  if (raw.length > 1_000_000) return new Response("Payload too large", { status: 413 });
  const result = await processPaddleWebhook(raw, req.headers.get("paddle-signature"));
  return Response.json(result.body, { status: result.status });
}
