// A tiny fake Shopify for tests: token endpoint, bulk operation start/poll, and a JSONL result file.
import http from "node:http";

export function startFakeShopify() {
  const state = {
    scenario: { mode: "ok", lines: [], pollsBeforeDone: 2 },
    bulkStarts: 0,
    startedQueries: [],
    tokenCalls: 0,
    ops: new Map(), // id -> { polls }
    nextOp: 1,
  };

  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, "http://x");
    const body = await new Promise((r) => {
      let d = "";
      req.on("data", (c) => (d += c));
      req.on("end", () => r(d));
    });
    const json = (code, obj) => {
      res.writeHead(code, { "content-type": "application/json" });
      res.end(JSON.stringify(obj));
    };
    const sc = state.scenario;

    if (url.pathname === "/admin/oauth/access_token") {
      state.tokenCalls++;
      const p = new URLSearchParams(body);
      if (sc.mode === "tokenRevoked" || p.get("client_secret") === "wrong") return json(400, { error: "invalid_client" });
      return json(200, { access_token: "shpat_fake_token", scope: "read_products" });
    }

    if (url.pathname.endsWith("/graphql.json")) {
      if (req.headers["x-shopify-access-token"] !== "shpat_fake_token") return json(401, { errors: "unauthorized" });
      const { query, variables } = JSON.parse(body);

      if (query.includes("bulkOperationRunQuery")) {
        state.bulkStarts++;
        state.startedQueries.push(variables.q);
        if (sc.mode === "busyOnce" && state.bulkStarts === 1) {
          return json(200, { data: { bulkOperationRunQuery: { bulkOperation: null, userErrors: [{ field: null, message: "A bulk query operation for this app and shop is already in progress: gid://shopify/BulkOperation/999." }] } } });
        }
        if (sc.mode === "notEnabled") {
          return json(200, { data: { bulkOperationRunQuery: { bulkOperation: null, userErrors: [{ field: null, message: "Bulk queries are not enabled for this app." }] } } });
        }
        const id = `gid://shopify/BulkOperation/${state.nextOp++}`;
        state.ops.set(id, { polls: 0 });
        return json(200, { data: { bulkOperationRunQuery: { bulkOperation: { id, status: "CREATED" }, userErrors: [] } } });
      }

      if (query.includes("node(id")) {
        const id = variables.id;
        const op = state.ops.get(id) ?? (sc.knownOps?.includes(id) ? { polls: 99 } : null);
        if (!op) return json(200, { data: { node: null } });
        op.polls++;
        if (sc.mode === "accessDenied") return json(200, { data: { node: { id, status: "FAILED", errorCode: "ACCESS_DENIED", objectCount: "0", url: null, partialDataUrl: null } } });
        if (op.failed || (sc.mode === "bulkFailedOnce" && !sc.failedOnce)) {
          sc.failedOnce = true;
          op.failed = true; // a failed Shopify operation stays failed
          return json(200, { data: { node: { id, status: "FAILED", errorCode: "INTERNAL_SERVER_ERROR", objectCount: "0", url: null, partialDataUrl: null } } });
        }
        if (op.polls < sc.pollsBeforeDone) return json(200, { data: { node: { id, status: "RUNNING", errorCode: null, objectCount: String(op.polls * 10), url: null, partialDataUrl: null } } });
        const resultUrl = sc.mode === "empty" ? null : `http://127.0.0.1:${server.address().port}/result.jsonl`;
        return json(200, { data: { node: { id, status: "COMPLETED", errorCode: null, objectCount: String(sc.lines.length), url: resultUrl, partialDataUrl: null } } });
      }

      for (const root of ["products", "orders", "customers", "inventoryItems", "collections"]) {
        if (query.includes(`${root}(first:`)) {
          state.previewQueries = (state.previewQueries ?? 0) + 1;
          if (sc.previewError) return json(200, { errors: [{ message: sc.previewError }] });
          return json(200, { data: { [root]: sc.preview?.[root] ?? { edges: [] } } });
        }
      }
      if (query.includes("shop {")) return json(200, { data: { shop: { name: "Fake", currencyCode: "USD" } } });
      return json(200, { data: {} });
    }

    if (url.pathname === "/result.jsonl") {
      res.writeHead(200, { "content-type": "application/jsonl" });
      // Send in small, awkward chunks to exercise line splitting.
      const text = sc.lines.map((l) => JSON.stringify(l)).join("\n") + "\n";
      for (let i = 0; i < text.length; i += 37) res.write(text.slice(i, i + 37));
      return res.end();
    }

    res.writeHead(404);
    res.end();
  });

  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve({ server, state, port: server.address().port, close: () => new Promise((r) => server.close(r)) }));
  });
}
