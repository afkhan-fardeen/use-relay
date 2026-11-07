import "server-only";
import { notFound } from "next/navigation";
import { requireSession } from "./dal";

/** Owners of Klyroo itself: comma-separated emails in ADMIN_EMAILS. Anyone else gets a 404. */
export function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
}

export async function requireAdmin() {
  const s = await requireSession();
  if (!adminEmails().includes(s.email.toLowerCase())) notFound();
  return s;
}
