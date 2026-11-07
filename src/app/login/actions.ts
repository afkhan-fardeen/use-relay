"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";

export type AuthState = { error?: string; message?: string; email?: string; fullName?: string; company?: string } | undefined;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function read(formData: FormData) {
  return {
    email: String(formData.get("email") ?? "").trim().toLowerCase(),
    password: String(formData.get("password") ?? ""),
  };
}

export async function signIn(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const { email, password } = read(formData);
  if (!EMAIL.test(email) || !password) return { error: "Enter your email and password.", email };

  const supabase = await supabaseServer();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    // Same message for unknown email and wrong password.
    if (/confirm/i.test(error.message)) return { error: "Confirm your email first. Check your inbox for the link.", email };
    return { error: "Email or password is incorrect.", email };
  }
  redirect("/app");
}

export async function signUp(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const { email, password } = read(formData);
  const fullName = String(formData.get("fullName") ?? "").trim();
  const company = String(formData.get("company") ?? "").trim();
  if (!fullName || fullName.length > 80) return { error: "Enter your name (up to 80 characters).", email, fullName, company };
  if (company.length > 80) return { error: "Company name can be up to 80 characters.", email, fullName, company };
  if (!EMAIL.test(email)) return { error: "Enter a valid email address.", email, fullName, company };
  if (password.length < 10) return { error: "Use a password of at least 10 characters.", email, fullName, company };
  if (password.length > 200) return { error: "That password is too long.", email, fullName, company };

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? (host?.startsWith("localhost") ? "http" : "https");
  const origin = host ? `${proto}://${host}` : undefined;

  const supabase = await supabaseServer();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: origin ? `${origin}/auth/callback` : undefined, data: { full_name: fullName, company } },
  });
  if (error) {
    if (/already|registered/i.test(error.message)) return { error: "An account with this email already exists. Log in instead.", email, fullName, company };
    if (/rate|too many/i.test(error.message)) return { error: "Too many attempts. Wait a few minutes and try again.", email, fullName, company };
    return { error: "We couldn't create your account. Try again.", email, fullName, company };
  }
  if (data.session) redirect("/onboarding");
  return { message: "Check your email for a confirmation link, then come back and log in.", email };
}

export async function signOut() {
  const supabase = await supabaseServer();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function resendConfirmation(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!EMAIL.test(email)) return { error: "Enter your email address first.", email };
  const supabase = await supabaseServer();
  const { error } = await supabase.auth.resend({ type: "signup", email });
  if (error) {
    if (/rate|too many|seconds/i.test(error.message)) return { error: "Please wait a minute before asking for another email.", email };
    return { error: "We couldn't send the email. Try again shortly.", email };
  }
  return { message: "Sent. Check your inbox and your spam folder.", email };
}
