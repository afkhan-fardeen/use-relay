// Company details shown on the public site and in the legal pages.
// You sell as an individual (sole trader): enter your full legal name below. Dodo Payments (our Merchant of Record) needs the
// seller's legal name and a way to contact it; fill the empty fields before
// submitting your domain for approval. `npm run check:launch` lists what is still missing.

export const COMPANY = {
  brand: "Klyroo",
  /** "individual" = you sell as a person (sole trader) and trade as Klyroo. "company" = a registered company. */
  entity: "individual" as "individual" | "company",
  /** Individual: your full legal name, as on your ID. Company: the registered company name, e.g. "Klyroo Ltd". REQUIRED. */
  legalName: "",
  /** A postal address where you can be reached, one line. REQUIRED. Home address for an individual unless you use a business or correspondence address. */
  registeredAddress: "",
  /** Country where you are based, for example "United Kingdom". REQUIRED. */
  country: "",
  /** Law that governs the terms, for example "England and Wales". REQUIRED. */
  governingLaw: "",
  supportEmail: "support@useklyroo.com",
  domain: "useklyroo.com",
  policiesUpdated: "11 November 2026",
} as const;

/** The seller as it should be named in the legal pages: "Jane Doe, trading as Klyroo" for an individual, the company name for a company. */
export const operatorName = (): string => {
  if (!COMPANY.legalName) return COMPANY.brand;
  return COMPANY.entity === "individual" ? `${COMPANY.legalName}, trading as ${COMPANY.brand}` : COMPANY.legalName;
};

/** Short form for the page footer. */
export const footerName = (): string => operatorName();

export function missingCompanyDetails(): string[] {
  const out: string[] = [];
  if (!COMPANY.legalName) out.push("legalName");
  if (!COMPANY.registeredAddress) out.push("registeredAddress");
  if (!COMPANY.country) out.push("country");
  if (!COMPANY.governingLaw) out.push("governingLaw");
  return out;
}
