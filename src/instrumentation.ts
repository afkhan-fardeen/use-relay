// Next.js calls this for every unhandled server error (pages, actions, route handlers).
export async function onRequestError(err: unknown, request: { path: string; method: string }, context: { routeType: string }) {
  if (process.env.NEXT_RUNTIME === "edge") return;
  const { reportError } = await import("./lib/report");
  reportError("request", err, { path: request.path.split("?")[0], method: request.method, routeType: context.routeType });
}
