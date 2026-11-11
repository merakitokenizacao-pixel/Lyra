"use client";

import { useId, useMemo, type ReactNode } from "react";
import { ArrowDownRight, ArrowRight, ArrowUpRight, ExternalLink, MousePointerClick, StickyNote, Trash2, TriangleAlert } from "lucide-react";
import { formatMoney } from "@/lib/format";
import {
  STEP_GROUPS,
  STEP_KINDS,
  formatMultiple,
  formatPeople,
  formatShare,
  realDelta,
  safeUrl,
  simulate,
  type FunnelDoc,
  type FunnelEdge,
  type FunnelNode,
  type FunnelSim,
  type FunnelVariant,
} from "@/lib/funnels";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Checkbox, Input, Select, Textarea } from "@/components/ui/input";
import { NumberField, PanelSection, Stat } from "./fields";

export type Selection = { nodes: string[]; edges: string[] };
export type Product = { id: string; name: string; price: number };

type Handlers = {
  /** Guarda o estado atual no histórico (chamado ao começar uma edição). */
  onCommit: () => void;
  onNode: (id: string, patch: Partial<FunnelNode>) => void;
  onEdge: (id: string, patch: Partial<FunnelEdge>) => void;
  onRemove: (nodes: string[], edges: string[]) => void;
  onGoal: (id: string | null) => void;
  onVariantName: (name: string) => void;
  onDoc: (patch: Partial<FunnelDoc>) => void;
  onSelect: (selection: Selection) => void;
};

function Label({ htmlFor, children }: { htmlFor?: string; children: ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="mb-1 block text-[11.5px] font-medium text-ink-3">
      {children}
    </label>
  );
}

function Delta({ value, className }: { value: number | null; className?: string }) {
  if (value == null) return null;
  const flat = Math.abs(value) < 0.005;
  const Trend = flat ? null : value > 0 ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 font-medium tabular-nums",
        flat ? "text-ink-3" : value > 0 ? "text-success" : "text-danger",
        className,
      )}
    >
      {Trend ? <Trend className="size-3" aria-hidden /> : null}
      {flat ? "igual" : `${value > 0 ? "+" : "−"}${formatShare(Math.abs(value))}`}
    </span>
  );
}

export function Inspector({
  className,
  doc,
  variant,
  letter,
  sim,
  selection,
  products,
  variantNameId,
  ...handlers
}: Handlers & {
  className?: string;
  /** id do campo de nome da variante (o editor foca nele ao criar uma variante). */
  variantNameId: string;
  doc: FunnelDoc;
  variant: FunnelVariant;
  letter: string;
  sim: FunnelSim;
  selection: Selection;
  products: Product[];
}) {
  const nodes = selection.nodes.map((id) => variant.nodes.find((n) => n.id === id)).filter((n): n is FunnelNode => Boolean(n));
  const edges = selection.edges.map((id) => variant.edges.find((e) => e.id === id)).filter((e): e is FunnelEdge => Boolean(e));

  let content: ReactNode;
  if (nodes.length + edges.length > 1) {
    content = <MultiPanel count={nodes.length + edges.length} onRemove={() => handlers.onRemove(nodes.map((n) => n.id), edges.map((e) => e.id))} />;
  } else if (nodes.length === 1) {
    content =
      nodes[0].kind === "note" ? (
        <NotePanel key={nodes[0].id} node={nodes[0]} {...handlers} />
      ) : (
        <NodePanel key={nodes[0].id} node={nodes[0]} variant={variant} sim={sim} {...handlers} />
      );
  } else if (edges.length === 1) {
    content = <EdgePanel key={edges[0].id} edge={edges[0]} variant={variant} sim={sim} {...handlers} />;
  } else {
    content = (
      <SummaryPanel
        doc={doc}
        variant={variant}
        letter={letter}
        sim={sim}
        products={products}
        variantNameId={variantNameId}
        {...handlers}
      />
    );
  }

  return (
    <aside className={cn("flex min-h-0 flex-col border-line bg-panel lg:border-l", className)} aria-label="Detalhes">
      <div className="min-h-0 flex-1 overflow-y-auto">{content}</div>
    </aside>
  );
}

/* ---------- Resumo (nada selecionado) ---------- */
function SummaryPanel({
  doc,
  variant,
  letter,
  sim,
  products,
  variantNameId,
  onCommit,
  onVariantName,
  onDoc,
  onSelect,
}: Handlers & {
  doc: FunnelDoc;
  variant: FunnelVariant;
  letter: string;
  sim: FunnelSim;
  products: Product[];
  variantNameId: string;
}) {
  // ids próprios: a página anterior pode continuar montada (oculta) com o mesmo formulário
  const uid = useId();
  const byId = useMemo(() => new Map(variant.nodes.map((n) => [n.id, n])), [variant.nodes]);
  const goal = sim.goalId ? byId.get(sim.goalId) : undefined;
  const weakEdge = sim.weakest ? variant.edges.find((e) => e.id === sim.weakest) : undefined;
  // Sensibilidade: quanto a meta ganha se a taxa do gargalo subir 1 ponto
  const boosted = useMemo(
    () =>
      weakEdge
        ? simulate({ ...variant, edges: variant.edges.map((e) => (e.id === weakEdge.id ? { ...e, rate: Math.min(100, e.rate + 1) } : e)) })
        : null,
    [variant, weakEdge],
  );
  const gain = boosted ? boosted.conversions - sim.conversions : 0;
  const revenueGain = boosted ? boosted.revenue - sim.revenue : 0;
  const pathMax = Math.max(1, ...sim.path.map((id) => sim.nodes[id]?.arrivals ?? 0));
  const real = sim.real;
  const empty = variant.nodes.filter((n) => n.kind !== "note").length === 0;

  return (
    <>
      <PanelSection>
        <div className="flex items-center gap-2">
          <span className="grid size-6 shrink-0 place-items-center rounded-md bg-ink text-[11px] font-semibold text-white">{letter}</span>
          <Input
            id={variantNameId}
            aria-label="Nome da variante"
            value={variant.name}
            maxLength={60}
            onFocus={onCommit}
            onChange={(event) => onVariantName(event.target.value)}
            onBlur={(event) => {
              if (!event.target.value.trim()) onVariantName(letter === "A" ? "Original" : `Variante ${letter}`);
            }}
            className="h-7 font-medium"
          />
        </div>
        <p className="mt-2 text-[11.5px] text-ink-3">
          {goal ? (
            <>
              Meta: <span className="font-medium text-ink-2">{goal.name}</span>
              {sim.goalAuto ? " · escolhida automaticamente" : null}
            </>
          ) : (
            "Adicione uma etapa de conversão (plataforma, checkout, contrato) para medir o funil."
          )}
        </p>
      </PanelSection>

      {empty ? (
        <PanelSection>
          <div className="flex flex-col items-center gap-2 py-4 text-center">
            <MousePointerClick className="size-5 text-ink-4" aria-hidden />
            <p className="text-[13px] font-medium text-ink">Quadro vazio</p>
            <p className="text-[12px] leading-snug text-ink-3">
              Comece por uma origem (anúncios, redes sociais, indicação) e siga até a conversão.
            </p>
          </div>
        </PanelSection>
      ) : (
        <>
          <PanelSection title="Previsão por mês">
            <div className="grid grid-cols-2 gap-x-3 gap-y-3.5">
              <Stat label="Entradas" value={formatPeople(sim.entries)} sub="pessoas" />
              <Stat label="Conversões" value={formatPeople(sim.conversions)} sub={goal?.name ?? "sem meta"} />
              <Stat label="Taxa de conversão" value={sim.entries > 0 ? formatShare(sim.rate) : "—"} sub="entrada → meta" />
              <Stat label="Receita" value={formatMoney(sim.revenue, "compact")} />
              <Stat label="Custo" value={formatMoney(sim.cost, "compact")} />
              <Stat
                label="Custo por conversão"
                value={sim.costPerConversion != null ? formatMoney(sim.costPerConversion, sim.costPerConversion < 100 ? "full" : "round") : "—"}
              />
              <Stat label="Resultado" value={formatMoney(sim.profit, "compact")} sub="receita − custo" />
              <Stat label="Retorno (ROI)" value={sim.roi != null ? formatMultiple(sim.roi) : "—"} sub={sim.roi != null ? "lucro sobre o custo" : "sem custo informado"} />
            </div>
          </PanelSection>

          {sim.path.length > 1 ? (
            <PanelSection title="Caminho principal">
              <ol className="flex flex-col">
                {sim.path.map((id, index) => {
                  const node = byId.get(id);
                  const arrivals = sim.nodes[id]?.arrivals ?? 0;
                  const edgeId = sim.pathEdges[index];
                  const edge = edgeId ? sim.edges[edgeId] : undefined;
                  const weak = edgeId != null && edgeId === sim.weakest;
                  return (
                    <li key={id}>
                      <button
                        type="button"
                        onClick={() => onSelect({ nodes: [id], edges: [] })}
                        className="group w-full cursor-pointer rounded-md py-1 text-left"
                      >
                        <span className="flex items-baseline justify-between gap-2 text-[12px]">
                          <span className="truncate text-ink-2 group-hover:text-accent">{node?.name}</span>
                          <span className="shrink-0 font-medium text-ink tabular-nums">{formatPeople(arrivals)}</span>
                        </span>
                        <span className="mt-1 block h-1.5 rounded-full bg-hover">
                          <span
                            className="block h-full rounded-full bg-accent"
                            style={{ width: `${Math.max(1.5, (arrivals / pathMax) * 100)}%` }}
                          />
                        </span>
                      </button>
                      {edge && edgeId ? (
                        <button
                          type="button"
                          onClick={() => onSelect({ nodes: [], edges: [edgeId] })}
                          className={cn(
                            "my-0.5 inline-flex cursor-pointer items-center gap-1 rounded px-1 text-[11px] tabular-nums hover:bg-hover",
                            weak ? "font-medium text-amber-700" : "text-ink-4",
                          )}
                        >
                          {weak ? <TriangleAlert className="size-3" aria-hidden /> : <ArrowDownRight className="size-3" aria-hidden />}
                          {formatShare(edge.share)} seguem{weak ? " · maior perda" : ""}
                        </button>
                      ) : null}
                    </li>
                  );
                })}
              </ol>
              {weakEdge && gain > 0.05 ? (
                <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50/70 px-3 py-2.5">
                  <p className="flex items-center gap-1.5 text-[12px] font-semibold text-amber-900">
                    <TriangleAlert className="size-3.5" aria-hidden />
                    Gargalo: {byId.get(weakEdge.source)?.name} → {byId.get(weakEdge.target)?.name}
                  </p>
                  <p className="mt-1 text-[12px] leading-snug text-amber-900/80">
                    Só {formatShare(sim.edges[weakEdge.id]?.share ?? 0)} seguem. Cada ponto a mais nessa taxa rende +{formatPeople(gain)}{" "}
                    {gain >= 1.5 ? "conversões" : "conversão"}
                    {revenueGain > 0 ? ` e +${formatMoney(revenueGain, "compact")}` : ""} por mês.
                  </p>
                  <button
                    type="button"
                    onClick={() => onSelect({ nodes: [], edges: [weakEdge.id] })}
                    className="mt-1.5 cursor-pointer text-[12px] font-medium text-amber-900 underline-offset-2 hover:underline"
                  >
                    Ajustar essa taxa
                  </button>
                </div>
              ) : null}
            </PanelSection>
          ) : null}

          {real.filled > 0 ? (
            <PanelSection title="Real × previsto">
              <table className="w-full text-[12px] tabular-nums">
                <thead>
                  <tr className="text-left text-[11px] text-ink-4">
                    <th className="pb-1 font-medium" />
                    <th className="pb-1 text-right font-medium">Previsto</th>
                    <th className="pb-1 text-right font-medium">Real</th>
                    <th className="pb-1 text-right font-medium">Diferença</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {[
                    { label: "Entradas", plan: sim.entries, actual: real.entries, format: formatPeople },
                    { label: "Conversões", plan: sim.conversions, actual: real.conversions, format: formatPeople },
                    { label: "Receita", plan: sim.revenue, actual: real.revenue, format: (n: number) => formatMoney(n, "compact") },
                  ].map((row) => (
                    <tr key={row.label}>
                      <td className="py-1.5 text-ink-3">{row.label}</td>
                      <td className="py-1.5 text-right text-ink-2">{row.format(row.plan)}</td>
                      <td className="py-1.5 text-right font-medium text-ink">{row.actual == null ? "—" : row.format(row.actual)}</td>
                      <td className="py-1.5 text-right">
                        <Delta value={realDelta(row.plan, row.actual)} />
                      </td>
                    </tr>
                  ))}
                  <tr>
                    <td className="py-1.5 text-ink-3">Taxa</td>
                    <td className="py-1.5 text-right text-ink-2">{sim.entries > 0 ? formatShare(sim.rate) : "—"}</td>
                    <td className="py-1.5 text-right font-medium text-ink">{real.rate == null ? "—" : formatShare(real.rate)}</td>
                    <td className="py-1.5 text-right">
                      <Delta value={real.rate == null ? null : realDelta(sim.rate, real.rate)} />
                    </td>
                  </tr>
                </tbody>
              </table>
              <p className="mt-2 text-[11px] text-ink-4">
                {real.filled} {real.filled === 1 ? "etapa com resultado real" : "etapas com resultado real"}.
              </p>
            </PanelSection>
          ) : null}
        </>
      )}

      <PanelSection title="Sobre o funil">
        <Label htmlFor={`${uid}-description`}>Objetivo ou hipótese</Label>
        <Textarea
          id={`${uid}-description`}
          value={doc.description}
          maxLength={2000}
          rows={3}
          onFocus={onCommit}
          onChange={(event) => onDoc({ description: event.target.value })}
          placeholder="Ex.: testar se o agente de IA converte mais que o formulário de contato."
          className="min-h-18 text-[12.5px]"
        />
        {products.length > 0 ? (
          <div className="mt-3">
            <Label htmlFor={`${uid}-product`}>Produto</Label>
            <Select
              id={`${uid}-product`}
              value={doc.productId ?? ""}
              onChange={(event) => {
                onCommit();
                onDoc({ productId: event.target.value || null });
              }}
            >
              <option value="">Nenhum</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          </div>
        ) : null}
      </PanelSection>

      <PanelSection>
        <ul className="flex flex-col gap-1.5 text-[11.5px] leading-snug text-ink-4">
          <li>Arraste etapas da lateral para o quadro, ou selecione uma etapa e clique na próxima.</li>
          <li>Para ligar, puxe a bolinha da direita de um card até outro. A % na linha é quanto segue.</li>
          <li>Linhas mais grossas levam mais gente. Delete apaga o que estiver selecionado.</li>
        </ul>
      </PanelSection>
    </>
  );
}

/* ---------- Etapa ---------- */
function NodePanel({
  node,
  variant,
  sim,
  onCommit,
  onNode,
  onEdge,
  onRemove,
  onGoal,
  onSelect,
}: Handlers & { node: FunnelNode; variant: FunnelVariant; sim: FunnelSim }) {
  const uid = useId();
  const kind = STEP_KINDS[node.kind];
  const group = STEP_GROUPS[kind.group];
  const Icon = kind.icon;
  const result = sim.nodes[node.id];
  const arrivals = result?.arrivals ?? 0;
  const origin = kind.group === "source";
  const outs = variant.edges.filter((e) => e.source === node.id);
  const ins = variant.edges.filter((e) => e.target === node.id);
  const byId = new Map(variant.nodes.map((n) => [n.id, n]));
  const isGoal = sim.goalId === node.id;
  const pinned = variant.goalId === node.id;
  const url = safeUrl(node.url);

  return (
    <>
      <PanelSection>
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className={cn("grid size-9 shrink-0 place-items-center rounded-lg [&_svg]:size-4", group.tile)}>
              <Icon aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="truncate text-[13.5px] font-semibold text-ink">{kind.label}</p>
              <p className="truncate text-[11.5px] text-ink-3">
                {group.label} · {kind.hint}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon-sm" aria-label="Excluir etapa" title="Excluir etapa" onClick={() => onRemove([node.id], [])}>
            <Trash2 />
          </Button>
        </div>
        <div className="mt-3">
          <Label htmlFor={`${uid}-name`}>Nome</Label>
          <Input
            id={`${uid}-name`}
            value={node.name}
            maxLength={80}
            onFocus={onCommit}
            onChange={(event) => onNode(node.id, { name: event.target.value })}
            onBlur={(event) => {
              if (!event.target.value.trim()) onNode(node.id, { name: kind.label });
            }}
          />
        </div>
      </PanelSection>

      {origin ? (
        <PanelSection title="Entrada">
          <div className="grid grid-cols-2 gap-2.5">
            <NumberField label="Pessoas por mês" value={node.volume} onFocus={onCommit} onChange={(v) => onNode(node.id, { volume: v ?? 0 })} />
            <NumberField label="Investimento por mês" prefix="R$" value={node.cost} max={10_000_000_000} onFocus={onCommit} onChange={(v) => onNode(node.id, { cost: v ?? 0 })} />
          </div>
          <p className="mt-2 text-[11.5px] text-ink-4">
            {node.cost > 0 && node.volume > 0 ? (
              <>
                Custo por pessoa: <span className="font-medium text-ink-2">{formatMoney(node.cost / node.volume)}</span>
              </>
            ) : (
              "Quantas pessoas chegam por esta origem num mês (cliques, visitas, contatos)."
            )}
          </p>
        </PanelSection>
      ) : (
        <PanelSection title="Chegam aqui">
          <p className="text-[20px] leading-7 font-semibold tracking-tight text-ink tabular-nums">
            {formatPeople(arrivals)} <span className="text-[12px] font-normal tracking-normal text-ink-3">pessoas por mês</span>
          </p>
          <p className="text-[11.5px] text-ink-3">
            {sim.entries > 0 ? `${formatShare(arrivals / sim.entries)} de quem entrou no funil` : "Ligue uma origem para ver o volume."}
          </p>
          {ins.length === 0 ? (
            <p className="mt-2 rounded-md bg-hover px-2 py-1.5 text-[11.5px] text-ink-3">Nenhuma etapa leva até aqui ainda.</p>
          ) : null}
        </PanelSection>
      )}

      <PanelSection title="Para onde vão">
        {outs.length === 0 ? (
          <p className="text-[12px] leading-snug text-ink-3">
            Etapa final. Puxe a bolinha da direita do card até outra etapa para continuar o caminho.
          </p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {outs.map((edge) => {
              const target = byId.get(edge.target);
              return (
                <li key={edge.id} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onSelect({ nodes: [], edges: [edge.id] })}
                    className="flex min-w-0 flex-1 cursor-pointer items-center gap-1.5 text-left text-[12.5px] text-ink-2 hover:text-accent"
                  >
                    <ArrowRight className="size-3.5 shrink-0 text-ink-4" aria-hidden />
                    <span className="truncate">{target?.name}</span>
                  </button>
                  <NumberField
                    compact
                    className="w-[78px] shrink-0"
                    aria-label={`Taxa para ${target?.name ?? "a próxima etapa"}`}
                    suffix="%"
                    max={100}
                    value={edge.rate}
                    onFocus={onCommit}
                    onChange={(v) => onEdge(edge.id, { rate: v ?? 0 })}
                  />
                  <span className="w-11 shrink-0 text-right text-[11.5px] text-ink-3 tabular-nums">{formatPeople(sim.edges[edge.id]?.flow ?? 0)}</span>
                </li>
              );
            })}
          </ul>
        )}
        {result?.overflow ? (
          <p className="mt-2.5 flex gap-1.5 rounded-md bg-amber-50 px-2 py-1.5 text-[11.5px] leading-snug text-amber-800">
            <TriangleAlert className="mt-px size-3.5 shrink-0" aria-hidden />
            As saídas somam mais de 100%. O cálculo divide as pessoas na mesma proporção; ajuste as taxas.
          </p>
        ) : result?.hasExits && arrivals > 0 ? (
          <p className="mt-2 text-[11.5px] text-ink-4">
            {formatShare(result.dropShare)} param aqui ({formatPeople(Math.max(0, arrivals - result.forwarded))} por mês).
          </p>
        ) : null}
      </PanelSection>

      {origin ? null : (
        <PanelSection title="Valores">
          <div className="grid grid-cols-2 gap-2.5">
            <NumberField
              label="Receita por pessoa"
              prefix="R$"
              value={node.value}
              onFocus={onCommit}
              onChange={(v) => onNode(node.id, { value: v ?? 0 })}
            />
            <NumberField
              label="Custo por pessoa"
              prefix="R$"
              value={node.unitCost}
              max={10_000_000}
              onFocus={onCommit}
              onChange={(v) => onNode(node.id, { unitCost: v ?? 0 })}
            />
            <NumberField
              label="Custo fixo por mês"
              prefix="R$"
              value={node.cost}
              max={10_000_000_000}
              className="col-span-2"
              onFocus={onCommit}
              onChange={(v) => onNode(node.id, { cost: v ?? 0 })}
            />
          </div>
          <p className="mt-2 text-[11.5px] leading-snug text-ink-4">
            {result && (result.revenue > 0 || result.cost > 0) ? (
              <>
                Gera <span className="font-medium text-ink-2">{formatMoney(result.revenue, "compact")}</span> e custa{" "}
                <span className="font-medium text-ink-2">{formatMoney(result.cost, "compact")}</span> por mês.
              </>
            ) : (
              "Receita: o ticket de quem chega aqui. Custos: ferramenta, time ou o custo de cada atendimento."
            )}
          </p>
        </PanelSection>
      )}

      {origin ? null : (
        <PanelSection title="Meta">
          <label className="flex cursor-pointer items-start gap-2.5">
            <Checkbox
              className="mt-0.5"
              checked={pinned}
              onChange={(event) => {
                onCommit();
                onGoal(event.target.checked ? node.id : null);
              }}
            />
            <span className="text-[12.5px] leading-snug text-ink-2">
              Esta etapa é a conversão do funil
              <span className="mt-0.5 block text-[11.5px] text-ink-4">
                {isGoal && !pinned
                  ? "Hoje ela já é a meta, escolhida automaticamente."
                  : "A taxa de conversão e o custo por conversão usam esta etapa."}
              </span>
            </span>
          </label>
        </PanelSection>
      )}

      <PanelSection title="Resultado real">
        <NumberField
          label="Pessoas no último mês"
          allowEmpty
          placeholder="Ainda não medido"
          value={node.actual}
          onFocus={onCommit}
          onChange={(v) => onNode(node.id, { actual: v })}
        />
        <p className="mt-2 text-[11.5px] leading-snug text-ink-4">
          {node.actual != null ? (
            <>
              Previsto {formatPeople(arrivals)} · real <span className="font-medium text-ink-2">{formatPeople(node.actual)}</span>{" "}
              <Delta value={realDelta(arrivals, node.actual)} />
            </>
          ) : (
            "Depois de rodar o funil, anote quantas pessoas chegaram aqui e veja na visão Real."
          )}
        </p>
      </PanelSection>

      <PanelSection title="Detalhes">
        <Label htmlFor={`${uid}-url`}>Link</Label>
        <div className="flex gap-1.5">
          <Input
            id={`${uid}-url`}
            value={node.url}
            maxLength={500}
            placeholder="https://"
            onFocus={onCommit}
            onChange={(event) => onNode(node.id, { url: event.target.value })}
          />
          {url ? (
            <Button asChild variant="secondary" size="icon" aria-label="Abrir link">
              <a href={url} target="_blank" rel="noopener noreferrer">
                <ExternalLink />
              </a>
            </Button>
          ) : null}
        </div>
        <div className="mt-3">
          <Label htmlFor={`${uid}-note`}>Anotações</Label>
          <Textarea
            id={`${uid}-note`}
            value={node.note}
            maxLength={1000}
            rows={3}
            onFocus={onCommit}
            onChange={(event) => onNode(node.id, { note: event.target.value })}
            placeholder="Roteiro, oferta, hipótese desta etapa…"
            className="min-h-18 text-[12.5px]"
          />
        </div>
      </PanelSection>
    </>
  );
}

/* ---------- Nota ---------- */
function NotePanel({ node, onCommit, onNode, onRemove }: Handlers & { node: FunnelNode }) {
  const uid = useId();
  return (
    <PanelSection>
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-amber-50 text-amber-700 [&_svg]:size-4">
            <StickyNote aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="text-[13.5px] font-semibold text-ink">Nota</p>
            <p className="text-[11.5px] text-ink-3">Não entra no cálculo</p>
          </div>
        </div>
        <Button variant="ghost" size="icon-sm" aria-label="Excluir nota" title="Excluir nota" onClick={() => onRemove([node.id], [])}>
          <Trash2 />
        </Button>
      </div>
      <div className="mt-3">
        <Label htmlFor={`${uid}-title`}>Título</Label>
        <Input id={`${uid}-title`} value={node.name} maxLength={80} onFocus={onCommit} onChange={(event) => onNode(node.id, { name: event.target.value })} />
      </div>
      <div className="mt-3">
        <Label htmlFor={`${uid}-text`}>Texto</Label>
        <Textarea
          id={`${uid}-text`}
          value={node.note}
          maxLength={1000}
          rows={6}
          onFocus={onCommit}
          onChange={(event) => onNode(node.id, { note: event.target.value })}
          placeholder="Hipótese, roteiro ou o que aprendemos com o teste."
          className="text-[12.5px]"
        />
      </div>
    </PanelSection>
  );
}

/* ---------- Conexão ---------- */
function EdgePanel({
  edge,
  variant,
  sim,
  onCommit,
  onEdge,
  onRemove,
  onSelect,
}: Handlers & { edge: FunnelEdge; variant: FunnelVariant; sim: FunnelSim }) {
  const from = variant.nodes.find((n) => n.id === edge.source);
  const to = variant.nodes.find((n) => n.id === edge.target);
  const result = sim.edges[edge.id];
  const fromArrivals = sim.nodes[edge.source]?.arrivals ?? 0;
  const overflow = sim.nodes[edge.source]?.overflow;
  if (!from || !to) return null;

  return (
    <>
      <PanelSection>
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[13.5px] font-semibold text-ink">Conexão</p>
            <p className="text-[11.5px] text-ink-3">Quanto das pessoas segue de uma etapa para a outra</p>
          </div>
          <Button variant="ghost" size="icon-sm" aria-label="Remover conexão" title="Remover conexão" onClick={() => onRemove([], [edge.id])}>
            <Trash2 />
          </Button>
        </div>
        <div className="mt-3 flex items-center gap-1.5">
          {[from, to].map((node, index) => (
            <span key={node.id} className="contents">
              {index === 1 ? <ArrowRight className="size-3.5 shrink-0 text-ink-4" aria-hidden /> : null}
              <button
                type="button"
                onClick={() => onSelect({ nodes: [node.id], edges: [] })}
                className="min-w-0 cursor-pointer truncate rounded-md border border-line bg-subtle px-2 py-1 text-[12px] font-medium text-ink-2 hover:border-line-strong hover:text-ink"
              >
                {node.name}
              </button>
            </span>
          ))}
        </div>
      </PanelSection>

      <PanelSection title="Taxa de passagem">
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={0}
            max={100}
            step={0.5}
            value={edge.rate}
            aria-label="Taxa de passagem"
            onFocus={onCommit}
            onChange={(event) => onEdge(edge.id, { rate: Number(event.target.value) })}
            className="h-1.5 min-w-0 flex-1 cursor-pointer accent-accent"
          />
          <NumberField
            compact
            className="w-[78px] shrink-0"
            aria-label="Taxa de passagem em %"
            suffix="%"
            max={100}
            value={edge.rate}
            onFocus={onCommit}
            onChange={(v) => onEdge(edge.id, { rate: v ?? 0 })}
          />
        </div>
        <p className="mt-2.5 text-[12px] leading-snug text-ink-2">
          <span className="font-semibold text-ink tabular-nums">{formatPeople(result?.flow ?? 0)}</span> de{" "}
          <span className="tabular-nums">{formatPeople(fromArrivals)}</span> pessoas por mês seguem de {from.name} para {to.name}.
        </p>
        {overflow ? (
          <p className="mt-2 flex gap-1.5 rounded-md bg-amber-50 px-2 py-1.5 text-[11.5px] leading-snug text-amber-800">
            <TriangleAlert className="mt-px size-3.5 shrink-0" aria-hidden />
            As saídas de {from.name} somam mais de 100%. O cálculo usa {formatShare(result?.share ?? 0)} para esta conexão.
          </p>
        ) : null}
      </PanelSection>

      <PanelSection title="Real">
        {result?.realShare != null ? (
          <p className="text-[12px] leading-snug text-ink-2">
            Taxa real <span className="font-semibold text-ink tabular-nums">{formatShare(result.realShare)}</span> (
            {formatPeople(to.actual ?? 0)} de {formatPeople(from.actual ?? 0)}){" "}
            <Delta value={result.share > 0 ? realDelta(result.share, result.realShare) : null} />
          </p>
        ) : (
          <p className="text-[11.5px] leading-snug text-ink-4">
            Anote o resultado real de {from.name} e de {to.name} para ver a taxa que aconteceu de verdade.
          </p>
        )}
      </PanelSection>
    </>
  );
}

/* ---------- Vários itens ---------- */
function MultiPanel({ count, onRemove }: { count: number; onRemove: () => void }) {
  return (
    <PanelSection>
      <p className="text-[13.5px] font-semibold text-ink">{count} itens selecionados</p>
      <p className="mt-1 text-[12px] text-ink-3">Arraste qualquer um deles para mover o grupo.</p>
      <Button variant="danger" size="sm" className="mt-3" onClick={onRemove}>
        <Trash2 />
        Excluir selecionados
      </Button>
    </PanelSection>
  );
}
