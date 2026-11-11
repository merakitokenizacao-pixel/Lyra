import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Building2, CalendarDays, FileText, Mail, Phone, SquareKanban, Target } from "lucide-react";
import { getContext } from "@/lib/auth";
import { getMembers, getOwnerOptions, getPipelines } from "@/lib/queries";
import { PROPOSAL_STATUSES, sourceLabel, type ActivityType } from "@/lib/constants";
import { daysSince, formatDate, formatMoney } from "@/lib/format";
import { PageHeader } from "@/components/shell/page-header";
import { Card, CardHeader, DescList, EmptyState, Skeleton, Avatar } from "@/components/ui/misc";
import { Badge, DotBadge } from "@/components/ui/badge";
import { StageBadge, TemperatureLabel } from "@/components/lead-bits";
import { ActivityComposer } from "@/components/activity/composer";
import { Timeline } from "@/components/activity/timeline";
import { StageStepper } from "./stage-stepper";
import { MovePipeline } from "./move-pipeline";
import { Qualification } from "./qualification";
import { LeadHeaderActions } from "./header-actions";

export const metadata: Metadata = { title: "Lead" };

export default function LeadPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<DetailSkeleton />}>
      <LeadDetail params={params} />
    </Suspense>
  );
}

async function LeadDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, org } = await getContext();
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const [{ data: lead }, { data: activities }, { data: proposals }, pipelines, members, ownerOptions] = await Promise.all([
    supabase.from("leads").select("*").eq("id", id).eq("organization_id", org.id).maybeSingle(),
    supabase
      .from("activities")
      .select("id, type, title, body, due_at, completed_at, created_at, author:profiles(full_name)")
      .eq("lead_id", id)
      .eq("organization_id", org.id)
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("proposals")
      .select("id, number, title, status, total_one_time, total_monthly, updated_at")
      .eq("lead_id", id)
      .eq("organization_id", org.id)
      .order("created_at", { ascending: false }),
    getPipelines(),
    getMembers(),
    getOwnerOptions(),
  ]);
  if (!lead) notFound();

  const pipeline = pipelines.find((p) => p.id === lead.pipeline_id);
  const stages = pipeline?.stages ?? [];
  const stage = stages.find((s) => s.id === lead.stage_id);
  const owner = members.find((m) => m.id === lead.owner_id);

  return (
    <>
      <PageHeader
        title={lead.name}
        icon={<Target />}
        breadcrumb={{ label: "Leads", href: "/leads" }}
        actions={
          <LeadHeaderActions
            convertedClientId={lead.converted_client_id}
            members={ownerOptions}
            lead={{
              id: lead.id,
              name: lead.name,
              company: lead.company,
              job_title: lead.job_title,
              email: lead.email,
              phone: lead.phone,
              source: lead.source,
              estimated_value: Number(lead.estimated_value),
              temperature: lead.temperature,
              expected_close_date: lead.expected_close_date,
              notes: lead.notes,
              tags: lead.tags,
              owner_id: lead.owner_id,
            }}
          />
        }
      />

      {/* Cabeçalho do lead */}
      <section className="border-b border-line px-4 py-6 sm:px-6 lg:px-page">
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div className="flex min-w-0 items-start gap-3.5">
            <Avatar name={lead.name} size="lg" />
            <div className="min-w-0">
              <h2 className="text-xl font-semibold tracking-tight text-ink">{lead.name}</h2>
              <p className="mt-0.5 text-[13px] text-ink-3">
                {[lead.job_title, lead.company].filter(Boolean).join(" · ") || "Sem empresa informada"}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                {stage ? <StageBadge name={stage.name} color={stage.color} /> : null}
                <Badge tone="neutral">
                  <TemperatureLabel value={lead.temperature} />
                </Badge>
                {lead.source ? <Badge tone="muted">{sourceLabel(lead.source)}</Badge> : null}
                {lead.converted_client_id ? (
                  <Link href={`/clientes/${lead.converted_client_id}`}>
                    <Badge tone="success">Convertido em cliente</Badge>
                  </Link>
                ) : null}
                {lead.tags.map((tag) => (
                  <Badge key={tag} tone="muted">
                    #{tag}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          <dl className="grid shrink-0 grid-cols-3 divide-x divide-line rounded-xl border border-line">
            <div className="px-4 py-2.5">
              <dt className="text-xs text-ink-3">Valor estimado</dt>
              <dd className="mt-0.5 text-[15px] font-semibold text-ink tabular-nums">
                {formatMoney(lead.estimated_value, "round")}
              </dd>
            </div>
            <div className="px-4 py-2.5">
              <dt className="text-xs text-ink-3">Na etapa há</dt>
              <dd className="mt-0.5 text-[15px] font-semibold text-ink tabular-nums">
                {daysSince(lead.stage_changed_at)} {daysSince(lead.stage_changed_at) === 1 ? "dia" : "dias"}
              </dd>
            </div>
            <div className="px-4 py-2.5">
              <dt className="text-xs text-ink-3">Fechamento</dt>
              <dd className="mt-0.5 text-[15px] font-semibold text-ink tabular-nums">
                {lead.expected_close_date ? formatDate(lead.expected_close_date, "short") : "—"}
              </dd>
            </div>
          </dl>
        </div>
        {stages.length > 0 ? (
          <div className="mt-6">
            {/* Com mais de um pipeline: de qual quadro o lead é, e como levá-lo para outro */}
            {pipeline && pipelines.length > 1 ? (
              <div className="mb-3 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-ink-3">
                <SquareKanban aria-hidden className="size-3.5 text-ink-4" />
                Pipeline
                <Link href={`/pipeline?pipeline=${pipeline.id}`} className="font-medium text-ink-2 hover:text-accent">
                  {pipeline.name}
                </Link>
                <span aria-hidden className="text-ink-4">
                  ·
                </span>
                <MovePipeline
                  leadId={lead.id}
                  currentId={pipeline.id}
                  pipelines={pipelines.map((p) => ({
                    id: p.id,
                    name: p.name,
                    stages: p.stages.map((s) => ({ id: s.id, name: s.name, category: s.category })),
                  }))}
                />
              </div>
            ) : null}
            <StageStepper
              leadId={lead.id}
              stageId={lead.stage_id}
              stages={stages.map((s) => ({ id: s.id, name: s.name, category: s.category }))}
            />
          </div>
        ) : null}
        {stage?.category === "lost" && lead.lost_reason ? (
          <p className="mt-4 rounded-lg border border-red-100 bg-red-50/60 px-3 py-2 text-[13px] text-red-800">
            <strong className="font-medium">Motivo da perda:</strong> {lead.lost_reason}
          </p>
        ) : null}
      </section>

      <div className="grid flex-1 gap-6 px-4 py-6 sm:px-6 lg:px-page lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex min-w-0 flex-col gap-5">
          <ActivityComposer leadId={lead.id} />
          <div>
            <h3 className="mb-4 text-[13.5px] font-semibold text-ink">Linha do tempo</h3>
            <Timeline
              activities={(activities ?? []).map((a) => ({
                ...a,
                type: a.type as ActivityType,
                author: a.author?.full_name ?? null,
              }))}
            />
          </div>
        </div>

        <aside className="flex flex-col gap-4">
          <Card>
            <CardHeader title="Qualificação" description="Marque o que já foi validado com o lead." />
            <Qualification
              leadId={lead.id}
              initial={{
                qual_budget: lead.qual_budget,
                qual_authority: lead.qual_authority,
                qual_need: lead.qual_need,
                qual_timing: lead.qual_timing,
                temperature: lead.temperature,
              }}
            />
          </Card>

          <Card>
            <CardHeader title="Dados do lead" />
            <DescList
              className="border-t border-line"
              items={[
                {
                  label: "E-mail",
                  value: lead.email ? (
                    <a href={`mailto:${lead.email}`} className="inline-flex items-center gap-1.5 hover:text-accent">
                      <Mail className="size-3.5 text-ink-4" />
                      {lead.email}
                    </a>
                  ) : null,
                },
                {
                  label: "Telefone",
                  value: lead.phone ? (
                    <a href={`tel:${lead.phone.replace(/[^\d+]/g, "")}`} className="inline-flex items-center gap-1.5 hover:text-accent">
                      <Phone className="size-3.5 text-ink-4" />
                      {lead.phone}
                    </a>
                  ) : null,
                },
                {
                  label: "Empresa",
                  value: lead.company ? (
                    <span className="inline-flex items-center gap-1.5">
                      <Building2 className="size-3.5 text-ink-4" />
                      {lead.company}
                    </span>
                  ) : null,
                },
                { label: "Origem", value: sourceLabel(lead.source) },
                { label: "Responsável", value: owner?.name ?? null },
                {
                  label: "Criado em",
                  value: (
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarDays className="size-3.5 text-ink-4" />
                      {formatDate(lead.created_at)}
                    </span>
                  ),
                },
              ]}
            />
            {lead.notes ? (
              <div className="border-t border-line px-4 py-3">
                <p className="mb-1 text-xs text-ink-3">Observações</p>
                <p className="text-[13px] leading-relaxed whitespace-pre-wrap text-ink-2">{lead.notes}</p>
              </div>
            ) : null}
          </Card>

          <Card>
            <CardHeader title="Propostas" icon={<FileText />} />
            {(proposals ?? []).length === 0 ? (
              <EmptyState className="py-6" title="Nenhuma proposta" description="Use “Nova proposta” para montar uma oferta." />
            ) : (
              <ul className="divide-y divide-line border-t border-line">
                {(proposals ?? []).map((p) => (
                  <li key={p.id}>
                    <Link href={`/propostas/${p.id}`} className="flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-subtle">
                      <span className="min-w-0">
                        <span className="block truncate text-[13px] font-medium text-ink">
                          #{p.number} · {p.title}
                        </span>
                        <span className="text-xs text-ink-3 tabular-nums">
                          {formatMoney(p.total_one_time, "round")}
                          {Number(p.total_monthly) > 0 ? ` + ${formatMoney(p.total_monthly, "round")}/mês` : ""}
                        </span>
                      </span>
                      <DotBadge dotClassName={PROPOSAL_STATUSES[p.status].dot}>{PROPOSAL_STATUSES[p.status].label}</DotBadge>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </aside>
      </div>
    </>
  );
}

function DetailSkeleton() {
  return (
    <>
      <div className="flex h-14 items-center border-b border-line px-4 sm:px-6 lg:px-page">
        <Skeleton className="h-4 w-48" />
      </div>
      <div className="flex flex-col gap-4 border-b border-line px-4 py-6 sm:px-6 lg:px-page">
        <div className="flex items-center gap-3">
          <Skeleton className="size-11 rounded-full" />
          <div className="flex flex-col gap-2">
            <Skeleton className="h-5 w-56" />
            <Skeleton className="h-3 w-40" />
          </div>
        </div>
        <Skeleton className="h-8 w-full" />
      </div>
      <div className="grid gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[1fr_340px] lg:px-page">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    </>
  );
}
