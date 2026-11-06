import { createBrowserClient } from "@supabase/ssr";

// Browser client: anon key only. RLS decides what the signed-in user can read.
export function supabaseBrowser() {
  return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
}
