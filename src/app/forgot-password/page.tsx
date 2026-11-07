import Link from "next/link";
import { Logo } from "@/components/logo";
import { Card } from "@/components/ui";
import { ForgotForm } from "./form";

export const metadata = { title: "Reset your password — Klyroo", robots: { index: false } };

export default function ForgotPassword() {
  return (
    <main className="flex-1 grid place-items-center px-6 py-16">
      <div className="w-full max-w-[420px]">
        <div className="flex justify-center mb-10"><Logo tool={null} /></div>
        <Card featured>
          <h1 className="text-[26px] leading-[1.15] font-light">Reset your password</h1>
          <p className="mt-1 mb-7 text-sm text-muted">Enter your email and we&apos;ll send you a link to choose a new password.</p>
          <ForgotForm />
          <p className="mt-6 text-sm"><Link href="/login" className="text-primary">Back to log in</Link></p>
        </Card>
      </div>
    </main>
  );
}
