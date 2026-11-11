import type { ReactNode } from "react";
import Link from "next/link";
import { LyroLogo } from "@/components/brand";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-canvas">
      <div className="grid-frame pointer-events-none absolute inset-0" aria-hidden />
      <header className="relative z-10 flex h-16 items-center px-5 sm:px-8">
        <Link href="/login">
          <LyroLogo />
        </Link>
      </header>
      <main className="relative z-10 flex flex-1 items-center justify-center px-4 pb-16">{children}</main>
      <footer className="relative z-10 pb-6 text-center text-xs text-ink-4">
        Lyro · CRM para leads, pipeline, clientes e propostas
      </footer>
    </div>
  );
}
