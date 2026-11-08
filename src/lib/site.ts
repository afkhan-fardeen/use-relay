import { COMPANY } from "./company.ts";

/** The public address of the site (checkout return addresses and absolute links). */
export const siteUrl = (): string => (process.env.NEXT_PUBLIC_SITE_URL || `https://${COMPANY.domain}`).replace(/\/$/, "");
