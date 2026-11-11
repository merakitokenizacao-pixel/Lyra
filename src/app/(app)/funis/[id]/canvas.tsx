"use client";

import { createContext, memo, useContext } from "react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  Handle,
  Position,
  getBezierPath,
  useConnection,
  type Edge,
  type EdgeProps,
  type Node,
  type NodeProps,
} from "@xyflow/react";
import { ArrowDownRight, ArrowUpRight, Flag, StickyNote, TriangleAlert } from "lucide-react";
import { formatMoney } from "@/lib/format";
import {
  NODE_SIZE,
  STEP_GROUPS,
  STEP_KINDS,
  formatPeople,
  formatShare,
  realDelta,
  type FunnelNode,
  type FunnelSim,
} from "@/lib/funnels";
import { cn } from "@/lib/utils";

/* Peças do quadro: o card de etapa, a nota e a conexão (com espessura proporcional ao fluxo). */

export type CanvasView = "plan" | "real";
/** O próprio objeto da etapa vai como `data`: etapas que não mudaram mantêm a referência e não redesenham. */
export type CanvasNode = Node<FunnelNode, "step" | "note">;
export type CanvasEdge = Edge<{ rate: number }, "flow">;

type CanvasState = {
  sim: FunnelSim;
  view: CanvasView;
  pathEdges: Set<string>;
  selectEdge: (id: string) => void;
  /** A ligação source → target é permitida (sem ciclo, sem repetir, destino não é origem). */
  canConnect: (source: string, target: string) => boolean;
};

export const CanvasContext = createContext<CanvasState | null>(null);

function useCanvas() {
  const ctx = useContext(CanvasContext);
  if (!ctx) throw new Error("CanvasContext ausente");
  return ctx;
}

/* ---------- Etapa ---------- */
const StepNodeView = memo(function StepNodeView({ id, data, selected }: NodeProps<CanvasNode>) {
  const { sim, view, canConnect } = useCanvas();
  const node = data;
  // Enquanto alguém puxa uma ligação, os cards que podem recebê-la se destacam e os outros apagam
  const connectingFrom = useConnection((c) => (c.inProgress ? c.fromNode.id : null));
  const receiving = connectingFrom != null && connectingFrom !== id;
  const canReceive = receiving && canConnect(connectingFrom, id);
  const kind = STEP_KINDS[node.kind];
  const group = STEP_GROUPS[kind.group];
  const Icon = kind.icon;
  const result = sim.nodes[id];
  const isGoal = sim.goalId === id;
  const isOrigin = kind.group === "source";
  const arrivals = result?.arrivals ?? 0;

  return (
    <div
      className={cn(
        "relative rounded-xl border bg-panel shadow-card transition-[border-color,box-shadow,opacity] duration-150",
        canReceive
          ? "lyro-can-receive border-accent/60 shadow-[0_0_0_4px_rgb(11_99_232/0.1)]"
          : receiving
            ? "border-line opacity-45"
            : selected
              ? "border-accent shadow-[0_0_0_3px_rgb(11_99_232/0.14),0_1px_3px_rgb(28_25_23/0.06)]"
              : isGoal
                ? "border-accent/45 hover:border-accent/70"
                : "border-line hover:border-line-strong",
      )}
      style={{ width: NODE_SIZE.width }}
    >
      {isOrigin ? null : <Handle type="target" position={Position.Left} isConnectableStart={false} />}

      <div className="flex items-center gap-2.5 px-3 pt-2.5 pb-2">
        <span className={cn("grid size-8 shrink-0 place-items-center rounded-lg [&_svg]:size-4", group.tile)}>
          <Icon aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] leading-5 font-semibold text-ink">{node.name}</p>
          <p className="truncate text-[11px] leading-4 text-ink-3">{kind.label}</p>
        </div>
        {isGoal ? (
          <span
            className="inline-flex h-5 shrink-0 items-center gap-1 rounded-full bg-accent-soft px-1.5 text-[10.5px] font-semibold text-accent"
            title={sim.goalAuto ? "Meta escolhida automaticamente" : "Meta do funil"}
          >
            <Flag className="size-3" aria-hidden />
            Meta
          </span>
        ) : null}
      </div>

      <div className="flex h-8 items-center justify-between gap-2 border-t border-line px-3 text-[11.5px] tabular-nums">
        {view === "real" ? (
          <RealMetrics planned={arrivals} actual={node.actual} />
        ) : (
          <>
            <span className="truncate text-ink-3">
              <span className="font-semibold text-ink">{formatPeople(arrivals)}</span> /mês
            </span>
            <PlanDetail node={node} arrivals={arrivals} result={result} isOrigin={isOrigin} />
          </>
        )}
      </div>

      <Handle type="source" position={Position.Right} />
    </div>
  );
});

function PlanDetail({
  node,
  arrivals,
  result,
  isOrigin,
}: {
  node: FunnelNode;
  arrivals: number;
  result: FunnelSim["nodes"][string] | undefined;
  isOrigin: boolean;
}) {
  if (result?.overflow) {
    return (
      <span className="inline-flex shrink-0 items-center gap-1 font-medium text-warning" title="As saídas somam mais de 100%">
        <TriangleAlert className="size-3" aria-hidden />
        saídas &gt; 100%
      </span>
    );
  }
  if (isOrigin) {
    return node.cost > 0 ? <span className="shrink-0 text-ink-3">{formatMoney(node.cost, "compact")} /mês</span> : null;
  }
  if (node.value > 0) {
    return (
      <span className="shrink-0 font-medium text-ink-2" title="Receita prevista por mês">
        {formatMoney(arrivals * node.value, "compact")}
      </span>
    );
  }
  if (result?.hasExits && arrivals > 0) {
    return (
      <span className="shrink-0 text-ink-3" title="Parcela que para nesta etapa">
        {formatShare(result.dropShare)} param
      </span>
    );
  }
  return null;
}

function RealMetrics({ planned, actual }: { planned: number; actual: number | null }) {
  if (actual == null) {
    return (
      <>
        <span className="text-ink-4">Sem dado real</span>
        <span className="shrink-0 text-ink-4">prev. {formatPeople(planned)}</span>
      </>
    );
  }
  const delta = realDelta(planned, actual);
  const Trend = delta == null || Math.abs(delta) < 0.005 ? null : delta > 0 ? ArrowUpRight : ArrowDownRight;
  return (
    <>
      <span className="truncate text-ink-3">
        <span className="font-semibold text-ink">{formatPeople(actual)}</span> real
      </span>
      {delta == null ? null : (
        <span
          className={cn(
            "inline-flex shrink-0 items-center gap-0.5 font-medium",
            Trend == null ? "text-ink-3" : delta > 0 ? "text-success" : "text-danger",
          )}
          title={`Previsto: ${formatPeople(planned)} por mês`}
        >
          {Trend ? <Trend className="size-3" aria-hidden /> : null}
          {delta > 0 ? "+" : delta < 0 ? "−" : ""}
          {formatShare(Math.abs(delta))}
        </span>
      )}
    </>
  );
}

/* ---------- Nota ---------- */
const NoteNodeView = memo(function NoteNodeView({ data: node, selected }: NodeProps<CanvasNode>) {
  return (
    <div
      className={cn(
        "rounded-lg border bg-amber-50 px-3 pt-2.5 pb-3 shadow-card transition-[border-color,box-shadow]",
        selected ? "border-amber-400 shadow-[0_0_0_3px_rgb(245_158_11/0.18)]" : "border-amber-200 hover:border-amber-300",
      )}
      style={{ width: NODE_SIZE.width }}
    >
      <p className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-amber-800 uppercase">
        <StickyNote className="size-3" aria-hidden />
        <span className="truncate">{node.name || "Nota"}</span>
      </p>
      <p className={cn("mt-1 text-[12.5px] leading-snug whitespace-pre-wrap", node.note ? "text-amber-950/80" : "text-amber-900/45")}>
        {node.note || "Escreva uma hipótese ou um aprendizado."}
      </p>
    </div>
  );
});

/* ---------- Conexão ---------- */
const FlowEdgeView = memo(function FlowEdgeView({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  selected,
}: EdgeProps<CanvasEdge>) {
  const { sim, view, pathEdges, selectEdge } = useCanvas();
  const result = sim.edges[id];
  const [path, labelX, labelY] = getBezierPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition, curvature: 0.3 });
  // A espessura mostra o volume: a conexão com mais gente tem 7,5px, as outras são proporcionais
  const weight = sim.maxFlow > 0 && result ? result.flow / sim.maxFlow : 0;
  const onPath = pathEdges.has(id);
  const weakest = sim.weakest === id;
  const share = view === "real" ? (result?.realShare ?? null) : (result?.share ?? 0);

  return (
    <>
      <BaseEdge
        id={id}
        path={path}
        interactionWidth={26}
        style={{
          stroke: selected ? "var(--accent)" : onPath ? "rgb(11 99 232 / 0.5)" : "rgb(11 99 232 / 0.24)",
          strokeWidth: 1.5 + weight * 6,
          strokeLinecap: "round",
        }}
      />
      <EdgeLabelRenderer>
        <button
          type="button"
          onClick={() => selectEdge(id)}
          className={cn(
            "nodrag nopan absolute flex h-6 cursor-pointer items-center gap-1.5 rounded-full border bg-panel px-2 text-[11px] whitespace-nowrap shadow-xs tabular-nums transition-colors",
            selected
              ? "border-accent text-accent"
              : weakest && view === "plan"
                ? "border-amber-300 bg-amber-50 text-amber-800 hover:border-amber-400"
                : "border-line text-ink hover:border-line-strong",
          )}
          style={{ transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`, pointerEvents: "all" }}
          aria-label={`Conexão: ${share == null ? "sem taxa real" : formatShare(share)}`}
          title={weakest && view === "plan" ? "Gargalo: a menor taxa do caminho principal" : undefined}
        >
          {weakest && view === "plan" ? <TriangleAlert className="size-3" aria-hidden /> : null}
          <span className="font-semibold">{share == null ? "—" : formatShare(share)}</span>
          {view === "plan" && result ? <span className={selected ? "text-accent/70" : "text-ink-4"}>{formatPeople(result.flow)}</span> : null}
        </button>
      </EdgeLabelRenderer>
    </>
  );
});

export const NODE_TYPES = { step: StepNodeView, note: NoteNodeView };
export const EDGE_TYPES = { flow: FlowEdgeView };
