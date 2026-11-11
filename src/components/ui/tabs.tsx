import type { ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export type TabItem = { key: string; label: string; href: string; count?: number; dot?: string };

/** Abas como links (estado na URL), com sublinhado azul no item ativo. */
export function LinkTabs({ items, active, className }: { items: TabItem[]; active: string; className?: string }) {
  return (
    // A linha de baixo é uma sombra interna (não borda): o sublinhado da aba ativa cobre a linha
    // sem sair da caixa, e a rolagem horizontal não ganha 1px de rolagem vertical junto.
    <nav
      className={cn("no-scrollbar flex gap-5 overflow-x-auto px-4 shadow-[inset_0_-1px_0_var(--line)] sm:px-6", className)}
      aria-label="Filtros"
    >
      {items.map((item) => {
        const isActive = item.key === active;
        return (
          <Link
            key={item.key}
            href={item.href}
            scroll={false}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "relative flex h-10 shrink-0 items-center gap-1.5 border-b-2 text-[13px] transition-colors",
              isActive ? "border-accent font-medium text-ink" : "border-transparent text-ink-3 hover:text-ink",
            )}
          >
            {item.dot ? <span className="size-1.5 rounded-full" style={{ backgroundColor: item.dot }} aria-hidden /> : null}
            {item.label}
            {item.count != null ? (
              <span
                className={cn(
                  "rounded-md px-1.5 py-px font-mono text-[11px] tabular-nums",
                  isActive ? "bg-accent-soft text-accent" : "bg-hover text-ink-3",
                )}
              >
                {item.count}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}

/** Alternador segmentado (ex.: Lista / Quadro). */
export function Segmented({
  items,
  active,
}: {
  items: { key: string; label: ReactNode; href: string; title?: string }[];
  active: string;
}) {
  return (
    <div className="inline-flex rounded-lg border border-line bg-subtle p-0.5">
      {items.map((item) => (
        <Link
          key={item.key}
          href={item.href}
          title={item.title}
          scroll={false}
          className={cn(
            "inline-flex h-6.5 items-center gap-1.5 rounded-md px-2 text-[12.5px] [&_svg]:size-3.5",
            item.key === active ? "bg-panel font-medium text-ink shadow-xs" : "text-ink-3 hover:text-ink",
          )}
        >
          {item.label}
        </Link>
      ))}
    </div>
  );
}
