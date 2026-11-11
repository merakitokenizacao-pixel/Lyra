"use client";

import { useState, type ReactElement } from "react";
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
  Workflow,
  type LucideIcon,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { SIDEBAR_FADE } from "./sidebar";
import { useSidebarCollapsed } from "./sidebar-state";

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
  { href: "/funis", label: "Funis", icon: Workflow },
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

type NavOptions = {
  onNavigate?: () => void;
  /** Está no menu do desktop, que pode recolher para só os ícones. */
  collapsible?: boolean;
};

function NavLink({ item, active, onNavigate, collapsible }: NavOptions & { item: NavItem; active: boolean }) {
  const Icon = item.icon;
  const link = (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group flex h-8 items-center gap-2.5 overflow-hidden rounded-lg px-2.5 text-[13px] transition-colors",
        active
          ? "bg-panel font-medium text-ink shadow-[0_1px_2px_rgb(28_25_23/0.06),0_0_0_1px_rgb(28_25_23/0.04)]"
          : "text-ink-2 hover:bg-black/[0.035] hover:text-ink",
      )}
    >
      <Icon className={cn("size-4 shrink-0", active ? "text-accent" : "text-ink-3 group-hover:text-ink-2")} />
      {/* Corta sem reticências: os nomes cabem no menu aberto e, ao recolher, o texto some sob a borda */}
      <span className={cn("overflow-hidden whitespace-nowrap", SIDEBAR_FADE)}>{item.label}</span>
    </Link>
  );
  return collapsible ? <CollapsedLabel label={item.label}>{link}</CollapsedLabel> : link;
}

/** No menu recolhido, o nome do item aparece ao lado do ícone ao passar o mouse ou focar. */
function CollapsedLabel({ label, children }: { label: string; children: ReactElement }) {
  const collapsed = useSidebarCollapsed();
  const [open, setOpen] = useState(false);
  return (
    <Tooltip open={collapsed && open} onOpenChange={setOpen}>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side="right" sideOffset={14}>
        {label}
      </TooltipContent>
    </Tooltip>
  );
}

export function NavLinks({ pathname, ...options }: NavOptions & { pathname: string | null }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-0.5">
        {MAIN.map((item) => (
          <NavLink key={item.href} item={item} active={isActive(pathname, item.href)} {...options} />
        ))}
      </div>
      <div className="flex flex-col gap-0.5">
        <div className="relative px-2.5 pb-1">
          <p
            className={cn(
              "overflow-hidden text-[11px] font-medium tracking-wide whitespace-nowrap text-ink-4 uppercase",
              SIDEBAR_FADE,
            )}
          >
            Catálogo e conta
          </p>
          {/* Recolhido: uma linha separa os grupos no lugar do título */}
          <span aria-hidden className="absolute inset-x-2 -top-px hidden h-px bg-line collapsed:block" />
        </div>
        {SECONDARY.map((item) => (
          <NavLink key={item.href} item={item} active={isActive(pathname, item.match ?? item.href)} {...options} />
        ))}
      </div>
    </div>
  );
}

export function ActiveNav(options: NavOptions) {
  const pathname = usePathname();
  return <NavLinks pathname={pathname} {...options} />;
}
