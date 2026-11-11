import { Suspense, type ReactNode } from "react";
import Link from "next/link";
import { LyraLogo } from "@/components/brand";
import { ActiveNav, NavLinks } from "@/components/shell/nav";
import { MobileNav } from "@/components/shell/mobile-nav";
import { UserMenu, UserMenuFallback } from "@/components/shell/user-menu";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="lg:flex lg:h-dvh lg:overflow-hidden">
      {/* Barra lateral sobre o canvas (desktop) */}
      <aside className="hidden w-60 shrink-0 flex-col px-3 pt-4 pb-3 lg:flex">
        <Link href="/" className="mb-7 rounded-lg px-2 py-1 outline-none focus-visible:ring-2 focus-visible:ring-accent/40">
          <LyraLogo />
        </Link>
        <nav className="flex-1 overflow-y-auto" aria-label="Principal">
          <Suspense fallback={<NavLinks pathname={null} />}>
            <ActiveNav />
          </Suspense>
        </nav>
        <div className="border-t border-line pt-2">
          <Suspense fallback={<UserMenuFallback />}>
            <UserMenu />
          </Suspense>
        </div>
      </aside>

      {/* Barra superior (mobile) */}
      <header className="sticky top-0 z-30 flex h-12 items-center justify-between border-b border-line bg-canvas/90 px-2 backdrop-blur-md lg:hidden">
        <MobileNav
          userMenu={
            <Suspense fallback={<UserMenuFallback />}>
              <UserMenu />
            </Suspense>
          }
        />
        <Link href="/">
          <LyraLogo />
        </Link>
        <span className="size-8" aria-hidden />
      </header>

      {/* Painel principal flutuante */}
      <div className="min-w-0 flex-1 lg:py-2 lg:pr-2">
        <main
          id="main"
          className="relative flex min-h-[calc(100dvh-3rem)] flex-col bg-panel lg:h-full lg:min-h-0 lg:overflow-y-auto lg:rounded-xl lg:border lg:border-line lg:shadow-card lg:[scrollbar-gutter:stable]"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
