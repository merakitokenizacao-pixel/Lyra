"use client";

import { ChevronsLeft } from "lucide-react";
import { setSidebarCollapsed, useSidebarAttribute, useSidebarCollapsed } from "./sidebar-state";

/** Seta do topo do menu: recolhe para só os ícones e abre de novo. Sem dica flutuante: o nome fica no aria-label. */
export function SidebarToggle() {
  const collapsed = useSidebarCollapsed();
  useSidebarAttribute();
  const label = collapsed ? "Expandir menu" : "Recolher menu";

  return (
    <button
      type="button"
      aria-label={label}
      onClick={() => setSidebarCollapsed(!collapsed)}
      className="grid h-8 w-9 shrink-0 cursor-pointer place-items-center rounded-lg text-ink-3 outline-none hover:bg-black/[0.035] hover:text-ink focus-visible:ring-2 focus-visible:ring-accent/40"
    >
      <ChevronsLeft
        aria-hidden
        className="size-4 transition-transform duration-200 collapsed:rotate-180 motion-reduce:transition-none"
      />
    </button>
  );
}
