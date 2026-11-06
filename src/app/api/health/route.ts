// Render health check. Returns 200 if the app is up. No secrets, no database call.
export async function GET() {
  return Response.json({ ok: true });
}
