import { NODE_SIZE, STEP_GROUPS, STEP_KINDS, type FunnelSim, type FunnelVariant } from "@/lib/funnels";
import { cn } from "@/lib/utils";

/**
 * Miniatura do desenho do funil para a lista: cards e conexões na posição real, em escala.
 * A cor do quadradinho é o grupo da etapa; a linha mais grossa leva mais gente.
 */
export function FunnelThumbnail({ variant, sim, className }: { variant: FunnelVariant; sim: FunnelSim; className?: string }) {
  const flow = variant.nodes.filter((n) => n.kind !== "note");
  if (flow.length === 0) {
    return <div className={cn("grid place-items-center text-[12px] text-ink-4", className)}>Quadro vazio</div>;
  }

  const W = NODE_SIZE.width;
  const H = NODE_SIZE.height;
  const minX = Math.min(...flow.map((n) => n.x));
  const minY = Math.min(...flow.map((n) => n.y));
  const maxX = Math.max(...flow.map((n) => n.x + W));
  const maxY = Math.max(...flow.map((n) => n.y + H));
  // Escala mínima: funis curtos não viram cards gigantes na miniatura
  const width = Math.max(maxX - minX + 120, 1100);
  const height = Math.max(maxY - minY + 120, 440);
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const byId = new Map(flow.map((n) => [n.id, n]));
  const path = new Set(sim.pathEdges);

  return (
    <svg
      viewBox={`${cx - width / 2} ${cy - height / 2} ${width} ${height}`}
      preserveAspectRatio="xMidYMid meet"
      className={className}
      aria-hidden
    >
      {variant.edges.map((edge) => {
        const from = byId.get(edge.source);
        const to = byId.get(edge.target);
        if (!from || !to) return null;
        const x1 = from.x + W;
        const y1 = from.y + H / 2;
        const x2 = to.x;
        const y2 = to.y + H / 2;
        const bend = Math.max(48, Math.abs(x2 - x1) * 0.45);
        const weight = sim.maxFlow > 0 ? (sim.edges[edge.id]?.flow ?? 0) / sim.maxFlow : 0;
        return (
          <path
            key={edge.id}
            d={`M ${x1} ${y1} C ${x1 + bend} ${y1}, ${x2 - bend} ${y2}, ${x2} ${y2}`}
            fill="none"
            stroke={path.has(edge.id) ? "rgb(11 99 232 / 0.55)" : "rgb(11 99 232 / 0.25)"}
            strokeWidth={6 + weight * 18}
            strokeLinecap="round"
          />
        );
      })}
      {flow.map((node) => {
        const hex = STEP_GROUPS[STEP_KINDS[node.kind].group].hex;
        const goal = sim.goalId === node.id;
        return (
          <g key={node.id}>
            <rect
              x={node.x}
              y={node.y}
              width={W}
              height={H}
              rx={16}
              fill="#ffffff"
              stroke={goal ? "rgb(11 99 232 / 0.6)" : "#e7e5e4"}
              strokeWidth={goal ? 5 : 3}
            />
            <rect x={node.x + 14} y={node.y + 12} width={36} height={36} rx={9} fill={hex} fillOpacity={0.16} />
            <circle cx={node.x + 32} cy={node.y + 30} r={7} fill={hex} />
            <rect x={node.x + 64} y={node.y + 16} width={112} height={11} rx={5.5} fill="#d6d3d1" />
            <rect x={node.x + 64} y={node.y + 35} width={64} height={9} rx={4.5} fill="#e7e5e4" />
            <line x1={node.x} y1={node.y + 60} x2={node.x + W} y2={node.y + 60} stroke="#e7e5e4" strokeWidth={3} />
            <rect x={node.x + 14} y={node.y + 71} width={54} height={10} rx={5} fill="#a6a09b" fillOpacity={0.55} />
          </g>
        );
      })}
    </svg>
  );
}
