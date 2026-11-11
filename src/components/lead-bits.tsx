import { BANT, TEMPERATURES, stageColor, type LeadTemperature } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { DotBadge } from "@/components/ui/badge";

export function StageBadge({ name, color, className }: { name: string; color: string; className?: string }) {
  return (
    <DotBadge dotClassName={stageColor(color).dot} className={className}>
      {name}
    </DotBadge>
  );
}

export function TemperatureLabel({ value, showLabel = true }: { value: LeadTemperature; showLabel?: boolean }) {
  const t = TEMPERATURES[value];
  const Icon = t.icon;
  return (
    <span className="inline-flex items-center gap-1 text-[12.5px] text-ink-2" title={`Temperatura: ${t.label}`}>
      <Icon className={cn("size-3.5", t.className)} />
      {showLabel ? t.label : <span className="sr-only">{t.label}</span>}
    </span>
  );
}

type Qualifiable = { qual_budget: boolean; qual_authority: boolean; qual_need: boolean; qual_timing: boolean };

export function bantScore(lead: Qualifiable) {
  return BANT.filter((b) => lead[b.key]).length;
}

/** Quatro pontos: B·A·N·T preenchidos conforme a qualificação. */
export function BantDots({ lead, className }: { lead: Qualifiable; className?: string }) {
  const score = bantScore(lead);
  return (
    <span
      className={cn("inline-flex items-center gap-0.5", className)}
      title={`Qualificação ${score}/4: ${BANT.filter((b) => lead[b.key]).map((b) => b.label).join(", ") || "nenhum critério"}`}
    >
      {BANT.map((b) => (
        <span key={b.key} className={cn("h-1.5 w-2.5 rounded-full", lead[b.key] ? "bg-accent" : "bg-line-strong")} />
      ))}
      <span className="sr-only">Qualificação {score} de 4</span>
    </span>
  );
}
