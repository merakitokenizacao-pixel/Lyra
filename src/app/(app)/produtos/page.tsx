import type { Metadata } from "next";
import { Suspense } from "react";
import { Package, Plus } from "lucide-react";
import { getContext } from "@/lib/auth";
import { BILLING_LABEL } from "@/lib/constants";
import { formatMoney } from "@/lib/format";
import { PageHeader } from "@/components/shell/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState, Skeleton } from "@/components/ui/misc";
import { DotGlyph } from "@/components/brand";
import { ProductDialog } from "./product-dialog";
import { ProductRowActions } from "./row-actions";

export const metadata: Metadata = { title: "Produtos e serviços" };

export default function ProductsPage() {
  return (
    <>
      <PageHeader
        title="Produtos e serviços"
        icon={<Package />}
        actions={
          <ProductDialog
            trigger={
              <Button variant="primary">
                <Plus />
                Novo produto
              </Button>
            }
          />
        }
      />
      <Suspense fallback={<ListSkeleton />}>
        <ProductsContent />
      </Suspense>
    </>
  );
}

async function ProductsContent() {
  const { supabase, org } = await getContext();
  const { data } = await supabase
    .from("products")
    .select("id, name, description, unit_price, unit, billing, active")
    .eq("organization_id", org.id)
    .order("active", { ascending: false })
    .order("name");
  const products = (data ?? []).map((p) => ({ ...p, unit_price: Number(p.unit_price) }));

  if (products.length === 0) {
    return (
      <EmptyState
        icon={<DotGlyph name="products" className="size-12" />}
        title="Catálogo vazio"
        description="Cadastre seus produtos e serviços com preço e forma de cobrança para montar propostas mais rápido."
        className="py-20"
      />
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-[13px]">
        <thead>
          <tr className="border-b border-line text-left text-xs text-ink-3">
            <th className="py-2.5 pr-3 pl-4 font-medium sm:pl-6">Produto ou serviço</th>
            <th className="px-3 py-2.5 font-medium">Cobrança</th>
            <th className="px-3 py-2.5 text-right font-medium">Preço</th>
            <th className="px-3 py-2.5 font-medium">Situação</th>
            <th className="py-2.5 pr-4 pl-3 sm:pr-6">
              <span className="sr-only">Ações</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {products.map((p) => (
            <tr key={p.id} className={p.active ? "hover:bg-subtle" : "bg-subtle/60 text-ink-3"}>
              <td className="py-2.5 pr-3 pl-4 sm:pl-6">
                <p className="font-medium text-ink">{p.name}</p>
                {p.description ? <p className="max-w-md truncate text-xs text-ink-3">{p.description}</p> : null}
              </td>
              <td className="px-3 py-2.5 text-ink-2">{BILLING_LABEL[p.billing]}</td>
              <td className="px-3 py-2.5 text-right font-medium text-ink tabular-nums">
                {formatMoney(p.unit_price)}
                <span className="font-normal text-ink-3">/{p.unit}</span>
              </td>
              <td className="px-3 py-2.5">
                {p.active ? <Badge tone="success">Ativo</Badge> : <Badge tone="muted">Inativo</Badge>}
              </td>
              <td className="py-2 pr-4 pl-3 sm:pr-6">
                <ProductRowActions product={p} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="flex flex-col gap-3 px-6 py-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-11 w-full" />
      ))}
    </div>
  );
}
