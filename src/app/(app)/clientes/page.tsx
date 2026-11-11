import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { Building2, Columns3, List } from "lucide-react";
import { getContext } from "@/lib/auth";
import { firstParam, getMembers, sanitizeSearch, type SearchParams } from "@/lib/queries";
import { CLIENT_STATUSES, CLIENT_STATUS_ORDER, type ClientStatus } from "@/lib/constants";
import { formatDate, formatMoney, formatNumber } from "@/lib/format";
import { PageHeader } from "@/components/shell/page-header";
import { LinkTabs, Segmented } from "@/components/ui/tabs";
import { Avatar, EmptyState, Skeleton } from "@/components/ui/misc";
import { ClientStatusBadge } from "@/components/client-bits";
import { DotGlyph } from "@/components/brand";
import { NewClientButton, NewClientButtonFallback } from "./new-client-button";
import { ClientBoard } from "./board";
import { ClientSearch } from "./search";

export const metadata: Metadata = { title: "Clientes" };

export default function ClientsPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <>
      <PageHeader
        title="Clientes"
        icon={<Building2 />}
        actions={
          <Suspense fallback={<NewClientButtonFallback />}>
            <NewClientButton />
          </Suspense>
        }
      />
      <Suspense fallback={<ClientsSkeleton />}>
        <ClientsContent searchParams={searchParams} />
      </Suspense>
    </>
  );
}

function href(params: { view?: string; status?: string; q?: string }) {
  const sp = new URLSearchParams();
  if (params.view && params.view !== "list") sp.set("view", params.view);
  if (params.status && params.status !== "all") sp.set("status", params.status);
  if (params.q) sp.set("q", params.q);
  const qs = sp.toString();
  return qs ? `/clientes?${qs}` : "/clientes";
}

async function ClientsContent({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const view = firstParam(params.view) === "board" ? "board" : "list";
  const statusParam = firstParam(params.status) ?? "all";
  const status = CLIENT_STATUS_ORDER.includes(statusParam as ClientStatus) ? (statusParam as ClientStatus) : "all";
  const q = sanitizeSearch(firstParam(params.q));
  const { supabase, org } = await getContext();

  let query = supabase
    .from("clients")
    .select("id, name, legal_name, industry, city, state, status, monthly_value, customer_since, owner_id, status_changed_at, email")
    .eq("organization_id", org.id)
    .order("name")
    .limit(1000);
  if (q) query = query.or(`name.ilike.%${q}%,legal_name.ilike.%${q}%,email.ilike.%${q}%,industry.ilike.%${q}%`);

  const [{ data }, members] = await Promise.all([query, getMembers()]);
  const all = data ?? [];
  const memberName = new Map(members.map((m) => [m.id, m.name]));
  const counts = Object.fromEntries(CLIENT_STATUS_ORDER.map((s) => [s, all.filter((c) => c.status === s).length]));
  const rows = status === "all" ? all : all.filter((c) => c.status === status);
  const mrr = rows
    .filter((c) => c.status !== "churned")
    .reduce((sum, c) => sum + Number(c.monthly_value), 0);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3 sm:px-6 lg:px-page">
        <ClientSearch defaultValue={q} view={view} status={status} />
        <Segmented
          active={view}
          items={[
            { key: "list", label: (<><List />Lista</>), href: href({ view: "list", status, q }) },
            { key: "board", label: (<><Columns3 />Quadro</>), href: href({ view: "board", q }) },
          ]}
        />
      </div>

      {view === "board" ? (
        <ClientBoard
          clients={all.map((c) => ({
            id: c.id,
            name: c.name,
            industry: c.industry,
            city: c.city,
            state: c.state,
            status: c.status,
            monthly_value: Number(c.monthly_value),
            status_changed_at: c.status_changed_at,
          }))}
        />
      ) : (
        <>
          <LinkTabs
            active={status}
            items={[
              { key: "all", label: "Todos", href: href({ q }), count: all.length },
              ...CLIENT_STATUS_ORDER.map((s) => ({
                key: s,
                label: CLIENT_STATUSES[s].label,
                href: href({ status: s, q }),
                count: counts[s],
                dot: CLIENT_STATUSES[s].color,
              })),
            ]}
          />
          {rows.length === 0 ? (
            <EmptyState
              icon={<DotGlyph name="clients" className="size-12" />}
              title={all.length === 0 ? "Nenhum cliente ainda" : "Nenhum cliente neste filtro"}
              description={
                all.length === 0
                  ? "Converta um lead ganho em cliente ou cadastre um cliente diretamente."
                  : "Escolha outro status ou limpe a busca."
              }
              className="py-20"
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-[13px] lg:page-table">
                <thead>
                  <tr className="border-b border-line text-left text-xs text-ink-3">
                    <th className="py-2.5 pr-3 pl-4 font-medium sm:pl-6">Cliente</th>
                    <th className="px-3 py-2.5 font-medium">Status</th>
                    <th className="px-3 py-2.5 font-medium">Segmento</th>
                    <th className="px-3 py-2.5 font-medium">Cidade</th>
                    <th className="px-3 py-2.5 text-right font-medium">Receita mensal</th>
                    <th className="px-3 py-2.5 font-medium">Responsável</th>
                    <th className="py-2.5 pr-4 pl-3 font-medium sm:pr-6">Cliente desde</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {rows.map((c) => {
                    const owner = c.owner_id ? memberName.get(c.owner_id) : null;
                    return (
                      <tr key={c.id} className="group relative hover:bg-subtle">
                        <td className="py-2.5 pr-3 pl-4 sm:pl-6">
                          <span className="flex items-center gap-2.5">
                            <Avatar name={c.name} size="sm" />
                            <span className="min-w-0">
                              <Link
                                href={`/clientes/${c.id}`}
                                className="font-medium text-ink after:absolute after:inset-0 group-hover:text-accent"
                              >
                                {c.name}
                              </Link>
                              <span className="block truncate text-xs text-ink-3">{c.legal_name ?? c.email ?? "—"}</span>
                            </span>
                          </span>
                        </td>
                        <td className="px-3 py-2.5">
                          <ClientStatusBadge status={c.status} />
                        </td>
                        <td className="px-3 py-2.5 text-ink-2">{c.industry ?? "—"}</td>
                        <td className="px-3 py-2.5 text-ink-2">
                          {c.city ? `${c.city}${c.state ? `/${c.state}` : ""}` : "—"}
                        </td>
                        <td className="px-3 py-2.5 text-right font-medium tabular-nums">
                          {Number(c.monthly_value) > 0 ? formatMoney(c.monthly_value, "round") : "—"}
                        </td>
                        <td className="px-3 py-2.5 text-ink-2">{owner ? owner.split(" ")[0] : "—"}</td>
                        <td className="py-2.5 pr-4 pl-3 text-ink-3 tabular-nums sm:pr-6">
                          {c.customer_since ? formatDate(c.customer_since) : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <p className="border-t border-line px-4 py-3 text-xs text-ink-3 sm:px-6 lg:px-page">
                {formatNumber(rows.length)} {rows.length === 1 ? "cliente" : "clientes"} · {formatMoney(mrr, "round")}/mês em
                receita recorrente
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ClientsSkeleton() {
  return (
    <div className="flex flex-col gap-3 px-4 py-4 sm:px-6 lg:px-page">
      <Skeleton className="h-8 w-72" />
      {Array.from({ length: 7 }).map((_, i) => (
        <Skeleton key={i} className="h-10 w-full" />
      ))}
    </div>
  );
}
