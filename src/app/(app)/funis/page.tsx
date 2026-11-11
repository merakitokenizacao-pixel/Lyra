import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { Plus, Trophy, Workflow } from "lucide-react";
import { getContext } from "@/lib/auth";
import { firstParam, type SearchParams } from "@/lib/queries";
import { formatMoney, formatRelative } from "@/lib/format";
import {
  FUNNEL_STATUSES,
  FUNNEL_STATUS_ORDER,
  formatPeople,
  formatShare,
  readVariants,
  simulate,
  variantLetter,
  type FunnelSim,
  type FunnelStatus,
  type FunnelVariant,
} from "@/lib/funnels";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/shell/page-header";
import { LinkTabs } from "@/components/ui/tabs";
import { DotBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState, Skeleton } from "@/components/ui/misc";
import { DotGlyph } from "@/components/brand";
import { FunnelThumbnail } from "./funnel-thumbnail";
import { NewFunnelDialog } from "./new-funnel-dialog";
import { TemplateStarter } from "./template-starter";

export const metadata: Metadata = { title: "Funis" };

export default function FunnelsPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <>
      <PageHeader
        title="Funis"
        icon={<Workflow />}
        actions={
          <Suspense
            fallback={
              <Button variant="primary" disabled>
                <Plus />
                Novo funil
              </Button>
            }
          >
            <NewFunnelButton />
          </Suspense>
        }
      />
      <Suspense fallback={<ListSkeleton />}>
        <FunnelsContent searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function NewFunnelButton() {
  const { supabase, org } = await getContext();
  const { data } = await supabase
    .from("products")
    .select("id, name, unit_price")
    .eq("organization_id", org.id)
    .eq("active", true)
    .order("name");
  return <NewFunnelDialog products={(data ?? []).map((p) => ({ id: p.id, name: p.name, price: Number(p.unit_price) }))} />;
}

type FunnelRow = {
  id: string;
  name: string;
  description: string | null;
  status: FunnelStatus;
  updated_at: string;
  product: { name: string } | null;
  variants: FunnelVariant[];
  sims: FunnelSim[];
  winnerIndex: number;
};

async function FunnelsContent({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const statusParam = firstParam(params.status) ?? "all";
  const status = FUNNEL_STATUS_ORDER.includes(statusParam as FunnelStatus) ? (statusParam as FunnelStatus) : "all";
  const { supabase, org } = await getContext();

  const { data } = await supabase
    .from("funnels")
    .select("id, name, description, status, variants, winner_variant, updated_at, product:products(name)")
    .eq("organization_id", org.id)
    .order("updated_at", { ascending: false })
    .limit(200);

  const all: FunnelRow[] = (data ?? []).map((f) => {
    const variants = readVariants(f.variants);
    return {
      id: f.id,
      name: f.name,
      description: f.description,
      status: f.status,
      updated_at: f.updated_at,
      product: f.product,
      variants,
      sims: variants.map((v) => simulate(v)),
      winnerIndex: variants.findIndex((v) => v.id === f.winner_variant),
    };
  });

  if (all.length === 0) {
    return (
      <EmptyState
        icon={<DotGlyph name="funnels" className="size-12" />}
        title="Desenhe o caminho dos seus produtos"
        description="Monte o funil etapa por etapa (do anúncio ao agente de IA e à plataforma), preveja quantas pessoas chegam ao fim e compare abordagens diferentes antes de investir."
        action={<TemplateStarter />}
        className="py-16"
      />
    );
  }

  const rows = status === "all" ? all : all.filter((f) => f.status === status);

  return (
    <>
      <LinkTabs
        active={status}
        items={[
          { key: "all", label: "Todos", href: "/funis", count: all.length },
          ...FUNNEL_STATUS_ORDER.map((s) => ({
            key: s,
            label: FUNNEL_STATUSES[s].label,
            href: `/funis?status=${s}`,
            count: all.filter((f) => f.status === s).length,
          })),
        ]}
      />
      {rows.length === 0 ? (
        <EmptyState
          icon={<DotGlyph name="funnels" className="size-12" tone="muted" />}
          title="Nenhum funil neste status"
          description="Escolha outra aba para ver os demais funis."
          className="py-20"
        />
      ) : (
        <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-6 lg:px-page xl:grid-cols-3">
          {rows.map((funnel) => (
            <FunnelCard key={funnel.id} funnel={funnel} />
          ))}
        </div>
      )}
    </>
  );
}

function FunnelCard({ funnel }: { funnel: FunnelRow }) {
  const mainIndex = Math.max(0, funnel.winnerIndex);
  const variant = funnel.variants[mainIndex];
  const sim = funnel.sims[mainIndex];
  const status = FUNNEL_STATUSES[funnel.status];
  const multiple = funnel.variants.length > 1;
  const bestRate = Math.max(...funnel.sims.map((s) => (s.entries > 0 ? s.rate : 0)));

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-xl border border-line bg-panel shadow-card transition-[border-color,box-shadow] hover:border-line-strong hover:shadow-pop">
      <div
        className="relative h-36 border-b border-line bg-subtle"
        style={{ backgroundImage: "radial-gradient(circle, var(--line-strong) 1px, transparent 1.3px)", backgroundSize: "14px 14px" }}
      >
        <FunnelThumbnail variant={variant} sim={sim} className="absolute inset-0 size-full p-3" />
        {multiple ? (
          <span className="absolute top-2.5 left-2.5 inline-flex h-5.5 items-center rounded-full border border-line bg-panel px-2 text-[11px] font-medium text-ink-2">
            {funnel.winnerIndex >= 0 ? `Vencedora: ${variantLetter(mainIndex)}` : `Mostrando ${variantLetter(mainIndex)}`}
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="truncate text-[14px] font-semibold tracking-tight text-ink">
              <Link href={`/funis/${funnel.id}`} className="outline-none after:absolute after:inset-0 group-hover:text-accent focus-visible:underline">
                {funnel.name}
              </Link>
            </h2>
            <p className="mt-0.5 truncate text-xs text-ink-3">
              {funnel.product?.name ?? "Sem produto"} · {funnel.variants.length} {multiple ? "variantes" : "variante"}
            </p>
          </div>
          <DotBadge dotClassName={status.dot}>{status.label}</DotBadge>
        </div>

        <dl className="grid grid-cols-3 gap-2 border-t border-line pt-3">
          <div className="min-w-0">
            <dt className="truncate text-[11px] text-ink-4">Entradas/mês</dt>
            <dd className="truncate text-[14px] font-semibold text-ink tabular-nums">{formatPeople(sim.entries)}</dd>
          </div>
          <div className="min-w-0">
            <dt className="truncate text-[11px] text-ink-4">Conversão</dt>
            <dd className="truncate text-[14px] font-semibold text-ink tabular-nums">
              {sim.entries > 0 ? formatShare(sim.rate) : "—"}
              <span className="ml-1 text-[11px] font-normal text-ink-4">{sim.entries > 0 ? formatPeople(sim.conversions) : ""}</span>
            </dd>
          </div>
          <div className="min-w-0">
            <dt className="truncate text-[11px] text-ink-4">Receita/mês</dt>
            <dd className="truncate text-[14px] font-semibold text-ink tabular-nums">{formatMoney(sim.revenue, "compact")}</dd>
          </div>
        </dl>

        <div className="mt-auto flex items-center justify-between gap-2 text-[11.5px] text-ink-4">
          {multiple ? (
            <span className="flex min-w-0 flex-wrap items-center gap-1.5" aria-label="Conversão prevista por variante">
              {funnel.variants.map((v, index) => {
                const s = funnel.sims[index];
                const best = s.entries > 0 && s.rate === bestRate && bestRate > 0;
                return (
                  <span
                    key={v.id}
                    title={v.name}
                    className={cn(
                      "inline-flex h-5 items-center gap-1 rounded-md px-1.5 tabular-nums",
                      best ? "bg-accent-soft font-medium text-accent" : "bg-hover text-ink-3",
                    )}
                  >
                    {variantLetter(index)}
                    {index === funnel.winnerIndex ? <Trophy className="size-3" aria-label="vencedora" /> : null}
                    <span>{s.entries > 0 ? formatShare(s.rate) : "—"}</span>
                  </span>
                );
              })}
            </span>
          ) : (
            <span className="truncate">{funnel.description || "Sem descrição"}</span>
          )}
          <span className="shrink-0">{formatRelative(funnel.updated_at)}</span>
        </div>
      </div>
    </article>
  );
}

function ListSkeleton() {
  return (
    <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-6 lg:px-page xl:grid-cols-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} className="h-[17rem] w-full rounded-xl" />
      ))}
    </div>
  );
}
