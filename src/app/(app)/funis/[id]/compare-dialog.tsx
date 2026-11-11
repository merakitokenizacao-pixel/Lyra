"use client";

import { useId, type ReactNode } from "react";
import { Trophy } from "lucide-react";
import { formatMoney } from "@/lib/format";
import { formatMultiple, formatPeople, formatShare, variantLetter, type FunnelSim, type FunnelVariant } from "@/lib/funnels";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogClose, DialogContent, DialogFooter } from "@/components/ui/dialog";

type Column = { variant: FunnelVariant; sim: FunnelSim; letter: string };
type Row = {
  label: string;
  hint?: string;
  values: (number | null)[];
  format: (value: number) => string;
  /** Qual direção é melhor; sem isso a linha não destaca ninguém. */
  better?: "max" | "min";
};

/** Índice da coluna com o melhor valor da linha (−1 quando empata ou não há o que comparar). */
function bestIndex(row: Row) {
  if (!row.better) return -1;
  const present = row.values.flatMap((value, index) => (value == null ? [] : [{ value, index }]));
  if (present.length < 2) return -1;
  const sorted = [...present].sort((a, b) => (row.better === "max" ? b.value - a.value : a.value - b.value));
  return Math.abs(sorted[0].value - sorted[1].value) < 1e-9 ? -1 : sorted[0].index;
}

function ratioText(ratio: number) {
  return ratio >= 2 ? `${ratio.toFixed(1).replace(".", ",").replace(/,0$/, "")}x mais` : `${Math.round((ratio - 1) * 100)}% a mais`;
}

/** Resumo em uma frase: quem converte mais e por quanto. */
function insight(columns: Column[]): ReactNode {
  const ranked = columns.filter((c) => c.sim.entries > 0).sort((a, b) => b.sim.conversions - a.sim.conversions);
  if (ranked.length < 2 || ranked[0].sim.conversions <= 0) return null;
  const [lead, next] = ranked;
  const ratio = next.sim.conversions > 0 ? lead.sim.conversions / next.sim.conversions : Number.POSITIVE_INFINITY;
  if (ratio < 1.03) {
    return "As variantes estão praticamente empatadas em conversões. Compare o custo e o retorno para decidir.";
  }
  const revenueGap = lead.sim.revenue - next.sim.revenue;
  return (
    <>
      <span className="font-semibold text-ink">
        {lead.letter} · {lead.variant.name}
      </span>{" "}
      lidera com {formatPeople(lead.sim.conversions)} conversões por mês
      {Number.isFinite(ratio) ? `, ${ratioText(ratio)} que ${next.letter} (${formatPeople(next.sim.conversions)})` : ""}
      {revenueGap > 0 ? ` e ${formatMoney(revenueGap, "compact")} a mais de receita` : ""}.
    </>
  );
}

function LetterChip({ letter, active }: { letter: string; active?: boolean }) {
  return (
    <span
      className={cn(
        "grid size-5 shrink-0 place-items-center rounded-md text-[10.5px] font-semibold",
        active ? "bg-ink text-white" : "bg-hover text-ink-2",
      )}
    >
      {letter}
    </span>
  );
}

export function CompareDialog({
  open,
  onOpenChange,
  variants,
  sims,
  activeId,
  winnerId,
  onWinner,
  onOpen,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  variants: FunnelVariant[];
  sims: FunnelSim[];
  activeId: string;
  winnerId: string | null;
  onWinner: (variantId: string | null) => void;
  onOpen: (variantId: string) => void;
}) {
  const rateId = useId();
  const columns: Column[] = variants.map((variant, index) => ({ variant, sim: sims[index], letter: variantLetter(index) }));
  const maxRate = Math.max(0, ...columns.map((c) => c.sim.rate));
  const anyReal = columns.some((c) => c.sim.real.filled > 0);

  const rows: Row[] = [
    { label: "Entradas", hint: "pessoas por mês", values: columns.map((c) => c.sim.entries), format: formatPeople },
    { label: "Conversões", hint: "por mês", values: columns.map((c) => c.sim.conversions), format: formatPeople, better: "max" },
    {
      label: "Taxa de conversão",
      hint: "entrada → meta",
      values: columns.map((c) => (c.sim.entries > 0 ? c.sim.rate : null)),
      format: formatShare,
      better: "max",
    },
    { label: "Receita", hint: "por mês", values: columns.map((c) => c.sim.revenue), format: (n) => formatMoney(n, "compact"), better: "max" },
    { label: "Custo", hint: "por mês", values: columns.map((c) => c.sim.cost), format: (n) => formatMoney(n, "compact") },
    {
      label: "Resultado",
      hint: "receita − custo",
      values: columns.map((c) => c.sim.profit),
      format: (n) => formatMoney(n, "compact"),
      better: "max",
    },
    { label: "Retorno (ROI)", values: columns.map((c) => c.sim.roi), format: formatMultiple, better: "max" },
    {
      label: "Custo por conversão",
      values: columns.map((c) => c.sim.costPerConversion),
      format: (n) => formatMoney(n, n < 100 ? "full" : "round"),
      better: "min",
    },
  ];
  const realRows: Row[] = anyReal
    ? [
        { label: "Conversões reais", values: columns.map((c) => c.sim.real.conversions), format: formatPeople, better: "max" },
        { label: "Taxa real", values: columns.map((c) => c.sim.real.rate), format: formatShare, better: "max" },
        {
          label: "Receita real",
          values: columns.map((c) => c.sim.real.revenue),
          format: (n) => formatMoney(n, "compact"),
          better: "max",
        },
      ]
    : [];
  const summary = insight(columns);

  const renderRow = (row: Row) => {
    const best = bestIndex(row);
    return (
      <tr key={row.label}>
        <th scope="row" className="py-2 pr-3 text-left font-normal text-ink-3">
          {row.label}
          {row.hint ? <span className="block text-[11px] text-ink-4">{row.hint}</span> : null}
        </th>
        {row.values.map((value, index) => (
          <td key={columns[index].variant.id} className={cn("px-3 py-2 text-right", index === best ? "font-semibold text-ink" : "text-ink-2")}>
            {value == null ? "—" : row.format(value)}
            {index === best ? (
              <>
                <span className="ml-1.5 inline-block size-1.5 rounded-full bg-accent align-middle" aria-hidden />
                <span className="sr-only"> (melhor)</span>
              </>
            ) : null}
          </td>
        ))}
      </tr>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title="Comparar variantes" description="A previsão por mês de cada abordagem, lado a lado." size="xl">
        <DialogBody className="gap-5">
          {summary ? <p className="rounded-lg border border-line bg-subtle px-3.5 py-2.5 text-[13px] leading-snug text-ink-2">{summary}</p> : null}

          <section aria-labelledby={rateId}>
            <h3 id={rateId} className="mb-2.5 text-[11px] font-medium tracking-wide text-ink-4 uppercase">
              Taxa de conversão prevista
            </h3>
            <ul className="flex flex-col gap-2">
              {columns.map((c) => (
                <li
                  key={c.variant.id}
                  className="grid grid-cols-[minmax(0,10rem)_1fr_3.5rem] items-center gap-3 text-[12.5px] sm:grid-cols-[minmax(0,13rem)_1fr_4rem]"
                  title={`${c.variant.name}: ${formatPeople(c.sim.conversions)} de ${formatPeople(c.sim.entries)} pessoas`}
                >
                  <span className="flex min-w-0 items-center gap-1.5">
                    <LetterChip letter={c.letter} active={c.variant.id === activeId} />
                    <span className="truncate text-ink-2">{c.variant.name}</span>
                    {c.variant.id === winnerId ? <Trophy className="size-3.5 shrink-0 text-amber-600" aria-label="Vencedora" /> : null}
                  </span>
                  <span className="h-2 rounded-full bg-hover">
                    <span
                      className="block h-full rounded-full bg-accent"
                      style={{ width: maxRate > 0 ? `${Math.max(1.5, (c.sim.rate / maxRate) * 100)}%` : "0%" }}
                    />
                  </span>
                  <span className="text-right font-medium text-ink tabular-nums">
                    {c.sim.entries > 0 ? formatShare(c.sim.rate) : "—"}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <div className="-mx-5 overflow-x-auto px-5">
            <table className="w-full min-w-[520px] text-[12.5px] tabular-nums">
              <thead>
                <tr className="border-b border-line">
                  <th scope="col" className="w-40 py-2 pr-3 text-left">
                    <span className="sr-only">Métrica</span>
                  </th>
                  {columns.map((c) => (
                    <th key={c.variant.id} scope="col" className="px-3 py-2 text-right font-medium text-ink">
                      <span className="inline-flex max-w-44 items-center gap-1.5">
                        <LetterChip letter={c.letter} active={c.variant.id === activeId} />
                        <span className="truncate">{c.variant.name}</span>
                        {c.variant.id === winnerId ? <Trophy className="size-3.5 shrink-0 text-amber-600" aria-label="Vencedora" /> : null}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map(renderRow)}
                <tr>
                  <th scope="row" className="py-2 pr-3 text-left font-normal text-ink-3">
                    Gargalo
                    <span className="block text-[11px] text-ink-4">menor taxa do caminho</span>
                  </th>
                  {columns.map((c) => {
                    const edge = c.sim.weakest ? c.variant.edges.find((e) => e.id === c.sim.weakest) : undefined;
                    const from = edge ? c.variant.nodes.find((n) => n.id === edge.source) : undefined;
                    const to = edge ? c.variant.nodes.find((n) => n.id === edge.target) : undefined;
                    return (
                      <td key={c.variant.id} className="px-3 py-2 text-right text-ink-2">
                        {edge && from && to ? (
                          <span className="inline-block max-w-44 truncate align-bottom" title={`${from.name} → ${to.name}`}>
                            {from.name} → {to.name} · <span className="font-medium text-ink">{formatShare(c.sim.edges[edge.id]?.share ?? 0)}</span>
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                    );
                  })}
                </tr>
                {realRows.length > 0 ? (
                  <tr>
                    <th colSpan={columns.length + 1} scope="colgroup" className="pt-4 pb-1 text-left text-[11px] font-medium tracking-wide text-ink-4 uppercase">
                      Resultado real
                    </th>
                  </tr>
                ) : null}
                {realRows.map(renderRow)}
                <tr>
                  <th scope="row" className="pt-3 pb-1 pr-3 text-left font-normal text-ink-3">
                    Decisão
                  </th>
                  {columns.map((c) => {
                    const winner = c.variant.id === winnerId;
                    return (
                      <td key={c.variant.id} className="px-3 pt-3 pb-1 text-right">
                        <span className="inline-flex flex-wrap justify-end gap-1">
                          <Button variant="ghost" size="xs" onClick={() => onOpen(c.variant.id)}>
                            Abrir
                          </Button>
                          <Button
                            variant={winner ? "accent" : "secondary"}
                            size="xs"
                            aria-pressed={winner}
                            onClick={() => onWinner(winner ? null : c.variant.id)}
                          >
                            <Trophy />
                            {winner ? "Vencedora" : "Escolher"}
                          </Button>
                        </span>
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>

          <p className="flex items-center gap-1.5 text-[11.5px] text-ink-4">
            <span className="inline-block size-1.5 rounded-full bg-accent" aria-hidden />
            melhor valor da linha. A previsão usa as taxas e os valores informados em cada etapa; anote o resultado real para confirmar.
          </p>
        </DialogBody>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="secondary">Fechar</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
