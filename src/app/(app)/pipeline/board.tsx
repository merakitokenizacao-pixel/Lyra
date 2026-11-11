"use client";

import { useOptimistic, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarClock } from "lucide-react";
import { toast } from "sonner";
import { stageColor, type LeadTemperature, type StageCategory } from "@/lib/constants";
import { daysSince, formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Kanban } from "@/components/kanban";
import { Avatar } from "@/components/ui/misc";
import { BantDots, TemperatureLabel } from "@/components/lead-bits";
import { Dialog, DialogBody, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { convertLead, moveLead } from "../leads/actions";

export type BoardLead = {
  id: string;
  name: string;
  company: string | null;
  estimated_value: number;
  temperature: LeadTemperature;
  stage_id: string;
  stage_changed_at: string;
  owner_name: string | null;
  converted_client_id: string | null;
  qual_budget: boolean;
  qual_authority: boolean;
  qual_need: boolean;
  qual_timing: boolean;
};

export type BoardStage = { id: string; name: string; color: string; category: StageCategory };

export function PipelineBoard({ stages, leads }: { stages: BoardStage[]; leads: BoardLead[] }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [optimistic, applyMove] = useOptimistic(leads, (state, move: { id: string; stageId: string }) =>
    state.map((l) =>
      l.id === move.id ? { ...l, stage_id: move.stageId, stage_changed_at: new Date().toISOString() } : l,
    ),
  );
  const [lostDraft, setLostDraft] = useState<{ lead: BoardLead; stageId: string } | null>(null);
  const [lostReason, setLostReason] = useState("");

  const displayed = lostDraft
    ? optimistic.map((l) => (l.id === lostDraft.lead.id ? { ...l, stage_id: lostDraft.stageId } : l))
    : optimistic;
  const sorted = [...displayed].sort((a, b) => b.stage_changed_at.localeCompare(a.stage_changed_at));
  const stageById = new Map(stages.map((s) => [s.id, s]));

  function commitMove(lead: BoardLead, stageId: string, reason?: string) {
    const stage = stageById.get(stageId);
    startTransition(async () => {
      applyMove({ id: lead.id, stageId });
      const result = await moveLead(lead.id, stageId, stage?.category === "lost" ? (reason ?? null) : undefined);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      if (stage?.category === "won" && !lead.converted_client_id) {
        toast.success(`${lead.name} foi ganho!`, {
          description: "Transforme o lead em cliente para acompanhar onboarding e status.",
          duration: 8000,
          action: {
            label: "Converter em cliente",
            onClick: () =>
              startTransition(async () => {
                const converted = await convertLead(lead.id);
                if (!converted.ok) return void toast.error(converted.error);
                toast.success("Cliente criado");
                if (converted.id) router.push(`/clientes/${converted.id}`);
              }),
          },
        });
      } else if (stage) {
        toast(`Movido para ${stage.name}`);
      }
    });
  }

  function onMove(lead: BoardLead, toStageId: string) {
    const stage = stageById.get(toStageId);
    if (stage?.category === "lost") {
      setLostReason("");
      setLostDraft({ lead, stageId: toStageId });
      return;
    }
    commitMove(lead, toStageId);
  }

  const columns = stages.map((stage) => {
    const items = sorted.filter((l) => l.stage_id === stage.id);
    const total = items.reduce((sum, l) => sum + Number(l.estimated_value), 0);
    return {
      id: stage.id,
      tone: stage.category === "open" ? ("default" as const) : stage.category,
      header: (
        <div>
          <div className="flex items-center justify-between gap-2">
            <h3 className="flex min-w-0 items-center gap-2 text-[13px] font-semibold text-ink">
              <span className={cn("size-2 shrink-0 rounded-full", stageColor(stage.color).dot)} aria-hidden />
              <span className="truncate">{stage.name}</span>
            </h3>
            <span className="rounded-md bg-panel px-1.5 py-px font-mono text-[11px] text-ink-3 tabular-nums shadow-xs">
              {items.length}
            </span>
          </div>
          <p className="mt-1 pl-4 text-xs text-ink-3 tabular-nums">{formatMoney(total, "compact")}</p>
        </div>
      ),
    };
  });

  return (
    <>
      <Kanban
        columns={columns}
        items={sorted}
        getColumnId={(l) => l.stage_id}
        onMove={onMove}
        renderCard={(lead) => <LeadCard lead={lead} />}
      />
      <Dialog open={Boolean(lostDraft)} onOpenChange={(open) => !open && setLostDraft(null)}>
        <DialogContent title="Marcar como perdido" description={lostDraft ? `Por que perdemos ${lostDraft.lead.name}?` : undefined} size="sm">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!lostDraft) return;
              commitMove(lostDraft.lead, lostDraft.stageId, lostReason);
              setLostDraft(null);
            }}
          >
            <DialogBody>
              <Textarea
                autoFocus
                value={lostReason}
                onChange={(e) => setLostReason(e.target.value)}
                placeholder="Ex.: escolheu um concorrente, sem orçamento neste ano… (opcional)"
                maxLength={500}
              />
            </DialogBody>
            <DialogFooter>
              <Button variant="secondary" onClick={() => setLostDraft(null)}>
                Cancelar
              </Button>
              <Button type="submit" variant="primary">
                Confirmar perda
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

function LeadCard({ lead }: { lead: BoardLead }) {
  const days = daysSince(lead.stage_changed_at);
  return (
    <Link
      href={`/leads/${lead.id}`}
      draggable={false}
      className="block rounded-lg border border-line bg-panel p-3 shadow-card transition-[border-color,box-shadow] hover:border-line-strong hover:shadow-pop"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-[13px] font-medium text-ink">{lead.name}</p>
          <p className="truncate text-xs text-ink-3">{lead.company ?? "Pessoa física"}</p>
        </div>
        {lead.owner_name ? <Avatar name={lead.owner_name} size="sm" /> : null}
      </div>
      <div className="mt-3 flex items-center justify-between gap-2">
        <span className="text-[13px] font-semibold text-ink tabular-nums">
          {Number(lead.estimated_value) > 0 ? formatMoney(lead.estimated_value, "round") : "—"}
        </span>
        <TemperatureLabel value={lead.temperature} showLabel={false} />
      </div>
      <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-line pt-2.5">
        <BantDots lead={lead} />
        <span
          className={cn("inline-flex items-center gap-1 text-[11.5px] tabular-nums", days > 14 ? "text-warning" : "text-ink-4")}
          title="Dias nesta etapa"
        >
          <CalendarClock className="size-3" />
          {days === 0 ? "hoje" : `${days}d`}
        </span>
      </div>
    </Link>
  );
}
