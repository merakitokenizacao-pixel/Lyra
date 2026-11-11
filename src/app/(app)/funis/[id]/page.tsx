import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getContext } from "@/lib/auth";
import { readVariants, type FunnelDoc } from "@/lib/funnels";
import { Skeleton } from "@/components/ui/misc";
import { FunnelEditor } from "./editor";

export const metadata: Metadata = { title: "Funil" };

export default function FunnelPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<EditorSkeleton />}>
      <FunnelContent params={params} />
    </Suspense>
  );
}

async function FunnelContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { supabase, org } = await getContext();

  const [{ data: funnel }, { data: products }] = await Promise.all([
    supabase
      .from("funnels")
      .select("id, name, description, status, product_id, variants, winner_variant, updated_at")
      .eq("id", id)
      .eq("organization_id", org.id)
      .maybeSingle(),
    supabase.from("products").select("id, name, unit_price, active").eq("organization_id", org.id).order("name"),
  ]);
  if (!funnel) notFound();

  const variants = readVariants(funnel.variants);
  const initial: FunnelDoc = {
    name: funnel.name,
    description: funnel.description ?? "",
    status: funnel.status,
    productId: funnel.product_id,
    winnerId: variants.some((v) => v.id === funnel.winner_variant) ? funnel.winner_variant : null,
    variants,
  };

  return (
    <FunnelEditor
      key={funnel.id}
      id={funnel.id}
      initial={initial}
      version={funnel.updated_at}
      // Produtos ativos, mais o do funil mesmo que tenha sido desativado
      products={(products ?? [])
        .filter((p) => p.active || p.id === funnel.product_id)
        .map((p) => ({ id: p.id, name: p.name, price: Number(p.unit_price) }))}
    />
  );
}

function EditorSkeleton() {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex h-14 shrink-0 items-center gap-3 border-b border-line px-6">
        <Skeleton className="size-7 rounded-lg" />
        <Skeleton className="h-4 w-56" />
      </div>
      <div className="flex h-11 shrink-0 items-center gap-2 border-b border-line px-4">
        <Skeleton className="h-7 w-32 rounded-lg" />
        <Skeleton className="h-7 w-24 rounded-lg" />
      </div>
      <div className="flex min-h-[420px] flex-1">
        <div className="hidden w-56 flex-col gap-2 border-r border-line p-3 lg:flex">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-full rounded-lg" />
          ))}
        </div>
        <div className="flex-1 bg-subtle" />
        <div className="hidden w-80 flex-col gap-3 border-l border-line p-4 lg:flex">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-28 w-full rounded-lg" />
          <Skeleton className="h-40 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}
