import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { Target } from "lucide-react";
import { getContext } from "@/lib/auth";
import { firstParam, getMembers, getStages, sanitizeSearch, type SearchParams } from "@/lib/queries";
import { sourceLabel, type LeadTemperature } from "@/lib/constants";
import { formatDate, formatMoney, formatNumber } from "@/lib/format";
import { PageHeader } from "@/components/shell/page-header";
import { Avatar, EmptyState, Skeleton } from "@/components/ui/misc";
import { DotGlyph } from "@/components/brand";
import { BantDots, StageBadge, TemperatureLabel } from "@/components/lead-bits";
import { Badge } from "@/components/ui/badge";
import { NewLeadButton, NewLeadButtonFallback } from "./new-lead-button";
import { LeadFilters } from "./filters";

export const metadata: Metadata = { title: "Leads" };

export default function LeadsPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <>
      <PageHeader
        title="Leads"
        icon={<Target />}
        actions={
          <Suspense fallback={<NewLeadButtonFallback />}>
            <NewLeadButton />
          </Suspense>
        }
      />
      <Suspense fallback={<ListSkeleton />}>
        <LeadsContent searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function LeadsContent({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const { supabase, org } = await getContext();
  const q = sanitizeSearch(firstParam(params.q));
  const stage = firstParam(params.stage) ?? "";
  const temperature = firstParam(params.temperature) ?? "";
  const source = firstParam(params.source) ?? "";

  let query = supabase
    .from("leads")
    .select(
      "id, name, company, job_title, email, source, estimated_value, temperature, stage_id, owner_id, created_at, converted_client_id, qual_budget, qual_authority, qual_need, qual_timing",
    )
    .eq("organization_id", org.id)
    .order("created_at", { ascending: false })
    .limit(500);
  if (q) query = query.or(`name.ilike.%${q}%,company.ilike.%${q}%,email.ilike.%${q}%`);
  if (stage) query = query.eq("stage_id", stage);
  if (temperature) query = query.eq("temperature", temperature as LeadTemperature);
  if (source) query = query.eq("source", source);

  const [{ data: leads }, stages, members] = await Promise.all([query, getStages(), getMembers()]);
  const stageById = new Map(stages.map((s) => [s.id, s]));
  const memberById = new Map(members.map((m) => [m.id, m]));
  const rows = leads ?? [];
  const total = rows.reduce((sum, l) => sum + Number(l.estimated_value), 0);
  const filtered = Boolean(q || stage || temperature || source);

  return (
    <>
      <LeadFilters values={{ q, stage, temperature, source }} stages={stages.map((s) => ({ id: s.id, name: s.name }))} />
      {rows.length === 0 ? (
        <EmptyState
          icon={<DotGlyph name="leads" className="size-12" />}
          title={filtered ? "Nenhum lead encontrado" : "Nenhum lead cadastrado"}
          description={
            filtered
              ? "Ajuste os filtros ou a busca para ver mais resultados."
              : "Cadastre seu primeiro lead para começar a qualificar oportunidades no pipeline."
          }
          className="py-20"
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] text-[13px]">
            <thead>
              <tr className="border-b border-line text-left text-xs text-ink-3">
                <th className="py-2.5 pr-3 pl-4 font-medium sm:pl-6">Lead</th>
                <th className="px-3 py-2.5 font-medium">Etapa</th>
                <th className="px-3 py-2.5 font-medium">Qualificação</th>
                <th className="px-3 py-2.5 font-medium">Temperatura</th>
                <th className="px-3 py-2.5 text-right font-medium">Valor estimado</th>
                <th className="px-3 py-2.5 font-medium">Origem</th>
                <th className="px-3 py-2.5 font-medium">Responsável</th>
                <th className="py-2.5 pr-4 pl-3 font-medium sm:pr-6">Criado em</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((lead) => {
                const s = stageById.get(lead.stage_id);
                const owner = lead.owner_id ? memberById.get(lead.owner_id) : null;
                return (
                  <tr key={lead.id} className="group relative hover:bg-subtle">
                    <td className="py-2.5 pr-3 pl-4 sm:pl-6">
                      <Link
                        href={`/leads/${lead.id}`}
                        className="font-medium text-ink after:absolute after:inset-0 group-hover:text-accent"
                      >
                        {lead.name}
                      </Link>
                      <p className="truncate text-xs text-ink-3">
                        {[lead.company, lead.job_title].filter(Boolean).join(" · ") || lead.email || "—"}
                      </p>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="flex items-center gap-1.5">
                        {s ? <StageBadge name={s.name} color={s.color} /> : "—"}
                        {lead.converted_client_id ? <Badge tone="success">Cliente</Badge> : null}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <BantDots lead={lead} />
                    </td>
                    <td className="px-3 py-2.5">
                      <TemperatureLabel value={lead.temperature} />
                    </td>
                    <td className="px-3 py-2.5 text-right font-medium tabular-nums">
                      {Number(lead.estimated_value) > 0 ? formatMoney(lead.estimated_value, "round") : "—"}
                    </td>
                    <td className="px-3 py-2.5 text-ink-2">{sourceLabel(lead.source)}</td>
                    <td className="px-3 py-2.5">
                      {owner ? (
                        <span className="flex items-center gap-1.5 text-ink-2">
                          <Avatar name={owner.name} size="xs" />
                          <span className="truncate">{owner.name.split(" ")[0]}</span>
                        </span>
                      ) : (
                        <span className="text-ink-4">—</span>
                      )}
                    </td>
                    <td className="py-2.5 pr-4 pl-3 text-ink-3 tabular-nums sm:pr-6">{formatDate(lead.created_at)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="border-t border-line px-4 py-3 text-xs text-ink-3 sm:px-6">
            {formatNumber(rows.length)} {rows.length === 1 ? "lead" : "leads"} · {formatMoney(total, "round")} em valor estimado
          </p>
        </div>
      )}
    </>
  );
}

function ListSkeleton() {
  return (
    <div className="flex flex-col">
      <div className="flex gap-2 border-b border-line px-6 py-3">
        <Skeleton className="h-8 w-72" />
        <Skeleton className="h-8 w-44" />
        <Skeleton className="h-8 w-36" />
      </div>
      <div className="flex flex-col gap-3 px-6 py-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-full" />
        ))}
      </div>
    </div>
  );
}
