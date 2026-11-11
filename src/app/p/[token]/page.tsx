import type { Metadata } from "next";
import { Suspense } from "react";
import { CircleCheck, CircleX, Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import type { BillingCycle, ProposalStatus } from "@/lib/constants";
import { formatDateTime, isPastDate } from "@/lib/format";
import { LyroMark } from "@/components/brand";
import { Skeleton } from "@/components/ui/misc";
import { ProposalDocument } from "@/components/proposal-document";
import { MarkViewed, PrintButton, RespondForm } from "./client-parts";

export const metadata: Metadata = {
  title: "Proposta comercial",
  robots: { index: false, follow: false },
};

type PublicProposal = {
  id: string;
  number: number;
  title: string;
  status: ProposalStatus;
  valid_until: string | null;
  intro: string | null;
  sections: { id: string; title: string; body: string }[] | null;
  terms: string | null;
  created_at: string;
  sent_at: string | null;
  responded_at: string | null;
  response_name: string | null;
  organization: { name: string };
  client: { name: string; legal_name: string | null } | null;
  lead: { name: string; company: string | null } | null;
  owner: { full_name: string | null; email: string | null } | null;
  items: {
    name: string;
    description: string | null;
    quantity: number;
    unit_price: number;
    discount_pct: number;
    billing: BillingCycle;
  }[];
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function PublicProposalPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <div className="min-h-dvh bg-canvas">
      <Suspense fallback={<PublicSkeleton />}>
        <PublicProposal params={params} searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function PublicProposal({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ token }, query] = await Promise.all([params, searchParams]);
  const preview = query.preview === "1";

  let proposal: PublicProposal | null = null;
  if (UUID.test(token)) {
    const supabase = await createClient();
    const { data } = await supabase.rpc("get_public_proposal", { p_token: token });
    proposal = (data as PublicProposal | null) ?? null;
  }

  if (!proposal) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 px-6 text-center">
        <LyroMark className="size-9" />
        <h1 className="font-display text-[30px] text-ink">Proposta indisponível</h1>
        <p className="max-w-sm text-[13.5px] text-ink-3">
          O link pode ter sido digitado incorretamente ou a proposta foi retirada. Fale com quem enviou para receber um novo link.
        </p>
      </div>
    );
  }

  const answered = proposal.status === "accepted" || proposal.status === "rejected";
  const expired = proposal.status === "expired" || (proposal.valid_until ? isPastDate(proposal.valid_until) : false);
  const recipient = proposal.client?.name ?? proposal.lead?.company ?? proposal.lead?.name ?? null;

  return (
    <>
      {!preview && !answered ? <MarkViewed token={token} /> : null}

      <header className="no-print sticky top-0 z-20 border-b border-line bg-canvas/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-[820px] items-center justify-between gap-3 px-4">
          <span className="truncate text-[13.5px] font-semibold tracking-tight text-ink">{proposal.organization.name}</span>
          <div className="flex items-center gap-2">
            {preview ? (
              <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800">Pré-visualização interna</span>
            ) : null}
            <PrintButton />
          </div>
        </div>
      </header>

      <main className="px-3 py-6 sm:px-6 sm:py-10">
        <ProposalDocument
          className="print-plain rounded-xl border border-line shadow-card"
          data={{
            number: proposal.number,
            title: proposal.title,
            organization: proposal.organization.name,
            recipient,
            recipientDetail: proposal.client?.legal_name ?? (proposal.lead?.company ? proposal.lead.name : null),
            createdAt: proposal.sent_at ?? proposal.created_at,
            validUntil: proposal.valid_until,
            intro: proposal.intro,
            sections: proposal.sections ?? [],
            items: proposal.items.map((i) => ({ ...i, quantity: Number(i.quantity), unit_price: Number(i.unit_price), discount_pct: Number(i.discount_pct) })),
            terms: proposal.terms,
            owner: proposal.owner ? { name: proposal.owner.full_name, email: proposal.owner.email } : null,
          }}
        />

        <section className="no-print mx-auto mt-6 w-full max-w-[820px] rounded-xl border border-line bg-panel px-6 py-6 shadow-card sm:px-12 sm:py-8">
          {proposal.status === "accepted" ? (
            <div className="flex items-start gap-3">
              <CircleCheck className="mt-0.5 size-5 shrink-0 text-success" />
              <div>
                <p className="text-[15px] font-semibold text-ink">Proposta aceita</p>
                <p className="mt-1 text-[13.5px] text-ink-3">
                  Aceita por {proposal.response_name ?? "cliente"}
                  {proposal.responded_at ? ` em ${formatDateTime(proposal.responded_at)}` : ""}. Em breve entraremos em contato
                  com os próximos passos.
                </p>
              </div>
            </div>
          ) : proposal.status === "rejected" ? (
            <div className="flex items-start gap-3">
              <CircleX className="mt-0.5 size-5 shrink-0 text-ink-3" />
              <div>
                <p className="text-[15px] font-semibold text-ink">Proposta recusada</p>
                <p className="mt-1 text-[13.5px] text-ink-3">
                  Resposta registrada{proposal.responded_at ? ` em ${formatDateTime(proposal.responded_at)}` : ""}. Obrigado
                  pelo retorno.
                </p>
              </div>
            </div>
          ) : expired ? (
            <div className="flex items-start gap-3">
              <Clock className="mt-0.5 size-5 shrink-0 text-warning" />
              <div>
                <p className="text-[15px] font-semibold text-ink">Esta proposta expirou</p>
                <p className="mt-1 text-[13.5px] text-ink-3">
                  Fale com {proposal.owner?.full_name ?? "a equipe"} para receber uma versão atualizada.
                </p>
              </div>
            </div>
          ) : (
            <>
              <h2 className="font-display text-[26px] leading-tight text-ink">
                Vamos seguir juntos?
                <br />
                <span className="text-ink-4">Responda por aqui mesmo.</span>
              </h2>
              <div className="mt-6">
                {preview ? (
                  <p className="rounded-lg border border-dashed border-line-strong px-4 py-3 text-[13px] text-ink-3">
                    No link enviado ao cliente, aqui aparecem os botões para aceitar ou recusar a proposta.
                  </p>
                ) : (
                  <RespondForm token={token} />
                )}
              </div>
            </>
          )}
        </section>

        <p className="no-print mt-8 flex items-center justify-center gap-1.5 text-xs text-ink-4">
          <LyroMark className="size-4" /> Enviado com Lyro
        </p>
      </main>
    </>
  );
}

function PublicSkeleton() {
  return (
    <div className="mx-auto flex max-w-[820px] flex-col gap-4 px-4 py-16">
      <Skeleton className="h-6 w-40" />
      <Skeleton className="h-14 w-3/4" />
      <Skeleton className="h-96 w-full rounded-xl" />
    </div>
  );
}
