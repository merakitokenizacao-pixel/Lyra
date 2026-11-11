import { Fragment } from "react";
import { ChevronRight } from "lucide-react";
import { STEP_GROUPS, STEP_KINDS, type StepKind } from "@/lib/funnels";
import { cn } from "@/lib/utils";

/** Sequência de ícones de um modelo de funil (ex.: Anúncios › Site › Agente de IA › Plataforma). */
export function TemplateChain({ kinds, className }: { kinds: StepKind[]; className?: string }) {
  if (kinds.length === 0) {
    return (
      <span className={cn("flex h-6 items-center text-[11.5px] text-ink-4", className)}>
        <span className="grid size-6 place-items-center rounded-md border border-dashed border-line-strong">+</span>
      </span>
    );
  }
  return (
    <span className={cn("flex items-center gap-0.5", className)} aria-label={kinds.map((k) => STEP_KINDS[k].label).join(", depois ")}>
      {kinds.map((kind, index) => {
        const Icon = STEP_KINDS[kind].icon;
        return (
          <Fragment key={`${kind}-${index}`}>
            {index > 0 ? <ChevronRight className="size-3 shrink-0 text-ink-4" aria-hidden /> : null}
            <span
              className={cn("grid size-6 shrink-0 place-items-center rounded-md [&_svg]:size-3.5", STEP_GROUPS[STEP_KINDS[kind].group].tile)}
              title={STEP_KINDS[kind].label}
            >
              <Icon aria-hidden />
            </span>
          </Fragment>
        );
      })}
    </span>
  );
}
