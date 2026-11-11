"use client";

import { useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { Table2, BarChart3 } from "lucide-react";
import { formatMoney, formatNumber, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";

/* ---------- Tooltip ---------- */
function Tooltip({ x, y, children }: { x: number; y: number; children: ReactNode }) {
  return (
    <div
      role="tooltip"
      className="pointer-events-none absolute z-20 min-w-40 -translate-x-1/2 -translate-y-[calc(100%+10px)] rounded-lg border border-line bg-panel px-3 py-2 text-xs shadow-pop"
      style={{ left: x, top: y }}
    >
      {children}
    </div>
  );
}

function useHover<T>() {
  const ref = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<{ item: T; x: number; y: number } | null>(null);
  function fromPointer(item: T, event: ReactPointerEvent) {
    const box = ref.current?.getBoundingClientRect();
    if (!box) return;
    setHover({ item, x: event.clientX - box.left, y: event.clientY - box.top });
  }
  function fromFocus(item: T, el: HTMLElement) {
    const box = ref.current?.getBoundingClientRect();
    const target = el.getBoundingClientRect();
    if (!box) return;
    setHover({ item, x: target.left - box.left + target.width / 2, y: target.top - box.top });
  }
  return { ref, hover, fromPointer, fromFocus, clear: () => setHover(null) };
}

/* ---------- Leads por etapa (uma série, barras horizontais) ---------- */
export type StageRow = { id: string; name: string; count: number; value: number };

export function StageBars({ rows }: { rows: StageRow[] }) {
  const { ref, hover, fromPointer, fromFocus, clear } = useHover<StageRow>();
  const max = Math.max(1, ...rows.map((r) => r.count));
  const total = rows.reduce((sum, r) => sum + r.count, 0);

  return (
    <div ref={ref} className="relative px-2 pb-3" onPointerLeave={clear}>
      <ul className="flex flex-col">
        {rows.map((row) => (
          <li
            key={row.id}
            tabIndex={0}
            aria-label={`${row.name}: ${row.count} leads, ${formatMoney(row.value, "round")}`}
            onPointerMove={(e) => fromPointer(row, e)}
            onFocus={(e) => fromFocus(row, e.currentTarget)}
            onBlur={clear}
            className="grid grid-cols-[minmax(84px,128px)_minmax(0,1fr)_28px_76px] items-center gap-3 rounded-md px-2 py-1.5 outline-none hover:bg-subtle focus-visible:bg-subtle"
          >
            <span className="truncate text-[12.5px] text-ink-2">{row.name}</span>
            <span className="flex h-5 items-center border-l border-line-strong">
              {row.count > 0 ? (
                <span
                  className="block h-5 rounded-r-[4px] bg-accent"
                  style={{ width: `${Math.max(1.5, (row.count / max) * 100)}%` }}
                />
              ) : null}
            </span>
            <span className="text-right text-[12.5px] font-medium text-ink tabular-nums">{row.count}</span>
            <span className="text-right text-xs text-ink-3 tabular-nums">{formatMoney(row.value, "compact")}</span>
          </li>
        ))}
      </ul>
      {hover ? (
        <Tooltip x={hover.x} y={hover.y}>
          <p className="font-medium text-ink">{hover.item.name}</p>
          <p className="mt-1 flex justify-between gap-4 text-ink-2">
            <span>Leads</span>
            <span className="font-medium text-ink tabular-nums">{hover.item.count}</span>
          </p>
          <p className="flex justify-between gap-4 text-ink-2">
            <span>Valor estimado</span>
            <span className="font-medium text-ink tabular-nums">{formatMoney(hover.item.value, "round")}</span>
          </p>
          <p className="flex justify-between gap-4 text-ink-2">
            <span>Do pipeline</span>
            <span className="font-medium text-ink tabular-nums">{formatPercent(total ? hover.item.count / total : 0)}</span>
          </p>
        </Tooltip>
      ) : null}
    </div>
  );
}

/* ---------- Clientes por status (barra segmentada alta) ---------- */
export type StatusPart = { key: string; label: string; color: string; onColor: string; count: number; mrr: number };

export function StatusBar({ parts }: { parts: StatusPart[] }) {
  const { ref, hover, fromPointer, fromFocus, clear } = useHover<StatusPart>();
  const [view, setView] = useState<"chart" | "table">("chart");
  const total = parts.reduce((sum, p) => sum + p.count, 0);
  const visible = parts.filter((p) => p.count > 0);
  const share = (p: StatusPart) => (total ? p.count / total : 0);

  return (
    <div className="px-4 pb-4">
      <div className="mb-3 flex justify-end">
        <div className="inline-flex rounded-md border border-line bg-subtle p-0.5" role="group" aria-label="Visualização">
          {(
            [
              ["chart", "Gráfico", BarChart3],
              ["table", "Tabela", Table2],
            ] as const
          ).map(([key, label, Icon]) => (
            <button
              key={key}
              type="button"
              aria-pressed={view === key}
              onClick={() => setView(key)}
              className={cn(
                "inline-flex h-6 cursor-pointer items-center gap-1 rounded px-1.5 text-[11.5px]",
                view === key ? "bg-panel font-medium text-ink shadow-xs" : "text-ink-3 hover:text-ink",
              )}
            >
              <Icon className="size-3" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {total === 0 ? (
        <p className="py-6 text-center text-[13px] text-ink-3">Nenhum cliente cadastrado ainda.</p>
      ) : view === "chart" ? (
        <>
          <div ref={ref} className="relative" onPointerLeave={clear}>
            <div
              className="flex h-7 w-full gap-0.5"
              role="img"
              aria-label={`Clientes por status: ${visible
                .map((p) => `${p.label} ${p.count} (${formatPercent(share(p))})`)
                .join(", ")}`}
            >
              {visible.map((p) => (
                <div
                  key={p.key}
                  tabIndex={0}
                  aria-label={`${p.label}: ${p.count} clientes, ${formatPercent(share(p))}`}
                  onPointerMove={(e) => fromPointer(p, e)}
                  onFocus={(e) => fromFocus(p, e.currentTarget)}
                  onBlur={clear}
                  className="flex h-full min-w-0 items-center overflow-hidden rounded-[4px] px-2 outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2"
                  style={{ backgroundColor: p.color, flexGrow: p.count, flexBasis: 0 }}
                >
                  {share(p) >= 0.09 ? (
                    <span className="text-[11.5px] font-semibold tabular-nums" style={{ color: p.onColor }}>
                      {formatPercent(share(p))}
                    </span>
                  ) : null}
                </div>
              ))}
            </div>
            {hover ? (
              <Tooltip x={hover.x} y={hover.y}>
                <p className="flex items-center gap-1.5 font-medium text-ink">
                  <span className="size-2 rounded-full" style={{ backgroundColor: hover.item.color }} />
                  {hover.item.label}
                </p>
                <p className="mt-1 flex justify-between gap-4 text-ink-2">
                  <span>Clientes</span>
                  <span className="font-medium text-ink tabular-nums">
                    {hover.item.count} · {formatPercent(share(hover.item))}
                  </span>
                </p>
                <p className="flex justify-between gap-4 text-ink-2">
                  <span>Receita mensal</span>
                  <span className="font-medium text-ink tabular-nums">{formatMoney(hover.item.mrr, "round")}</span>
                </p>
              </Tooltip>
            ) : null}
          </div>
          <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5" aria-label="Legenda">
            {visible.map((p) => (
              <li key={p.key} className="flex items-center gap-1.5 text-xs text-ink-2">
                <span className="size-2 rounded-full" style={{ backgroundColor: p.color }} aria-hidden />
                {p.label}
              </li>
            ))}
          </ul>
        </>
      ) : (
        <table className="w-full text-[12.5px]">
          <thead>
            <tr className="border-b border-line text-left text-xs text-ink-3">
              <th className="py-1.5 font-medium">Status</th>
              <th className="py-1.5 text-right font-medium">Clientes</th>
              <th className="py-1.5 text-right font-medium">Participação</th>
              <th className="py-1.5 text-right font-medium">Receita mensal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {parts.map((p) => (
              <tr key={p.key}>
                <td className="py-1.5">
                  <span className="flex items-center gap-1.5 text-ink">
                    <span className="size-2 rounded-full" style={{ backgroundColor: p.color }} aria-hidden />
                    {p.label}
                  </span>
                </td>
                <td className="py-1.5 text-right text-ink tabular-nums">{formatNumber(p.count)}</td>
                <td className="py-1.5 text-right text-ink-2 tabular-nums">{formatPercent(share(p))}</td>
                <td className="py-1.5 text-right text-ink-2 tabular-nums">{formatMoney(p.mrr, "round")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
