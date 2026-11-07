import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { Logo } from "@/components/logo";
import { Notice } from "@/components/notice";
import { Card } from "@/components/ui";
import { supabaseServer } from "@/lib/supabase/server";
import { ResetForm } from "./form";

export const metadata = { title: "Choose a new password — Klyroo", robots: { index: false } };

export default function ResetPassword() {
  return (
    <Suspense fallback={null}>
      <ResetBody />
    </Suspense>
  );
}

async function ResetBody() {
  await connection();
  const { data } = await (await supabaseServer()).auth.getUser();
  return (
    <main className="flex-1 grid place-items-center px-6 py-16">
      <div className="w-full max-w-[420px]">
        <div className="flex justify-center mb-10"><Logo tool={null} /></div>
        <Card featured>
          <h1 className="text-[26px] leading-[1.15] font-light">Choose a new password</h1>
          {data.user ? (
            <>
              <p className="mt-1 mb-7 text-sm text-muted">For {data.user.email}. Use at least 10 characters.</p>
              <ResetForm />
            </>
          ) : (
            <>
              <Notice tone="warning" className="mt-5">This reset link has expired or was already used.</Notice>
              <p className="mt-5 text-sm"><Link href="/forgot-password" className="text-primary">Send me a new link</Link></p>
            </>
          )}
        </Card>
      </div>
    </main>
  );
}
