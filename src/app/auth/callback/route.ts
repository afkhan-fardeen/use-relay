import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

// Email confirmation link lands here: exchange the one-time code for a session.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  if (code) {
    const supabase = await supabaseServer();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}/app`);
  }
  return NextResponse.redirect(`${origin}/login`);
}
