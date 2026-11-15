import { redirect } from "next/navigation";

// The Data Exporter changelog was retired. next.config.ts redirects this path too; this stub only exists until the folder is deleted.
export default function Retired() {
  redirect("/");
}
