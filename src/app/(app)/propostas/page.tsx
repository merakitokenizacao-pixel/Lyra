import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { FileText, Plus } from "lucide-react";
import { getContext } from "@/lib/auth";
import { firstParam, type SearchParams } from "@/lib/queries";
import { PROPOSAL_STATUSES, PROPOSAL_STATUS_ORDER, type ProposalStatus } from "@/lib/constants";
import { formatDate, formatMoney, formatRelative, isPastDate } from "@/lib/format";
import { PageHeader } from "@/components/shell/page-header";
import { LinkTabs } from "@/components/ui/tabs";
import { DotBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState, Skeleton } from "@/components/ui/misc";
import { DotGlyph } from "@/components/brand";
import { NewProposalDialog } from "./new-proposal-dialog";

export const metadata: Metadata = { title: "Propostas" };

export default function ProposalsPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <>
      <PageHeader
        title="Propostas"
        icon={<FileText />}
        actions={
          <Suspense
            fallback={
              <Button variant="primary" disabled>
                <Plus />
                Nova proposta
              </Button>
            }
          >
            <NewProposalButton />
          </Suspense>
        }
      />
      <Suspense fallback={<ListSkeleton />}>
        <ProposalsContent searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function NewProposalButton() {
  const { supabase, org } = await getContext();
  const [{ data: clients }, { data: leads }, { data: openStages }] = await Promise.all([
    supabase.from("clients").select("id, name").eq("organization_id", org.id).neq("status", "churned").order("name").limit(500),
    supabase.from("leads").select("id, name, company, stage_id").eq("organization_id", org.id).is("converted_client_id", null).order("created_at", { ascending: false }).limit(500),
    supabase.from("pipeline_stages").select("id").eq("organization_id", org.id).eq("category", "open"),
  ]);
  const open = new Set((openStages ?? []).map((s) => s.id));
  return (
    <NewProposalDialog
      clients={clients ?? []}
      leads={(leads ?? []).filter((l) => open.has(l.stage_id)).map((l) => ({ id: l.id, name: l.name, company: l.company }))}
    />
  );
}

async function ProposalsContent({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const statusParam = firstParam(params.status) ?? "all";
  const status = PROPOSAL_STATUS_ORDER.includes(statusParam as ProposalStatus) ? (statusParam as ProposalStatus) : "all";
  const { supabase, org } = await getContext();

  const { data } = await supabase
    .from("proposals")
    .select(
      "id, number, title, status, total_one_time, total_monthly, valid_until, updated_at, viewed_at, client:clients(id, name), lead:leads(id, name, company)",
    )
    .eq("organization_id", org.id)
    .order("number", { ascending: false })
    .limit(500);
  const all = data ?? [];
  const rows = status === "all" ? all : all.filter((p) => p.status === status);

  return (
    <>
      <LinkTabs
        active={status}
        items={[
          { key: "all", label: "Todas", href: "/propostas", count: all.length },
          ...PROPOSAL_STATUS_ORDER.map((s) => ({
            key: s,
            label: PROPOSAL_STATUSES[s].label,
            href: `/propostas?status=${s}`,
            count: all.filter((p) => p.status === s).length,
          })),
        ]}
      />
      {rows.length === 0 ? (
        <EmptyState
          icon={<DotGlyph name="proposals" className="size-12" />}
          title={all.length === 0 ? "Nenhuma proposta ainda" : "Nenhuma proposta neste status"}
          description={
            all.length === 0
              ? "Monte propostas personalizadas com itens do seu catálogo e envie um link para o cliente aceitar online."
              : "Escolha outra aba para ver mais propostas."
          }
          className="py-20"
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-[13px] lg:page-table">
            <thead>
              <tr className="border-b border-line text-left text-xs text-ink-3">
                <th className="w-16 py-2.5 pr-3 pl-4 font-medium sm:pl-6">Nº</th>
                <th className="px-3 py-2.5 font-medium">Proposta</th>
                <th className="px-3 py-2.5 font-medium">Status</th>
                <th className="px-3 py-2.5 text-right font-medium">Único</th>
                <th className="px-3 py-2.5 text-right font-medium">Mensal</th>
                <th className="px-3 py-2.5 font-medium">Validade</th>
                <th className="py-2.5 pr-4 pl-3 font-medium sm:pr-6">Atualizada</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((p) => {
                const recipient = p.client?.name ?? p.lead?.company ?? p.lead?.name ?? "Sem destinatário";
                const expired = p.valid_until && isPastDate(p.valid_until) && ["sent", "viewed"].includes(p.status);
                return (
                  <tr key={p.id} className="group relative hover:bg-subtle">
                    <td className="py-2.5 pr-3 pl-4 font-mono text-xs text-ink-3 sm:pl-6">#{p.number}</td>
                    <td className="px-3 py-2.5">
                      <Link href={`/propostas/${p.id}`} className="font-medium text-ink after:absolute after:inset-0 group-hover:text-accent">
                        {p.title}
                      </Link>
                      <p className="truncate text-xs text-ink-3">{recipient}</p>
                    </td>
                    <td className="px-3 py-2.5">
                      <DotBadge dotClassName={PROPOSAL_STATUSES[p.status].dot}>{PROPOSAL_STATUSES[p.status].label}</DotBadge>
                    </td>
                    <td className="px-3 py-2.5 text-right font-medium tabular-nums">
                      {Number(p.total_one_time) > 0 ? formatMoney(p.total_one_time, "round") : "—"}
                    </td>
                    <td className="px-3 py-2.5 text-right font-medium tabular-nums">
                      {Number(p.total_monthly) > 0 ? `${formatMoney(p.total_monthly, "round")}` : "—"}
                    </td>
                    <td className={`px-3 py-2.5 tabular-nums ${expired ? "font-medium text-danger" : "text-ink-2"}`}>
                      {p.valid_until ? formatDate(p.valid_until) : "—"}
                      {expired ? " · vencida" : ""}
                    </td>
                    <td className="py-2.5 pr-4 pl-3 text-ink-3 sm:pr-6">{formatRelative(p.updated_at)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

function ListSkeleton() {
  return (
    <div className="flex flex-col gap-3 px-4 py-4 sm:px-6 lg:px-page">
      <Skeleton className="h-8 w-96 max-w-full" />
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-10 w-full" />
      ))}
    </div>
  );
}
