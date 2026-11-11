import type { Metadata } from "next";
import { Suspense } from "react";
import { getContext, isAdmin } from "@/lib/auth";
import { getPipelines } from "@/lib/queries";
import { Card, CardHeader, Skeleton } from "@/components/ui/misc";
import { SettingsTitle } from "../settings-ui";
import { StagesEditor } from "./stages-editor";

export const metadata: Metadata = { title: "Etapas do pipeline" };

export default function PipelineSettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <SettingsTitle
        title="Etapas do pipeline"
        description="O caminho de cada lead até virar cliente. Etapas do tipo “Ganho” e “Perdido” encerram a oportunidade."
      />
      <Suspense fallback={<Skeleton className="h-96 w-full rounded-xl" />}>
        <PipelineSettings />
      </Suspense>
    </div>
  );
}

async function PipelineSettings() {
  const ctx = await getContext();
  const admin = isAdmin(ctx.role);
  const [pipelines, { data: leadCounts }] = await Promise.all([
    getPipelines(),
    ctx.supabase.from("leads").select("stage_id").eq("organization_id", ctx.org.id).limit(10000),
  ]);
  const countByStage = new Map<string, number>();
  for (const l of leadCounts ?? []) countByStage.set(l.stage_id, (countByStage.get(l.stage_id) ?? 0) + 1);

  return (
    <>
      {pipelines.map((pipeline) => (
        <Card key={pipeline.id}>
          <CardHeader
            title={pipeline.name}
            description={
              admin
                ? "Renomeie, escolha a cor e o tipo de cada etapa e ajuste a ordem com as setas."
                : "Somente o proprietário e administradores podem alterar as etapas."
            }
          />
          <div className="border-t border-line">
            <StagesEditor
              key={pipeline.stages.map((s) => `${s.id}:${s.name}:${s.color}:${s.category}`).join("|")}
              pipelineId={pipeline.id}
              canEdit={admin}
              stages={pipeline.stages.map((s) => ({
                id: s.id,
                name: s.name,
                color: s.color,
                category: s.category,
                leads: countByStage.get(s.id) ?? 0,
              }))}
            />
          </div>
        </Card>
      ))}
    </>
  );
}
