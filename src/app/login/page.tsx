import { Logo } from "@/components/sidebar";
import { Card } from "@/components/ui";
import { AuthForm } from "./auth-form";

export default function Login() {
  return (
    <main className="flex-1 grid place-items-center px-6 py-16">
      <div className="w-full max-w-[420px]">
        <div className="flex justify-center mb-10"><Logo tool={null} /></div>
        <Card featured>
          <h1 className="text-[26px] leading-[1.15] font-light">Welcome to Userelay</h1>
          <p className="mt-1 mb-7 text-sm text-muted">Create an account, then connect your Shopify store.</p>
          <AuthForm />
        </Card>
      </div>
    </main>
  );
}
