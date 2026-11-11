import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getContext } from "@/lib/auth";
import type { ProposalSection } from "@/lib/constants";
import { Skeleton } from "@/components/ui/misc";
import { ProposalEditor } from "./editor";

export const metadata: Metadata = { title: "Proposta" };

export default function ProposalPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<EditorSkeleton />}>
      <ProposalContent params={params} />
    </Suspense>
  );
}

function asSections(value: unknown): ProposalSection[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((s): s is Record<string, unknown> => Boolean(s) && typeof s === "object")
    .map((s, index) => ({
      id: typeof s.id === "string" ? s.id : `s${index}`,
      title: typeof s.title === "string" ? s.title : "",
      body: typeof s.body === "string" ? s.body : "",
    }));
}

async function ProposalContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, org } = await getContext();
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const [{ data: proposal }, { data: items }, { data: products }, { data: clients }, { data: leads }] = await Promise.all([
    supabase
      .from("proposals")
      .select("*, owner:profiles!proposals_owner_id_fkey(full_name, email)")
      .eq("id", id)
      .eq("organization_id", org.id)
      .maybeSingle(),
    supabase
      .from("proposal_items")
      .select("product_id, name, description, quantity, unit_price, discount_pct, billing, position")
      .eq("proposal_id", id)
      .eq("organization_id", org.id)
      .order("position"),
    supabase
      .from("products")
      .select("id, name, description, unit_price, unit, billing")
      .eq("organization_id", org.id)
      .eq("active", true)
      .order("name"),
    supabase.from("clients").select("id, name, legal_name").eq("organization_id", org.id).order("name").limit(1000),
    supabase.from("leads").select("id, name, company").eq("organization_id", org.id).order("created_at", { ascending: false }).limit(1000),
  ]);
  if (!proposal) notFound();

  const fmt = (n: number) => (Number.isInteger(n) ? String(n) : String(n).replace(".", ","));

  return (
    <ProposalEditor
      key={proposal.id}
      proposal={{
        id: proposal.id,
        number: proposal.number,
        title: proposal.title,
        status: proposal.status,
        client_id: proposal.client_id,
        lead_id: proposal.lead_id,
        valid_until: proposal.valid_until,
        intro: proposal.intro,
        sections: asSections(proposal.sections),
        terms: proposal.terms,
        public_token: proposal.public_token,
        created_at: proposal.created_at,
        sent_at: proposal.sent_at,
        viewed_at: proposal.viewed_at,
        responded_at: proposal.responded_at,
        response_name: proposal.response_name,
        response_comment: proposal.response_comment,
      }}
      initialItems={(items ?? []).map((i) => ({
        product_id: i.product_id,
        name: i.name,
        description: i.description ?? "",
        quantity: fmt(Number(i.quantity)),
        unit_price: fmt(Number(i.unit_price)),
        discount_pct: fmt(Number(i.discount_pct)),
        billing: i.billing,
      }))}
      products={(products ?? []).map((p) => ({ ...p, unit_price: Number(p.unit_price) }))}
      recipients={{ clients: clients ?? [], leads: leads ?? [] }}
      organization={org.name}
      owner={proposal.owner ? { name: proposal.owner.full_name, email: proposal.owner.email } : null}
      siteUrl={process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}
    />
  );
}

function EditorSkeleton() {
  return (
    <>
      <div className="flex h-14 items-center border-b border-line px-4 sm:px-6 lg:px-page">
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="grid gap-6 px-4 py-6 sm:px-6 lg:px-page xl:grid-cols-[1fr_300px]">
        <div className="flex flex-col gap-4">
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
        <Skeleton className="h-56 w-full rounded-xl" />
      </div>
    </>
  );
}
