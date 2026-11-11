import type { ReactNode } from "react";
import { Logo } from "@/components/logo";

/** Full-page message for 404s and errors, in the brand. */
export function StatusPage({ code, title, children, actions }: { code?: string; title: string; children: ReactNode; actions: ReactNode }) {
  return (
    <main className="flex-1 grid place-items-center px-6 py-16 bg-gradient-to-b from-white to-[#F6F5FF]">
      <div className="w-full max-w-[520px] text-center">
        <div className="flex justify-center mb-10"><Logo /></div>
        {code && <p aria-hidden className="anim-fade-up text-[96px] leading-none font-normal tracking-[-0.04em] text-primary/90">{code}</p>}
        <h1 className="anim-fade-up delay-1 mt-4 text-[32px] leading-[1.15] font-normal">{title}</h1>
        <p className="anim-fade-up delay-2 mt-3 text-[16px] leading-[26px] text-muted">{children}</p>
        <div className="anim-fade-up delay-3 mt-8 flex flex-col sm:flex-row gap-3 justify-center">{actions}</div>
      </div>
    </main>
  );
}
