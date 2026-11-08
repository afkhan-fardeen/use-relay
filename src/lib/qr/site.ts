import { COMPANY } from "../company.ts";

/** The public address of the site, used to build dynamic short links. */
export const siteUrl = (): string => (process.env.NEXT_PUBLIC_SITE_URL || `https://${COMPANY.domain}`).replace(/\/$/, "");

export const shortUrl = (slug: string): string => `${siteUrl()}/r/${slug}`;
