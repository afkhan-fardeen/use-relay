import Link from "next/link";
import { Logo } from "@/components/sidebar";
import { Button, Card, Field, inputCls } from "@/components/ui";

export default function Login() {
  return (
    <main className="flex-1 grid place-items-center px-6 py-16">
      <div className="w-full max-w-[420px]">
        <div className="flex justify-center mb-10"><Logo /></div>
        <Card featured>
          <h1 className="text-[29px] leading-[35px] font-light">Start free</h1>
          <p className="mt-1 text-sm text-muted">Create your account, then connect your store.</p>
          <form className="mt-8 space-y-5">
            <Field label="Work email"><input type="email" autoComplete="email" className={inputCls} placeholder="you@brand.com" /></Field>
            <Field label="Password"><input type="password" autoComplete="new-password" className={inputCls} placeholder="At least 10 characters" /></Field>
            <Button href="/app/stores" className="w-full">Create account</Button>
          </form>
          <div className="my-6 flex items-center gap-3 text-xs text-muted"><span className="flex-1 border-t border-line" />or<span className="flex-1 border-t border-line" /></div>
          <Button variant="secondary" className="w-full" type="button">Email me a magic link</Button>
        </Card>
        <p className="mt-6 text-center text-sm text-muted">
          Already have an account? <Link href="/app" className="font-normal text-ink hover:text-primary">Log in</Link>
        </p>
      </div>
    </main>
  );
}
