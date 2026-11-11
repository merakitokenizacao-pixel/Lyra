import type { Metadata } from "next";
import { Suspense } from "react";
import { SquareKanban } from "lucide-react";
import { getContext } from "@/lib/auth";
import { firstParam, getMembers, getPipelines, type SearchParams } from "@/lib/queries";
import { formatMoney } from "@/lib/format";
import { PageHeader } from "@/components/shell/page-header";
import { Skeleton } from "@/components/ui/misc";
import { Segmented } from "@/components/ui/tabs";
import { NewLeadButton, NewLeadButtonFallback } from "../leads/new-lead-button";
import { PipelineBoard } from "./board";

export const metadata: Metadata = { title: "Pipeline" };

export default function PipelinePage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <>
      <PageHeader
        title="Pipeline"
        icon={<SquareKanban />}
        actions={
          <Suspense fallback={<NewLeadButtonFallback />}>
            <NewLeadButton />
          </Suspense>
        }
      />
      <Suspense fallback={<BoardSkeleton />}>
        <PipelineContent searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function PipelineContent({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const { supabase, org } = await getContext();
  const pipelines = await getPipelines();
  const requested = firstParam(params.pipeline);
  const pipeline = pipelines.find((p) => p.id === requested) ?? pipelines.find((p) => p.is_default) ?? pipelines[0];

  if (!pipeline) {
    return <p className="p-6 text-[13px] text-ink-3">Nenhum pipeline configurado. Crie um em Configurações.</p>;
  }

  const [{ data: leads }, members] = await Promise.all([
    supabase
      .from("leads")
      .select(
        "id, name, company, estimated_value, temperature, stage_id, stage_changed_at, owner_id, converted_client_id, qual_budget, qual_authority, qual_need, qual_timing",
      )
      .eq("organization_id", org.id)
      .eq("pipeline_id", pipeline.id)
      .order("stage_changed_at", { ascending: false })
      .limit(1000),
    getMembers(),
  ]);
  const memberName = new Map(members.map((m) => [m.id, m.name]));
  const rows = (leads ?? []).map((l) => ({
    ...l,
    estimated_value: Number(l.estimated_value),
    owner_name: l.owner_id ? (memberName.get(l.owner_id) ?? null) : null,
  }));

  const openStageIds = new Set(pipeline.stages.filter((s) => s.category === "open").map((s) => s.id));
  const open = rows.filter((l) => openStageIds.has(l.stage_id));
  const openValue = open.reduce((sum, l) => sum + l.estimated_value, 0);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3 sm:px-6">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-[13px]">
          <span className="text-ink-3">
            Em aberto <strong className="font-semibold text-ink tabular-nums">{open.length}</strong>
          </span>
          <span className="text-ink-3">
            Valor <strong className="font-semibold text-ink tabular-nums">{formatMoney(openValue, "round")}</strong>
          </span>
          <span className="hidden text-ink-4 sm:inline">Arraste os cards entre as etapas para atualizar o funil.</span>
        </div>
        {pipelines.length > 1 ? (
          <Segmented
            active={pipeline.id}
            items={pipelines.map((p) => ({ key: p.id, label: p.name, href: `/pipeline?pipeline=${p.id}` }))}
          />
        ) : null}
      </div>
      <PipelineBoard
        stages={pipeline.stages.map((s) => ({ id: s.id, name: s.name, color: s.color, category: s.category }))}
        leads={rows}
      />
    </div>
  );
}

function BoardSkeleton() {
  return (
    <div className="flex gap-3 overflow-hidden px-6 pt-16">
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
  );
}
