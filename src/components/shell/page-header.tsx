import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  icon,
  actions,
  breadcrumb,
  fluid,
  className,
}: {
  title: ReactNode;
  icon?: ReactNode;
  actions?: ReactNode;
  breadcrumb?: { label: string; href: string };
  /** Ocupa a largura toda mesmo com o menu recolhido (pipeline), em vez de seguir a largura fixa do conteúdo */
  fluid?: boolean;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "sticky top-0 z-20 flex h-14 shrink-0 items-center justify-between gap-3 border-b border-line bg-panel/90 px-4 backdrop-blur-md sm:px-6 lg:rounded-t-xl",
        !fluid && "lg:px-page",
        className,
      )}
    >
      <div className="flex min-w-0 items-center gap-2.5">
        {icon ? (
          <span className="grid size-7 shrink-0 place-items-center rounded-lg border border-line bg-subtle text-ink-2 [&_svg]:size-4">
            {icon}
          </span>
        ) : null}
        {breadcrumb ? (
          <>
            <Link href={breadcrumb.href} className="hidden shrink-0 text-[14px] text-ink-3 hover:text-ink sm:inline">
              {breadcrumb.label}
            </Link>
            <ChevronRight className="hidden size-3.5 shrink-0 text-ink-4 sm:block" />
          </>
        ) : null}
        <h1 className="truncate text-[14.5px] font-semibold tracking-tight text-ink">{title}</h1>
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </header>
  );
}

/** Título da página em duas cores (linha escura + linha suave), como nos headlines da ROX. Usado no Início, que não tem cabeçalho. */
export function DisplayTitle({ lead, muted, className }: { lead: ReactNode; muted?: ReactNode; className?: string }) {
  return (
    <h1 className={cn("font-display text-[24px] leading-[1.15] text-ink sm:text-[28px]", className)}>
      {lead}
      {muted ? (
        <>
          <br />
          <span className="text-ink-4">{muted}</span>
        </>
      ) : null}
    </h1>
  );
}
