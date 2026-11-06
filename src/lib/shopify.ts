import "server-only";

// Small, safe Shopify Admin client for connecting a store.
// - Only *.myshopify.com hosts (blocks SSRF to arbitrary addresses).
// - Redirects are never followed; every request has a timeout.
// - Secrets and tokens are never logged or put in error messages.

export const SHOPIFY_API_VERSION = process.env.SHOPIFY_API_VERSION || "2026-07";

const DOMAIN = /^[a-z0-9][a-z0-9-]{0,60}\.myshopify\.com$/;

/** Accepts "store", "store.myshopify.com", or a pasted https:// URL. Returns null if invalid. */
export function normalizeDomain(input: string): string | null {
  let d = input.trim().toLowerCase();
  d = d.replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  if (d && !d.includes(".")) d = `${d}.myshopify.com`;
  return DOMAIN.test(d) ? d : null;
}

export type ShopifyErrorCode =
  | "invalid_credentials" // wrong ID/secret
  | "app_not_installed"
  | "shop_not_found"
  | "wrong_organization" // app and store belong to different organizations
  | "unavailable" // network / Shopify down / timeout
  | "unexpected";

export class ShopifyError extends Error {
  constructor(public code: ShopifyErrorCode, message: string) {
    super(message);
  }
}

export const FRIENDLY: Record<ShopifyErrorCode, string> = {
  invalid_credentials: "Shopify rejected these credentials. Re-copy the Client ID and Client secret from your app's Settings page.",
  app_not_installed: "The app isn't installed on this store yet. Install it from the app's Home tab in the Dev Dashboard, then try again.",
  shop_not_found: "We couldn't find that store. Check the address (it ends in .myshopify.com).",
  wrong_organization:
    "Shopify won't issue a token for this app and store. The app must be created in the same organization that owns the store.",
  unavailable: "We couldn't reach Shopify. Try again in a minute.",
  unexpected: "Something unexpected happened while talking to Shopify. Try again, or contact support.",
};

async function call(url: string, init: RequestInit): Promise<Response> {
  try {
    return await fetch(url, { ...init, redirect: "manual", signal: AbortSignal.timeout(15_000), cache: "no-store" });
  } catch {
    throw new ShopifyError("unavailable", FRIENDLY.unavailable);
  }
}

/** Exchange client ID + secret for a short-lived (about 24h) Admin API token. */
export async function mintToken(domain: string, clientId: string, clientSecret: string): Promise<string> {
  const res = await call(`https://${domain}/admin/oauth/access_token`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded", accept: "application/json" },
    body: new URLSearchParams({ grant_type: "client_credentials", client_id: clientId, client_secret: clientSecret }),
  });

  if (res.ok) {
    const body = (await res.json().catch(() => null)) as { access_token?: string } | null;
    if (body?.access_token) return body.access_token;
    throw new ShopifyError("unexpected", FRIENDLY.unexpected);
  }

  const text = (await res.text().catch(() => "")).toLowerCase().slice(0, 500);
  if (res.status >= 300 && res.status < 400) throw new ShopifyError("shop_not_found", FRIENDLY.shop_not_found);
  if (res.status === 404) throw new ShopifyError("shop_not_found", FRIENDLY.shop_not_found);
  if (res.status >= 500 || res.status === 429) throw new ShopifyError("unavailable", FRIENDLY.unavailable);
  if (text.includes("not installed") || text.includes("app_not_installed")) throw new ShopifyError("app_not_installed", FRIENDLY.app_not_installed);
  if (text.includes("organization") || text.includes("not allowed") || text.includes("unauthorized_client"))
    throw new ShopifyError("wrong_organization", FRIENDLY.wrong_organization);
  if (res.status === 400 || res.status === 401 || res.status === 403) throw new ShopifyError("invalid_credentials", FRIENDLY.invalid_credentials);
  throw new ShopifyError("unexpected", FRIENDLY.unexpected);
}

export type ShopInfo = { name: string; currencyCode: string; scopes: string[] };

/** Read the shop name, currency and the permissions this app was actually granted. */
export async function fetchShopInfo(domain: string, token: string): Promise<ShopInfo> {
  const res = await call(`https://${domain}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-shopify-access-token": token },
    body: JSON.stringify({
      query: "{ shop { name currencyCode } currentAppInstallation { accessScopes { handle } } }",
    }),
  });
  if (res.status === 401 || res.status === 403) throw new ShopifyError("invalid_credentials", FRIENDLY.invalid_credentials);
  if (res.status >= 500 || res.status === 429) throw new ShopifyError("unavailable", FRIENDLY.unavailable);
  if (!res.ok) throw new ShopifyError("unexpected", FRIENDLY.unexpected);

  const body = (await res.json().catch(() => null)) as {
    data?: { shop?: { name: string; currencyCode: string }; currentAppInstallation?: { accessScopes: { handle: string }[] } };
    errors?: unknown;
  } | null;
  const shop = body?.data?.shop;
  if (!shop) throw new ShopifyError("unexpected", FRIENDLY.unexpected);
  return {
    name: shop.name,
    currencyCode: shop.currencyCode,
    scopes: (body?.data?.currentAppInstallation?.accessScopes ?? []).map((s) => s.handle).sort(),
  };
}
