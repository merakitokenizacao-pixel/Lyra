import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { ArrowDownRight, ArrowRight, ArrowUpRight, CheckSquare, FileText, House, Sparkles } from "lucide-react";
import { getContext } from "@/lib/auth";
import { getPipelines } from "@/lib/queries";
import {
  CLIENT_STATUSES,
  CLIENT_STATUS_ORDER,
  PROPOSAL_STATUSES,
  type ActivityType,
} from "@/lib/constants";
import { callName, formatDate, formatDateTime, formatMoney, formatNumber, formatPercent, greeting, isOverdue, isoDaysAgo } from "@/lib/format";
import { cn } from "@/lib/utils";
import { PageHeader, DisplayTitle } from "@/components/shell/page-header";
import { Card, CardHeader, EmptyState, Skeleton } from "@/components/ui/misc";
import { Chip, DotBadge } from "@/components/ui/badge";
import { DotGlyph } from "@/components/brand";
import { Timeline } from "@/components/activity/timeline";
import { TaskCheck } from "@/components/activity/task-check";
import { NewLeadButton, NewLeadButtonFallback } from "./leads/new-lead-button";
import { StageBars, StatusBar } from "./dashboard-charts";
import { NameNudge } from "./name-nudge";

export const metadata: Metadata = { title: "Início" };

export default function DashboardPage() {
  return (
    <>
      <PageHeader
        title="Início"
        icon={<House />}
        actions={
          <Suspense fallback={<NewLeadButtonFallback />}>
            <NewLeadButton />
          </Suspense>
        }
      />
      <Suspense fallback={<DashboardSkeleton />}>
        <Dashboard />
      </Suspense>
    </>
  );
}

async function Dashboard() {
  const ctx = await getContext();
  const { supabase, org } = ctx;
  const since30 = isoDaysAgo(30);
  const since60 = isoDaysAgo(60);

  const [pipelines, { data: leads }, { data: clients }, { data: proposals }, { data: tasks }, { data: recent }] =
    await Promise.all([
      getPipelines(),
      supabase.from("leads").select("id, stage_id, pipeline_id, estimated_value, created_at").eq("organization_id", org.id).limit(5000),
      supabase.from("clients").select("id, status, monthly_value").eq("organization_id", org.id).limit(5000),
      supabase
        .from("proposals")
        .select("id, number, title, status, total_one_time, total_monthly, updated_at, responded_at, client:clients(name), lead:leads(name, company)")
        .eq("organization_id", org.id)
        .order("updated_at", { ascending: false })
        .limit(300),
      supabase
        .from("activities")
        .select("id, title, due_at, completed_at, lead:leads(id, name), client:clients(id, name)")
        .eq("organization_id", org.id)
        .eq("type", "task")
        .is("completed_at", null)
        .order("due_at", { ascending: true, nullsFirst: false })
        .limit(6),
      supabase
        .from("activities")
        .select("id, type, title, body, due_at, completed_at, created_at, author:profiles(full_name), lead:leads(id, name), client:clients(id, name)")
        .eq("organization_id", org.id)
        .order("created_at", { ascending: false })
        .limit(8),
    ]);

  const allLeads = leads ?? [];
  const stages = pipelines.flatMap((p) => p.stages);
  const category = new Map(stages.map((s) => [s.id, s.category]));
  const openLeads = allLeads.filter((l) => category.get(l.stage_id) === "open");
  const openValue = openLeads.reduce((sum, l) => sum + Number(l.estimated_value), 0);
  const won = allLeads.filter((l) => category.get(l.stage_id) === "won").length;
  const lost = allLeads.filter((l) => category.get(l.stage_id) === "lost").length;
  const conversion = won + lost > 0 ? won / (won + lost) : 0;
  const new30 = allLeads.filter((l) => l.created_at >= since30).length;
  const prev30 = allLeads.filter((l) => l.created_at >= since60 && l.created_at < since30).length;
  const delta = new30 - prev30;

  const allClients = clients ?? [];
  const recurring = allClients.filter((c) => c.status !== "churned" && c.status !== "paused");
  const mrr = recurring.reduce((sum, c) => sum + Number(c.monthly_value), 0);

  const defaultPipeline = pipelines.find((p) => p.is_default) ?? pipelines[0];
  const stageRows = (defaultPipeline?.stages ?? [])
    .filter((s) => s.category === "open")
    .map((s) => {
      const items = allLeads.filter((l) => l.stage_id === s.id);
      return { id: s.id, name: s.name, count: items.length, value: items.reduce((sum, l) => sum + Number(l.estimated_value), 0) };
    });

  const statusParts = CLIENT_STATUS_ORDER.map((s) => {
    const items = allClients.filter((c) => c.status === s);
    return {
      key: s,
      label: CLIENT_STATUSES[s].label,
      color: CLIENT_STATUSES[s].color,
      onColor: CLIENT_STATUSES[s].onColor,
      count: items.length,
      mrr: items.reduce((sum, c) => sum + Number(c.monthly_value), 0),
    };
  });

  const allProposals = proposals ?? [];
  const negotiating = allProposals.filter((p) => p.status === "sent" || p.status === "viewed");
  const negotiatingValue = negotiating.reduce((sum, p) => sum + Number(p.total_one_time) + Number(p.total_monthly) * 12, 0);
  const accepted30 = allProposals.filter((p) => p.status === "accepted" && (p.responded_at ?? p.updated_at) >= since30);
  const drafts = allProposals.filter((p) => p.status === "draft").length;

  // Cada indicador: nome, número e um detalhe curto. O texto completo fica no title.
  const kpis: { label: string; value: string; suffix?: string; meta: string; hint: string; tone?: "up" | "down" }[] = [
    {
      label: "Pipeline em aberto",
      value: formatMoney(openValue, "compact"),
      meta: `${formatNumber(openLeads.length)} ${openLeads.length === 1 ? "lead" : "leads"}`,
      hint: `${formatNumber(openLeads.length)} ${openLeads.length === 1 ? "lead em aberto" : "leads em aberto"}, somando o valor estimado`,
    },
    {
      label: "Novos leads · 30 dias",
      value: formatNumber(new30),
      meta: delta === 0 ? "estável" : `${delta > 0 ? "+" : "−"}${Math.abs(delta)}`,
      hint:
        delta === 0
          ? "Igual aos 30 dias anteriores"
          : `${delta > 0 ? "+" : "−"}${Math.abs(delta)} em relação aos 30 dias anteriores (${formatNumber(prev30)})`,
      tone: delta > 0 ? "up" : delta < 0 ? "down" : undefined,
    },
    {
      label: "Taxa de conversão",
      value: won + lost > 0 ? formatPercent(conversion) : "—",
      meta: won + lost > 0 ? `${won} de ${won + lost}` : "sem dados",
      hint: won + lost > 0 ? `${won} ganhos de ${won + lost} leads decididos` : "Nenhum lead ganho ou perdido ainda",
    },
    {
      label: "Receita recorrente",
      value: formatMoney(mrr, "compact"),
      suffix: "/mês",
      meta: `${formatNumber(recurring.length)} ${recurring.length === 1 ? "cliente" : "clientes"}`,
      hint: `${formatNumber(recurring.length)} ${recurring.length === 1 ? "cliente ativo" : "clientes ativos"}, somando as mensalidades`,
    },
  ];

  const today = formatDate(new Date(), "long");
  // Nome preferido ou primeiro nome; null enquanto o nome for só o começo do e-mail
  const name = callName(ctx.profile);

  return (
    <div className="flex flex-col gap-6 px-4 py-7 sm:px-6 lg:py-8">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        {name ? (
          <DisplayTitle lead={`${greeting()}, ${name}.`} muted="Este é o pulso da sua operação hoje." />
        ) : (
          <div className="flex min-w-0 flex-col gap-5">
            <DisplayTitle lead={`${greeting()}!`} muted="Como podemos te chamar?" />
            <NameNudge />
          </div>
        )}
        <Chip className="w-fit">
          <Sparkles />
          {today}
        </Chip>
      </section>

      {/* Indicadores em faixa compacta */}
      <Card className="grid grid-cols-2 overflow-hidden xl:grid-cols-4">
        {kpis.map((kpi, index) => {
          const TrendIcon = kpi.tone === "up" ? ArrowUpRight : kpi.tone === "down" ? ArrowDownRight : null;
          return (
            // Celular: nome, número e detalhe empilhados (lado a lado não cabe em meia tela).
            // A partir de sm: nome e detalhe na mesma linha, número embaixo.
            <div
              key={kpi.label}
              title={kpi.hint}
              className={cn(
                "grid min-w-0 grid-cols-[minmax(0,1fr)_auto] content-start items-center gap-x-2 gap-y-1 border-line px-4 py-3",
                index % 2 === 0 && "border-r",
                index < 2 && "border-b xl:border-b-0",
                index === 1 && "xl:border-r",
                index === 2 && "xl:border-r",
              )}
            >
              <span className="col-span-2 truncate text-xs text-ink-3 sm:col-span-1">{kpi.label}</span>
              <span
                className={cn(
                  "order-last col-span-2 inline-flex items-center gap-0.5 text-[11.5px] tabular-nums sm:order-none sm:col-span-1 sm:justify-self-end",
                  kpi.tone === "up" ? "font-medium text-success" : kpi.tone === "down" ? "font-medium text-danger" : "text-ink-4",
                )}
              >
                {TrendIcon ? <TrendIcon className="size-3" aria-hidden /> : null}
                {kpi.meta}
                <span className="sr-only">. {kpi.hint}</span>
              </span>
              <p className="col-span-2 text-xl leading-7 font-semibold tracking-tight text-ink tabular-nums">
                {kpi.value}
                {kpi.suffix ? <span className="ml-1 text-xs font-normal tracking-normal text-ink-3">{kpi.suffix}</span> : null}
              </p>
            </div>
          );
        })}
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader
            title="Leads por etapa"
            description={defaultPipeline ? `Oportunidades em aberto · ${defaultPipeline.name}` : undefined}
            action={
              <Link href="/pipeline" className="inline-flex items-center gap-1 text-xs font-medium text-ink-3 hover:text-accent">
                Abrir pipeline
                <ArrowRight className="size-3" />
              </Link>
            }
          />
          {stageRows.length > 0 && stageRows.some((r) => r.count > 0) ? (
            <StageBars rows={stageRows} />
          ) : (
            <EmptyState
              icon={<DotGlyph name="pipeline" className="size-10" />}
              title="Pipeline vazio"
              description="Cadastre leads para acompanhar a qualificação etapa por etapa."
              className="py-8"
            />
          )}
        </Card>

        <Card>
          <CardHeader
            title="Clientes por status"
            description="Saúde da carteira hoje"
            action={
              <Link href="/clientes?view=board" className="inline-flex items-center gap-1 text-xs font-medium text-ink-3 hover:text-accent">
                Ver quadro
                <ArrowRight className="size-3" />
              </Link>
            }
          />
          <StatusBar parts={statusParts} />
        </Card>
      </div>

      {/* grid-cols-1 (minmax(0,1fr)) evita que textos longos alarguem a página no celular */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Próximas tarefas" icon={<CheckSquare />} description="Tarefas abertas por prazo" />
          {(tasks ?? []).length === 0 ? (
            <EmptyState
              icon={<DotGlyph name="tasks" tone="muted" className="size-9" />}
              title="Nada pendente"
              description="Crie tarefas na linha do tempo de leads e clientes."
              className="py-8"
            />
          ) : (
            <ul className="divide-y divide-line border-t border-line">
              {(tasks ?? []).map((task) => {
                const overdue = isOverdue(task.due_at);
                const subject = task.lead
                  ? { label: task.lead.name, href: `/leads/${task.lead.id}` }
                  : task.client
                    ? { label: task.client.name, href: `/clientes/${task.client.id}` }
                    : null;
                return (
                  <li key={task.id} className="flex items-start gap-3 px-4 py-2.5">
                    <span className="pt-0.5">
                      <TaskCheck id={task.id} done={false} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium text-ink">{task.title ?? "Tarefa"}</p>
                      <p className="text-xs text-ink-3">
                        {subject ? (
                          <Link href={subject.href} className="hover:text-accent">
                            {subject.label}
                          </Link>
                        ) : null}
                      </p>
                    </div>
                    <span className={cn("shrink-0 text-xs tabular-nums", overdue ? "font-medium text-danger" : "text-ink-3")}>
                      {task.due_at ? (overdue ? `Atrasada · ${formatDateTime(task.due_at)}` : formatDateTime(task.due_at)) : "Sem prazo"}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader
            title="Propostas"
            icon={<FileText />}
            action={
              <Link href="/propostas" className="inline-flex items-center gap-1 text-xs font-medium text-ink-3 hover:text-accent">
                Ver todas
                <ArrowRight className="size-3" />
              </Link>
            }
          />
          <dl className="grid grid-cols-3 divide-x divide-line border-y border-line">
            <div className="px-4 py-3">
              <dt className="text-xs text-ink-3">Em negociação</dt>
              <dd className="mt-0.5 text-[17px] font-semibold text-ink">{negotiating.length}</dd>
              <dd className="text-xs text-ink-3">{formatMoney(negotiatingValue, "compact")} em 12 meses</dd>
            </div>
            <div className="px-4 py-3">
              <dt className="text-xs text-ink-3">Aceitas em 30 dias</dt>
              <dd className="mt-0.5 text-[17px] font-semibold text-ink">{accepted30.length}</dd>
              <dd className="text-xs text-ink-3">
                {formatMoney(accepted30.reduce((s, p) => s + Number(p.total_one_time), 0), "compact")} em projetos
              </dd>
            </div>
            <div className="px-4 py-3">
              <dt className="text-xs text-ink-3">Rascunhos</dt>
              <dd className="mt-0.5 text-[17px] font-semibold text-ink">{drafts}</dd>
              <dd className="text-xs text-ink-3">aguardando envio</dd>
            </div>
          </dl>
          {allProposals.length === 0 ? (
            <EmptyState className="py-6" title="Nenhuma proposta" description="Crie propostas a partir de um lead ou cliente." />
          ) : (
            <ul className="divide-y divide-line">
              {allProposals.slice(0, 4).map((p) => (
                <li key={p.id}>
                  <Link href={`/propostas/${p.id}`} className="group flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-subtle">
                    <span className="min-w-0">
                      <span className="block truncate text-[13px] font-medium text-ink group-hover:text-accent">
                        #{p.number} · {p.title}
                      </span>
                      <span className="block truncate text-xs text-ink-3">
                        {p.client?.name ?? p.lead?.company ?? p.lead?.name ?? "Sem destinatário"}
                      </span>
                    </span>
                    <span className="flex shrink-0 items-center gap-2">
                      <span className="hidden text-xs font-medium text-ink tabular-nums sm:inline">
                        {formatMoney(p.total_one_time, "compact")}
                      </span>
                      <DotBadge dotClassName={PROPOSAL_STATUSES[p.status].dot}>{PROPOSAL_STATUSES[p.status].label}</DotBadge>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card>
        <CardHeader title="Atividade recente" description="O que aconteceu na sua operação" />
        <div className="border-t border-line px-4 pt-4">
          <Timeline
            compact
            emptyText="As interações com leads e clientes aparecem aqui."
            activities={(recent ?? []).map((a) => ({
              ...a,
              type: a.type as ActivityType,
              author: a.author?.full_name ?? null,
              subject: a.client
                ? { label: a.client.name, href: `/clientes/${a.client.id}` }
                : a.lead
                  ? { label: a.lead.name, href: `/leads/${a.lead.id}` }
                  : null,
            }))}
          />
        </div>
      </Card>

      <p className="flex items-center justify-center gap-1.5 pb-2 text-xs text-ink-4">
        Dica: arraste os cards no
        <Link href="/pipeline" className="inline-flex items-center gap-0.5 font-medium text-ink-3 hover:text-accent">
          pipeline <ArrowUpRight className="size-3" />
        </Link>
        para atualizar etapas em segundos.
      </p>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6 px-6 py-8">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-9 w-72" />
        <Skeleton className="h-9 w-96 max-w-full" />
      </div>
      <Skeleton className="h-[74px] w-full rounded-xl" />
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    </div>
  );
}
