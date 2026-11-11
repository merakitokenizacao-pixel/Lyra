import type { Metadata } from "next";
import { Suspense } from "react";
import { SquareKanban } from "lucide-react";
import { getContext, isAdmin } from "@/lib/auth";
import { firstParam, getMembers, getPipelines, type PipelineWithStages, type SearchParams } from "@/lib/queries";
import { formatMoney } from "@/lib/format";
import { PageHeader } from "@/components/shell/page-header";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/misc";
import { NewLeadButton, NewLeadButtonFallback } from "../leads/new-lead-button";
import { PipelineBoard } from "./board";
import { NewPipelineDialog } from "./new-pipeline-dialog";
import { PipelineActions } from "./pipeline-actions";
import { PipelinesPanel } from "./pipelines-panel";

export const metadata: Metadata = { title: "Pipeline" };

/** O pipeline pedido na URL; sem ele (ou se não existir mais), o padrão. */
function pickPipeline(pipelines: PipelineWithStages[], requested: string | undefined) {
  return pipelines.find((p) => p.id === requested) ?? pipelines.find((p) => p.is_default) ?? pipelines[0];
}

export default function PipelinePage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <>
      {/* O quadro usa a largura toda: com o menu recolhido, aparecem mais colunas (que já têm largura fixa) */}
      <PageHeader
        title="Pipeline"
        icon={<SquareKanban />}
        fluid
        actions={
          <Suspense fallback={<NewLeadButtonFallback />}>
            <PipelineNewLead searchParams={searchParams} />
          </Suspense>
        }
      />
      <Suspense fallback={<PipelineSkeleton />}>
        <PipelineContent searchParams={searchParams} />
      </Suspense>
    </>
  );
}

/** "Novo lead" já sugere a primeira etapa do pipeline aberto. */
async function PipelineNewLead({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const pipeline = pickPipeline(await getPipelines(), firstParam(params.pipeline));
  return <NewLeadButton pipelineId={pipeline?.id} />;
}

async function PipelineContent({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const ctx = await getContext();
  const { supabase, org } = ctx;
  const canManage = isAdmin(ctx.role);
  const pipelines = await getPipelines();
  const pipeline = pickPipeline(pipelines, firstParam(params.pipeline));
  const templates = pipelines.map((p) => ({
    id: p.id,
    name: p.name,
    stages: p.stages.map((s) => ({ name: s.name, color: s.color, category: s.category })),
  }));

  if (!pipeline) {
    return (
      <div className="flex flex-col items-start gap-3 p-6 text-[13px] text-ink-3">
        <p>Nenhum pipeline ainda.</p>
        {canManage ? <NewPipelineDialog pipelines={templates} /> : null}
      </div>
    );
  }

  const [{ data: leads }, { data: allLeads }, members] = await Promise.all([
    supabase
      .from("leads")
      .select(
        "id, name, company, estimated_value, temperature, stage_id, stage_changed_at, owner_id, converted_client_id, qual_budget, qual_authority, qual_need, qual_timing",
      )
      .eq("organization_id", org.id)
      .eq("pipeline_id", pipeline.id)
      .order("stage_changed_at", { ascending: false })
      .limit(1000),
    // Só a etapa de cada lead, para contar os em aberto de cada pipeline na lista
    supabase.from("leads").select("stage_id").eq("organization_id", org.id).limit(10000),
    getMembers(),
  ]);
  const memberName = new Map(members.map((m) => [m.id, m.name]));
  const rows = (leads ?? []).map((l) => ({
    ...l,
    estimated_value: Number(l.estimated_value),
    owner_name: l.owner_id ? (memberName.get(l.owner_id) ?? null) : null,
  }));

  const openStageOwner = new Map(
    pipelines.flatMap((p) => p.stages.filter((s) => s.category === "open").map((s) => [s.id, p.id] as const)),
  );
  const openByPipeline = new Map<string, number>();
  for (const l of allLeads ?? []) {
    const owner = openStageOwner.get(l.stage_id);
    if (owner) openByPipeline.set(owner, (openByPipeline.get(owner) ?? 0) + 1);
  }

  const open = rows.filter((l) => openStageOwner.get(l.stage_id) === pipeline.id);
  const openValue = open.reduce((sum, l) => sum + l.estimated_value, 0);
  const leadsByStage = new Map<string, number>();
  for (const l of rows) leadsByStage.set(l.stage_id, (leadsByStage.get(l.stage_id) ?? 0) + 1);

  return (
    <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
      <PipelinesPanel
        pipelines={pipelines.map((p) => ({
          id: p.id,
          name: p.name,
          is_default: p.is_default,
          open: openByPipeline.get(p.id) ?? 0,
        }))}
        activeId={pipeline.id}
        templates={templates}
        canManage={canManage}
      />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-b border-line px-4 py-3 sm:px-6">
          <div className="flex min-w-0 flex-wrap items-center gap-x-5 gap-y-1 text-[13px]">
            <h2 className="flex min-w-0 items-center gap-2 font-semibold text-ink">
              <span className="truncate">{pipeline.name}</span>
              {pipeline.is_default ? <Badge tone="muted">Padrão</Badge> : null}
            </h2>
            <span className="text-ink-3">
              Em aberto <strong className="font-semibold text-ink tabular-nums">{open.length}</strong>
            </span>
            <span className="text-ink-3">
              Valor <strong className="font-semibold text-ink tabular-nums">{formatMoney(openValue, "round")}</strong>
            </span>
            <span className="hidden text-ink-4 xl:inline">Arraste os cards entre as etapas para atualizar o funil.</span>
          </div>
          {canManage ? (
            <PipelineActions
              key={pipeline.id}
              pipeline={{ id: pipeline.id, name: pipeline.name, is_default: pipeline.is_default }}
              leads={rows.length}
              stages={pipeline.stages.map((s) => ({
                id: s.id,
                name: s.name,
                color: s.color,
                category: s.category,
                leads: leadsByStage.get(s.id) ?? 0,
              }))}
              others={pipelines
                .filter((p) => p.id !== pipeline.id)
                .map((p) => ({ id: p.id, name: p.name, is_default: p.is_default }))}
            />
          ) : null}
        </div>
        <PipelineBoard
          key={pipeline.id}
          stages={pipeline.stages.map((s) => ({ id: s.id, name: s.name, color: s.color, category: s.category }))}
          leads={rows}
        />
      </div>
    </div>
  );
}

function PipelineSkeleton() {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
      <div className="flex shrink-0 items-center gap-2 border-b border-line px-4 py-2 sm:px-6 lg:w-60 lg:flex-col lg:items-stretch lg:gap-3 lg:border-r lg:border-b-0 lg:px-3 lg:py-4">
        <Skeleton className="hidden h-4 w-20 lg:block" />
        <Skeleton className="h-7 w-32 lg:w-full" />
        <Skeleton className="h-7 w-28 lg:w-full" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-5 border-b border-line px-4 py-3 sm:px-6">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-28" />
        </div>
        <div className="flex gap-3 overflow-hidden px-4 pt-4 sm:px-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex w-[284px] shrink-0 flex-col gap-2 rounded-xl border border-line bg-subtle p-3">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-16" />
              {Array.from({ length: 3 - (i % 2) }).map((__, j) => (
                <Skeleton key={j} className="h-28 w-full rounded-lg bg-panel" />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
