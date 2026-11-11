import { Suspense, type ReactNode } from "react";
import Link from "next/link";
import { LyroLogo } from "@/components/brand";
import { ActiveNav, NavLinks } from "@/components/shell/nav";
import { MobileNav } from "@/components/shell/mobile-nav";
import { SIDEBAR_FADE } from "@/components/shell/sidebar";
import { SidebarToggle } from "@/components/shell/sidebar-toggle";
import { UserMenu, UserMenuFallback } from "@/components/shell/user-menu";
import { cn } from "@/lib/utils";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="lg:flex lg:h-dvh lg:overflow-hidden">
      {/* Barra lateral sobre o canvas (desktop). Recolhe para só os ícones: veja shell/sidebar.ts.
          As larguras ficam no globals.css (--sidebar-width), que também mantém fixa a largura do conteúdo. */}
      <aside
        data-sidebar-root
        className="hidden w-(--sidebar-width) shrink-0 flex-col px-3 pt-5 pb-3 transition-[width] duration-200 ease-out collapsed:w-(--sidebar-collapsed-width) motion-reduce:transition-none lg:flex"
      >
        {/* Nome e seta na mesma linha do cabeçalho das páginas; recolhido, fica só a seta */}
        <div className="mb-3 flex h-8 items-center justify-between">
          {/* O respiro fica no nome, não no link: assim o link encolhe até zero e não empurra a seta */}
          <Link
            href="/"
            className={cn(
              "min-w-0 overflow-hidden rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-accent/40",
              SIDEBAR_FADE,
              "collapsed:invisible",
            )}
          >
            <LyroLogo className="px-2.5 py-1" />
          </Link>
          <SidebarToggle />
        </div>
        <nav className="flex-1 overflow-y-auto" aria-label="Principal">
          <Suspense fallback={<NavLinks pathname={null} />}>
            <ActiveNav />
          </Suspense>
        </nav>
        <div className="border-t border-line pt-2">
          <Suspense fallback={<UserMenuFallback />}>
            <UserMenu collapsible />
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
          <LyroLogo />
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
