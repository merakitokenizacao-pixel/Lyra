import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Building2, ExternalLink, FileText, Globe, Mail, MapPin, Phone } from "lucide-react";
import { getContext } from "@/lib/auth";
import { getMembers, getOwnerOptions } from "@/lib/queries";
import { CLIENT_STATUSES, PROPOSAL_STATUSES, type ActivityType } from "@/lib/constants";
import { daysAgoLabel, formatDate, formatMoney, formatRelative } from "@/lib/format";
import { PageHeader } from "@/components/shell/page-header";
import { Avatar, Card, CardHeader, DescList, EmptyState, Skeleton } from "@/components/ui/misc";
import { Badge, DotBadge } from "@/components/ui/badge";
import { ActivityComposer } from "@/components/activity/composer";
import { Timeline } from "@/components/activity/timeline";
import { ClientStatusSelect } from "./status-select";
import { ContactsCard } from "./contacts";
import { ClientHeaderActions } from "./header-actions";

export const metadata: Metadata = { title: "Cliente" };

export default function ClientPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<DetailSkeleton />}>
      <ClientDetail params={params} />
    </Suspense>
  );
}

async function ClientDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, org } = await getContext();
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const { data: client } = await supabase.from("clients").select("*").eq("id", id).eq("organization_id", org.id).maybeSingle();
  if (!client) notFound();

  // A linha do tempo inclui o histórico do lead de origem
  const subjectFilter = client.lead_id ? `client_id.eq.${client.id},lead_id.eq.${client.lead_id}` : `client_id.eq.${client.id}`;
  const [{ data: activities }, { data: contacts }, { data: proposals }, members, ownerOptions] = await Promise.all([
    supabase
      .from("activities")
      .select("id, type, title, body, due_at, completed_at, created_at, lead_id, client_id, author:profiles(full_name)")
      .eq("organization_id", org.id)
      .or(subjectFilter)
      .order("created_at", { ascending: false })
      .limit(150),
    supabase
      .from("contacts")
      .select("id, name, job_title, email, phone, is_primary")
      .eq("client_id", client.id)
      .eq("organization_id", org.id)
      .order("is_primary", { ascending: false })
      .order("name"),
    supabase
      .from("proposals")
      .select("id, number, title, status, total_one_time, total_monthly, updated_at")
      .eq("client_id", client.id)
      .eq("organization_id", org.id)
      .order("created_at", { ascending: false }),
    getMembers(),
    getOwnerOptions(),
  ]);

  const owner = members.find((m) => m.id === client.owner_id);
  const accepted = (proposals ?? []).filter((p) => p.status === "accepted");
  const acceptedOneTime = accepted.reduce((sum, p) => sum + Number(p.total_one_time), 0);
  const lastTouch = (activities ?? []).find((a) => ["note", "call", "email", "meeting", "whatsapp"].includes(a.type));
  const statusMeta = CLIENT_STATUSES[client.status];

  return (
    <>
      <PageHeader
        title={client.name}
        icon={<Building2 />}
        breadcrumb={{ label: "Clientes", href: "/clientes" }}
        actions={
          <ClientHeaderActions
            members={ownerOptions}
            client={{
              id: client.id,
              name: client.name,
              legal_name: client.legal_name,
              kind: client.kind,
              document: client.document,
              email: client.email,
              phone: client.phone,
              website: client.website,
              industry: client.industry,
              city: client.city,
              state: client.state,
              monthly_value: Number(client.monthly_value),
              customer_since: client.customer_since,
              notes: client.notes,
              tags: client.tags,
              owner_id: client.owner_id,
              status: client.status,
            }}
          />
        }
      />

      <section className="border-b border-line px-4 py-6 sm:px-6 lg:px-page">
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div className="flex min-w-0 items-start gap-3.5">
            <Avatar name={client.name} size="lg" />
            <div className="min-w-0">
              <h2 className="text-xl font-semibold tracking-tight text-ink">{client.name}</h2>
              <p className="mt-0.5 text-[13px] text-ink-3">
                {[client.legal_name, client.industry].filter(Boolean).join(" · ") ||
                  (client.kind === "person" ? "Pessoa física" : "Empresa")}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                <ClientStatusSelect clientId={client.id} status={client.status} />
                <span className="text-xs text-ink-3">
                  {statusMeta.label} {formatRelative(client.status_changed_at)}
                </span>
                {client.tags.map((tag) => (
                  <Badge key={tag} tone="muted">
                    #{tag}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          <dl className="grid shrink-0 grid-cols-3 divide-x divide-line rounded-xl border border-line">
            <div className="px-4 py-2.5">
              <dt className="text-xs text-ink-3">Receita mensal</dt>
              <dd className="mt-0.5 text-[15px] font-semibold text-ink tabular-nums">
                {formatMoney(client.monthly_value, "round")}
              </dd>
            </div>
            <div className="px-4 py-2.5">
              <dt className="text-xs text-ink-3">Projetos aceitos</dt>
              <dd className="mt-0.5 text-[15px] font-semibold text-ink tabular-nums">{formatMoney(acceptedOneTime, "round")}</dd>
            </div>
            <div className="px-4 py-2.5">
              <dt className="text-xs text-ink-3">Último contato</dt>
              <dd className="mt-0.5 text-[15px] font-semibold text-ink tabular-nums">
                {lastTouch ? daysAgoLabel(lastTouch.created_at) : "—"}
              </dd>
            </div>
          </dl>
        </div>
      </section>

      <div className="grid flex-1 gap-6 px-4 py-6 sm:px-6 lg:px-page lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex min-w-0 flex-col gap-5">
          <ActivityComposer clientId={client.id} />
          <div>
            <h3 className="mb-4 text-[13.5px] font-semibold text-ink">Linha do tempo</h3>
            <Timeline
              activities={(activities ?? []).map((a) => ({
                ...a,
                type: a.type as ActivityType,
                author: a.author?.full_name ?? null,
                subject:
                  a.lead_id && !a.client_id && client.lead_id
                    ? { label: "Histórico do lead", href: `/leads/${client.lead_id}` }
                    : null,
              }))}
            />
          </div>
        </div>

        <aside className="flex flex-col gap-4">
          <ContactsCard clientId={client.id} contacts={contacts ?? []} />

          <Card>
            <CardHeader title="Dados do cliente" />
            <DescList
              className="border-t border-line"
              items={[
                { label: client.kind === "person" ? "CPF" : "CNPJ", value: client.document },
                {
                  label: "E-mail",
                  value: client.email ? (
                    <a href={`mailto:${client.email}`} className="inline-flex items-center gap-1.5 hover:text-accent">
                      <Mail className="size-3.5 text-ink-4" />
                      {client.email}
                    </a>
                  ) : null,
                },
                {
                  label: "Telefone",
                  value: client.phone ? (
                    <span className="inline-flex items-center gap-1.5">
                      <Phone className="size-3.5 text-ink-4" />
                      {client.phone}
                    </span>
                  ) : null,
                },
                {
                  label: "Site",
                  value: client.website ? (
                    <a
                      href={client.website.startsWith("http") ? client.website : `https://${client.website}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 hover:text-accent"
                    >
                      <Globe className="size-3.5 text-ink-4" />
                      {client.website.replace(/^https?:\/\//, "")}
                      <ExternalLink className="size-3 text-ink-4" />
                    </a>
                  ) : null,
                },
                {
                  label: "Local",
                  value: client.city ? (
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="size-3.5 text-ink-4" />
                      {client.city}
                      {client.state ? `/${client.state}` : ""}
                    </span>
                  ) : null,
                },
                { label: "Cliente desde", value: client.customer_since ? formatDate(client.customer_since) : null },
                { label: "Responsável", value: owner?.name ?? null },
                {
                  label: "Origem",
                  value: client.lead_id ? (
                    <Link href={`/leads/${client.lead_id}`} className="text-accent hover:underline">
                      Ver lead de origem
                    </Link>
                  ) : (
                    "Cadastro direto"
                  ),
                },
              ]}
            />
            {client.notes ? (
              <div className="border-t border-line px-4 py-3">
                <p className="mb-1 text-xs text-ink-3">Observações</p>
                <p className="text-[13px] leading-relaxed whitespace-pre-wrap text-ink-2">{client.notes}</p>
              </div>
            ) : null}
          </Card>

          <Card>
            <CardHeader title="Propostas" icon={<FileText />} />
            {(proposals ?? []).length === 0 ? (
              <EmptyState className="py-6" title="Nenhuma proposta" description="Monte uma oferta personalizada para este cliente." />
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
      <div className="flex items-center gap-3 border-b border-line px-4 py-6 sm:px-6 lg:px-page">
        <Skeleton className="size-11 rounded-full" />
        <div className="flex flex-col gap-2">
          <Skeleton className="h-5 w-56" />
          <Skeleton className="h-3 w-40" />
        </div>
      </div>
      <div className="grid gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[1fr_340px] lg:px-page">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    </>
  );
}
