// Public details for the website and the legal pages. Like other independent Shopify app makers, we publish the
// brand and a support email, not a personal name or postal address.

export const COMPANY = {
  brand: "Klyroo",
  supportEmail: "support@useklyroo.com",
  domain: "useklyroo.com",
  policiesUpdated: "11 November 2026",
} as const;

/** The name used in the legal pages. */
export const operatorName = (): string => COMPANY.brand;
export const footerName = (): string => COMPANY.brand;
/** Nothing is required for launch any more; kept so scripts that call it keep working. */
export function missingCompanyDetails(): string[] { return []; }
