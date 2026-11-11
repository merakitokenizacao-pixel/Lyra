"use client";

import { useOptimistic, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { CLIENT_STATUSES, CLIENT_STATUS_ORDER, type ClientStatus } from "@/lib/constants";
import { formatMoney } from "@/lib/format";
import { Kanban } from "@/components/kanban";
import { Avatar } from "@/components/ui/misc";
import { setClientStatus } from "./actions";

export type BoardClient = {
  id: string;
  name: string;
  industry: string | null;
  city: string | null;
  state: string | null;
  status: ClientStatus;
  monthly_value: number;
  status_changed_at: string;
};

export function ClientBoard({ clients }: { clients: BoardClient[] }) {
  const [, startTransition] = useTransition();
  const [optimistic, applyMove] = useOptimistic(clients, (state, move: { id: string; status: ClientStatus }) =>
    state.map((c) => (c.id === move.id ? { ...c, status: move.status, status_changed_at: new Date().toISOString() } : c)),
  );
  const sorted = [...optimistic].sort((a, b) => b.status_changed_at.localeCompare(a.status_changed_at));

  const columns = CLIENT_STATUS_ORDER.map((status) => {
    const meta = CLIENT_STATUSES[status];
    const items = sorted.filter((c) => c.status === status);
    const mrr = items.reduce((sum, c) => sum + c.monthly_value, 0);
    return {
      id: status,
      header: (
        <div>
          <div className="flex items-center justify-between gap-2">
            <h3 className="flex items-center gap-2 text-[13px] font-semibold text-ink">
              <span className="size-2 rounded-full" style={{ backgroundColor: meta.color }} aria-hidden />
              {meta.label}
            </h3>
            <span className="rounded-md bg-panel px-1.5 py-px font-mono text-[11px] text-ink-3 tabular-nums shadow-xs">
              {items.length}
            </span>
          </div>
          <p className="mt-1 pl-4 text-xs text-ink-3 tabular-nums">{formatMoney(mrr, "compact")}/mês</p>
        </div>
      ),
    };
  });

  return (
    <Kanban
      columns={columns}
      items={sorted}
      getColumnId={(c) => c.status}
      className="lg:px-page"
      emptyText="Nenhum cliente neste status"
      onMove={(client, to) => {
        const next = to as ClientStatus;
        startTransition(async () => {
          applyMove({ id: client.id, status: next });
          const result = await setClientStatus(client.id, next);
          if (!result.ok) toast.error(result.error);
          else toast(`${client.name}: ${CLIENT_STATUSES[next].label}`);
        });
      }}
      renderCard={(client) => (
        <Link
          href={`/clientes/${client.id}`}
          draggable={false}
          className="block rounded-lg border border-line bg-panel p-3 shadow-card transition-[border-color,box-shadow] hover:border-line-strong hover:shadow-pop"
        >
          <div className="flex items-start gap-2.5">
            <Avatar name={client.name} size="sm" />
            <div className="min-w-0">
              <p className="truncate text-[13px] font-medium text-ink">{client.name}</p>
              <p className="truncate text-xs text-ink-3">
                {[client.industry, client.city && client.state ? `${client.city}/${client.state}` : client.city]
                  .filter(Boolean)
                  .join(" · ") || "—"}
              </p>
            </div>
          </div>
          <p className="mt-3 text-[13px] font-semibold text-ink tabular-nums">
            {client.monthly_value > 0 ? `${formatMoney(client.monthly_value, "round")}/mês` : "Sem recorrência"}
          </p>
        </Link>
      )}
    />
  );
}
