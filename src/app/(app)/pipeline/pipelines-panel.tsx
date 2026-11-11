import Link from "next/link";
import { SquareKanban, Target } from "lucide-react";
import { cn } from "@/lib/utils";
import { NewPipelineDialog, type PipelineTemplate } from "./new-pipeline-dialog";

export type PanelPipeline = { id: string; name: string; is_default: boolean; open: number };

/**
 * Lista de pipelines ao lado do quadro. O padrão fica no topo, separado dos outros.
 * No celular vira uma linha rolável acima do quadro.
 */
export function PipelinesPanel({
  pipelines,
  activeId,
  templates,
  canManage,
}: {
  pipelines: PanelPipeline[];
  activeId: string;
  /** Pipelines com etapas, para o "Novo pipeline" copiar */
  templates: PipelineTemplate[];
  canManage: boolean;
}) {
  const main = pipelines.filter((p) => p.is_default);
  const others = pipelines.filter((p) => !p.is_default);

  return (
    <aside className="shrink-0 border-b border-line lg:w-60 lg:overflow-y-auto lg:border-r lg:border-b-0">
      <div className="flex items-center gap-2 px-4 py-2 sm:px-6 lg:flex-col lg:items-stretch lg:gap-3 lg:px-3 lg:py-4">
        <h2 className="hidden px-1 text-[12.5px] font-semibold text-ink lg:block">Pipelines</h2>
        {canManage ? <NewPipelineDialog pipelines={templates} className="order-2 lg:order-none" /> : null}
        <nav
          aria-label="Pipelines"
          // relative: prende os textos sr-only dos links nesta linha que rola no celular
          className="no-scrollbar relative -my-1 flex min-w-0 flex-1 items-center gap-1 overflow-x-auto py-1 lg:my-0 lg:flex-none lg:flex-col lg:items-stretch lg:gap-0.5 lg:overflow-visible lg:py-0"
        >
          {main.map((p) => (
            <PipelineLink key={p.id} pipeline={p} active={p.id === activeId} />
          ))}
          {main.length > 0 && others.length > 0 ? (
            <span aria-hidden className="mx-1 h-5 w-px shrink-0 bg-line lg:mx-0 lg:my-1.5 lg:h-px lg:w-auto" />
          ) : null}
          {others.map((p) => (
            <PipelineLink key={p.id} pipeline={p} active={p.id === activeId} />
          ))}
        </nav>
      </div>
    </aside>
  );
}

function PipelineLink({ pipeline, active }: { pipeline: PanelPipeline; active: boolean }) {
  const Icon = pipeline.is_default ? Target : SquareKanban;
  const openLabel = `${pipeline.open} ${pipeline.open === 1 ? "lead em aberto" : "leads em aberto"}`;
  return (
    <Link
      href={`/pipeline?pipeline=${pipeline.id}`}
      aria-current={active ? "page" : undefined}
      // Nomes longos são cortados com reticências: o nome inteiro fica na dica do navegador
      title={pipeline.name}
      className={cn(
        "group flex h-8 max-w-60 shrink-0 items-center gap-2.5 rounded-lg px-2.5 text-[13px] whitespace-nowrap transition-colors lg:max-w-none",
        "outline-none focus-visible:ring-2 focus-visible:ring-accent/40",
        active ? "bg-hover font-medium text-ink" : "text-ink-2 hover:bg-hover/70 hover:text-ink",
      )}
    >
      <Icon aria-hidden className={cn("size-4 shrink-0", active ? "text-accent" : "text-ink-3 group-hover:text-ink-2")} />
      <span className="min-w-0 flex-1 truncate">{pipeline.name}</span>
      <span className="sr-only">
        , {pipeline.is_default ? "padrão, " : ""}
        {openLabel}
      </span>
      <span aria-hidden className="font-mono text-[11px] font-normal text-ink-4 tabular-nums">
        {pipeline.open}
      </span>
    </Link>
  );
}
