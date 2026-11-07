// Company details shown on the public site and in the legal pages.
// Paddle requires the legal entity name and a way to contact it; fill the empty fields before
// submitting your domain for approval. `npm run check:launch` lists what is still missing.

export const COMPANY = {
  brand: "Klyroo",
  /** The registered legal name of the business that sells Klyroo, for example "Klyroo Ltd". REQUIRED. */
  legalName: "",
  /** Registered office address, one line. REQUIRED by Paddle's privacy-notice guidance. */
  registeredAddress: "",
  /** Country of registration, for example "United Kingdom". REQUIRED. */
  country: "",
  /** Law that governs the terms, for example "England and Wales". REQUIRED. */
  governingLaw: "",
  supportEmail: "support@useklyroo.com",
  domain: "useklyroo.com",
  policiesUpdated: "7 November 2026",
} as const;

/** Name to show wherever the seller is named: the legal name once set, else the brand. */
export const operatorName = (): string => COMPANY.legalName || COMPANY.brand;

export function missingCompanyDetails(): string[] {
  const out: string[] = [];
  if (!COMPANY.legalName) out.push("legalName");
  if (!COMPANY.registeredAddress) out.push("registeredAddress");
  if (!COMPANY.country) out.push("country");
  if (!COMPANY.governingLaw) out.push("governingLaw");
  return out;
}
