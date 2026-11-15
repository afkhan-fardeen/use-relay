import { redirect } from "next/navigation";

// Klyroo Data Exporter was retired. next.config.ts redirects this path too; this stub only exists until the folder is deleted.
export default function Retired() {
  redirect("/");
}
