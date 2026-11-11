"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  FileText,
  House,
  Package,
  Settings,
  SquareKanban,
  Target,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Prefixo que marca o item como ativo, quando difere do href. */
  match?: string;
};

const MAIN: NavItem[] = [
  { href: "/", label: "Início", icon: House },
  { href: "/pipeline", label: "Pipeline", icon: SquareKanban },
  { href: "/leads", label: "Leads", icon: Target },
  { href: "/clientes", label: "Clientes", icon: Building2 },
  { href: "/propostas", label: "Propostas", icon: FileText },
];

const SECONDARY: NavItem[] = [
  { href: "/produtos", label: "Produtos e serviços", icon: Package },
  // Vai direto para a primeira seção (evita o redirecionamento de /configuracoes)
  { href: "/configuracoes/empresa", match: "/configuracoes", label: "Configurações", icon: Settings },
];

function isActive(pathname: string | null, href: string) {
  if (!pathname) return false;
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLink({ item, active, onNavigate }: { item: NavItem; active: boolean; onNavigate?: () => void }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group flex h-8 items-center gap-2.5 rounded-lg px-2.5 text-[13px] transition-colors",
        active
          ? "bg-panel font-medium text-ink shadow-[0_1px_2px_rgb(28_25_23/0.06),0_0_0_1px_rgb(28_25_23/0.04)]"
          : "text-ink-2 hover:bg-black/[0.035] hover:text-ink",
      )}
    >
      <Icon className={cn("size-4 shrink-0", active ? "text-accent" : "text-ink-3 group-hover:text-ink-2")} />
      <span className="truncate">{item.label}</span>
    </Link>
  );
}

export function NavLinks({ pathname, onNavigate }: { pathname: string | null; onNavigate?: () => void }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-0.5">
        {MAIN.map((item) => (
          <NavLink key={item.href} item={item} active={isActive(pathname, item.href)} onNavigate={onNavigate} />
        ))}
      </div>
      <div className="flex flex-col gap-0.5">
        <p className="px-2.5 pb-1 text-[11px] font-medium tracking-wide text-ink-4 uppercase">Catálogo e conta</p>
        {SECONDARY.map((item) => (
          <NavLink key={item.href} item={item} active={isActive(pathname, item.match ?? item.href)} onNavigate={onNavigate} />
        ))}
      </div>
    </div>
  );
}

export function ActiveNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return <NavLinks pathname={pathname} onNavigate={onNavigate} />;
}
