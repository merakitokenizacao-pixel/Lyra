"use client";

import { useEffect, useRef, type Ref } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, CircleUserRound, SquareKanban, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Item = { href: string; label: string; icon: LucideIcon };

const GROUPS: { label: string; items: Item[] }[] = [
  {
    label: "Empresa",
    items: [
      { href: "/configuracoes/empresa", label: "Empresa e time", icon: Building2 },
      { href: "/configuracoes/pipeline", label: "Etapas do pipeline", icon: SquareKanban },
    ],
  },
  {
    label: "Pessoal",
    items: [{ href: "/configuracoes/conta", label: "Minha conta", icon: CircleUserRound }],
  },
];

/** No desktop, coluna com grupos; no celular, uma linha rolável com as mesmas seções. */
export function SettingsNavLinks({ pathname, navRef }: { pathname: string | null; navRef?: Ref<HTMLElement> }) {
  return (
    <nav
      ref={navRef}
      aria-label="Seções das configurações"
      className={cn(
        "-mx-4 flex gap-1 overflow-x-auto px-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:flex-col lg:gap-6 lg:overflow-visible lg:px-0",
        "no-scrollbar",
      )}
    >
      {GROUPS.map((group) => (
        <div key={group.label} className="flex shrink-0 gap-1 lg:flex-col lg:gap-0.5">
          <p className="hidden px-2.5 pb-1 text-[11px] font-medium tracking-wide text-ink-4 uppercase lg:block">{group.label}</p>
          {group.items.map((item) => {
            const active = pathname === item.href || (pathname?.startsWith(`${item.href}/`) ?? false);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group flex h-8 shrink-0 items-center gap-2.5 rounded-lg px-2.5 text-[13px] whitespace-nowrap transition-colors",
                  "outline-none focus-visible:ring-2 focus-visible:ring-accent/40",
                  active ? "bg-hover font-medium text-ink" : "text-ink-2 hover:bg-hover/70 hover:text-ink",
                )}
              >
                <Icon className={cn("size-4 shrink-0", active ? "text-accent" : "text-ink-3 group-hover:text-ink-2")} />
                {item.label}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

export function SettingsNav() {
  const pathname = usePathname();
  const navRef = useRef<HTMLElement>(null);

  // No celular a linha de seções rola na horizontal: mantém a seção ativa à vista
  useEffect(() => {
    const nav = navRef.current;
    const active = nav?.querySelector<HTMLElement>('[aria-current="page"]');
    if (!nav || !active || nav.scrollWidth <= nav.clientWidth) return;
    const bounds = nav.getBoundingClientRect();
    const rect = active.getBoundingClientRect();
    if (rect.left < bounds.left || rect.right > bounds.right) {
      nav.scrollLeft += rect.left - bounds.left - 16;
    }
  }, [pathname]);

  return <SettingsNavLinks pathname={pathname} navRef={navRef} />;
}
