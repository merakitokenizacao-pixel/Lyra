import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getOwnerOptions, getPipelines } from "@/lib/queries";
import { LeadFormDialog } from "./lead-form-dialog";

export async function NewLeadButton({ pipelineId, label = "Novo lead" }: { pipelineId?: string; label?: string }) {
  const [pipelines, members] = await Promise.all([getPipelines(), getOwnerOptions()]);
  const ordered = pipelineId
    ? [...pipelines].sort((a, b) => (a.id === pipelineId ? -1 : b.id === pipelineId ? 1 : 0))
    : pipelines;
  const stageGroups = ordered.map((p) => ({
    pipeline: p.name,
    stages: p.stages.filter((s) => s.category === "open").map((s) => ({ id: s.id, name: s.name })),
  }));

  return (
    <LeadFormDialog
      stageGroups={stageGroups}
      members={members}
      trigger={
        <Button variant="primary">
          <Plus />
          {label}
        </Button>
      }
    />
  );
}

export function NewLeadButtonFallback({ label = "Novo lead" }: { label?: string }) {
  return (
    <Button variant="primary" disabled>
      <Plus />
      {label}
    </Button>
  );
}
