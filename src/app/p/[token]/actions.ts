"use server";

import { refresh } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { str, type ActionResult } from "@/lib/utils";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function markViewed(token: string) {
  if (!UUID.test(token)) return;
  const supabase = await createClient();
  await supabase.rpc("mark_proposal_viewed", { p_token: token });
}

export async function respondToProposal(token: string, accept: boolean, formData: FormData): Promise<ActionResult> {
  if (!UUID.test(token)) return { ok: false, error: "Proposta não encontrada." };
  const name = str(formData, "name");
  if (!name) return { ok: false, error: "Informe seu nome para registrar a resposta." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("respond_proposal", {
    p_token: token,
    p_accept: accept,
    p_name: name,
    p_comment: str(formData, "comment") ?? undefined,
  });
  if (error) return { ok: false, error: error.message };

  refresh();
  return { ok: true, message: accept ? "Proposta aceita. Obrigado!" : "Resposta registrada. Obrigado pelo retorno!" };
}
