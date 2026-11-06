import { Suspense } from "react";
import { Builder } from "./builder";

export const metadata = { title: "New export — Userelay Export" };

export default function NewExportPage() {
  return (
    <Suspense fallback={<p className="text-muted">Loading builder…</p>}>
      <Builder />
    </Suspense>
  );
}
