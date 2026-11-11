"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { getContext } from "@/lib/auth";
import { PROPOSAL_STATUS_ORDER, type BillingCycle, type ProposalSection, type ProposalStatus } from "@/lib/constants";
import { todayISO } from "@/lib/format";
import type { Json } from "@/lib/supabase/database.types";
import { errorMessage, str, type ActionResult } from "@/lib/utils";

const DEFAULT_INTRO =
  "Preparamos esta proposta com base no que conversamos. A seguir estão o contexto, o escopo do trabalho, os investimentos e as condições para começarmos.";
const DEFAULT_TERMS =
  "• Pagamento da parcela única em até 10 dias após o aceite.\n• Serviços mensais faturados todo dia 10, com fidelidade mínima de 6 meses.\n• Valores válidos até a data de validade desta proposta.";
const DEFAULT_SECTIONS: ProposalSection[] = [
  { id: "contexto", title: "Contexto", body: "" },
  { id: "escopo", title: "Escopo", body: "" },
  { id: "cronograma", title: "Cronograma", body: "" },
];

async function insertProposal(input: { leadId?: string | null; clientId?: string | null; title?: string | null }) {
  const ctx = await getContext();
  let title = input.title?.trim() || null;

  if (!title && input.clientId) {
    const { data } = await ctx.supabase.from("clients").select("name").eq("id", input.clientId).maybeSingle();
    if (data) title = `Proposta comercial · ${data.name}`;
  }
  if (!title && input.leadId) {
    const { data } = await ctx.supabase.from("leads").select("name, company").eq("id", input.leadId).maybeSingle();
    if (data) title = `Proposta comercial · ${data.company ?? data.name}`;
  }

  return ctx.supabase
    .from("proposals")
    .insert({
      organization_id: ctx.org.id,
      title: (title ?? "Nova proposta").slice(0, 200),
      lead_id: input.leadId ?? null,
      client_id: input.clientId ?? null,
      valid_until: todayISO(15),
      intro: DEFAULT_INTRO,
      sections: DEFAULT_SECTIONS as unknown as Json,
      terms: DEFAULT_TERMS,
      owner_id: ctx.userId,
      created_by: ctx.userId,
    })
    .select("id")
    .single();
}

/** Cria a proposta e abre o editor. */
export async function createProposal(input: { leadId?: string | null; clientId?: string | null }) {
  const { data, error } = await insertProposal(input);
  if (error) return { ok: false, error: errorMessage(error) } satisfies ActionResult;
  redirect(`/propostas/${data.id}`);
}

export async function createProposalFromForm(formData: FormData): Promise<ActionResult> {
  const recipient = str(formData, "recipient"); // "client:<id>" | "lead:<id>"
  const [kind, id] = recipient?.split(":") ?? [];
  const { data, error } = await insertProposal({
    title: str(formData, "title"),
    clientId: kind === "client" ? id : null,
    leadId: kind === "lead" ? id : null,
  });
  if (error) return { ok: false, error: errorMessage(error) };
  redirect(`/propostas/${data.id}`);
}

export type ProposalDraft = {
  title: string;
  client_id: string | null;
  lead_id: string | null;
  valid_until: string | null;
  intro: string;
  sections: ProposalSection[];
  terms: string;
  items: {
    product_id: string | null;
    name: string;
    description: string | null;
    quantity: number;
    unit_price: number;
    discount_pct: number;
    billing: BillingCycle;
  }[];
};

export async function saveProposal(id: string, draft: ProposalDraft): Promise<ActionResult> {
  const ctx = await getContext();
  if (!draft.title.trim()) return { ok: false, error: "Dê um título para a proposta." };

  const { data: current } = await ctx.supabase
    .from("proposals")
    .select("status")
    .eq("id", id)
    .eq("organization_id", ctx.org.id)
    .maybeSingle();
  if (!current) return { ok: false, error: "Proposta não encontrada." };
  if (current.status !== "draft") return { ok: false, error: "Volte a proposta para rascunho antes de editar." };

  const { error } = await ctx.supabase.rpc("save_proposal", {
    p_id: id,
    p_data: {
      ...draft,
      client_id: draft.client_id ?? "",
      lead_id: draft.lead_id ?? "",
      valid_until: draft.valid_until ?? "",
      sections: draft.sections.filter((s) => s.title.trim() || s.body.trim()),
    } as unknown as Json,
  });
  if (error) return { ok: false, error: errorMessage(error) };

  refresh();
  return { ok: true, message: "Proposta salva" };
}

export async function setProposalStatus(id: string, status: ProposalStatus): Promise<ActionResult> {
  const ctx = await getContext();
  if (!PROPOSAL_STATUS_ORDER.includes(status)) return { ok: false, error: "Status inválido." };

  const { data: current } = await ctx.supabase
    .from("proposals")
    .select("status, sent_at, total_one_time, total_monthly, title")
    .eq("id", id)
    .eq("organization_id", ctx.org.id)
    .maybeSingle();
  if (!current) return { ok: false, error: "Proposta não encontrada." };
  if (status === "sent" && Number(current.total_one_time) + Number(current.total_monthly) <= 0) {
    return { ok: false, error: "Adicione ao menos um item com valor antes de enviar." };
  }

  const now = new Date().toISOString();
  const { error } = await ctx.supabase
    .from("proposals")
    .update({
      status,
      sent_at: status === "sent" ? (current.sent_at ?? now) : status === "draft" ? null : current.sent_at,
      viewed_at: status === "draft" ? null : undefined,
      responded_at: status === "accepted" || status === "rejected" ? now : status === "draft" ? null : undefined,
      response_name: status === "draft" ? null : undefined,
      response_comment: status === "draft" ? null : undefined,
    })
    .eq("id", id)
    .eq("organization_id", ctx.org.id);
  if (error) return { ok: false, error: errorMessage(error) };

  refresh();
  const labels: Partial<Record<ProposalStatus, string>> = {
    sent: "Proposta marcada como enviada",
    draft: "Proposta voltou para rascunho",
    accepted: "Proposta marcada como aceita",
    rejected: "Proposta marcada como recusada",
    expired: "Proposta marcada como expirada",
  };
  return { ok: true, message: labels[status] };
}

export async function duplicateProposal(id: string) {
  const ctx = await getContext();
  const { data: source } = await ctx.supabase
    .from("proposals")
    .select("title, client_id, lead_id, intro, sections, terms, proposal_items(product_id, name, description, quantity, unit_price, discount_pct, billing, position)")
    .eq("id", id)
    .eq("organization_id", ctx.org.id)
    .maybeSingle();
  if (!source) return { ok: false, error: "Proposta não encontrada." } satisfies ActionResult;

  const { data: copy, error } = await ctx.supabase
    .from("proposals")
    .insert({
      organization_id: ctx.org.id,
      title: `${source.title} (cópia)`.slice(0, 200),
      client_id: source.client_id,
      lead_id: source.lead_id,
      intro: source.intro,
      sections: source.sections,
      terms: source.terms,
      valid_until: todayISO(15),
      owner_id: ctx.userId,
      created_by: ctx.userId,
    })
    .select("id")
    .single();
  if (error) return { ok: false, error: errorMessage(error) } satisfies ActionResult;

  const items = source.proposal_items ?? [];
  if (items.length > 0) {
    await ctx.supabase.from("proposal_items").insert(
      items.map((item) => ({ ...item, organization_id: ctx.org.id, proposal_id: copy.id })),
    );
  }
  redirect(`/propostas/${copy.id}`);
}

export async function deleteProposal(id: string) {
  const ctx = await getContext();
  const { error } = await ctx.supabase.from("proposals").delete().eq("id", id).eq("organization_id", ctx.org.id);
  if (error) return { ok: false, error: errorMessage(error) } satisfies ActionResult;
  redirect("/propostas");
}
