import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { supabaseServer } from "@/lib/supabase/server";

// Email links land here: confirmation, password reset. Two formats are accepted:
//  - ?code=...                      (default Supabase email: one-time code, same browser)
//  - ?token_hash=...&type=recovery  (custom email template: works on any device)
// "next" may only be one of our own pages.
const NEXT = new Set(["/app", "/reset-password"]);
const TYPES = new Set(["signup", "recovery", "email", "magiclink", "email_change", "invite"]);

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") ?? "";
  const requested = searchParams.get("next") ?? "";
  const next = type === "recovery" ? "/reset-password" : NEXT.has(requested) ? requested : "/app";

  const supabase = await supabaseServer();
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  } else if (tokenHash && TYPES.has(type)) {
    const { error } = await supabase.auth.verifyOtp({ type: type as EmailOtpType, token_hash: tokenHash });
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  }
  return NextResponse.redirect(`${origin}/login?link=expired`);
}
