import { redirect } from "next/navigation";

// Launcher: sign-in and old links land here. There is one app today, so go straight to it.
export default function Launcher() {
  redirect("/export");
}
