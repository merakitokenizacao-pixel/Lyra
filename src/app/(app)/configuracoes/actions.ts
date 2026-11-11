"use server";

import { refresh } from "next/cache";
import { getContext, isAdmin } from "@/lib/auth";
import {
  DEFAULT_PIPELINE_STAGES,
  STAGE_CATEGORY_LABEL,
  STAGE_COLORS,
  type MemberRole,
  type StageCategory,
  type StageColor,
} from "@/lib/constants";
import { errorMessage, str, type ActionResult } from "@/lib/utils";

type Context = Awaited<ReturnType<typeof getContext>>;

const UUID = /^[0-9a-f-]{36}$/i;

async function adminContext() {
  const ctx = await getContext();
  if (!isAdmin(ctx.role)) return { ctx, denied: { ok: false, error: "Apenas administradores podem alterar esta configuração." } as const };
  return { ctx, denied: null };
}

export async function updateOrganization(formData: FormData): Promise<ActionResult> {
  const { ctx, denied } = await adminContext();
  if (denied) return denied;
  const name = str(formData, "name");
  if (!name) return { ok: false, error: "Informe o nome da empresa." };
  const { error } = await ctx.supabase.from("organizations").update({ name: name.slice(0, 120) }).eq("id", ctx.org.id);
  if (error) return { ok: false, error: errorMessage(error) };
  refresh();
  return { ok: true, message: "Empresa atualizada" };
}

/** Atualiza só os campos enviados — o formulário da tela inicial manda apenas o nome. */
export async function updateProfile(formData: FormData): Promise<ActionResult> {
  const ctx = await getContext();
  const patch: { full_name?: string; preferred_name?: string | null; job_title?: string | null } = {};

  if (formData.has("full_name")) {
    const fullName = str(formData, "full_name");
    if (!fullName) return { ok: false, error: "Informe seu nome." };
    patch.full_name = fullName.slice(0, 120);
  }
  if (formData.has("preferred_name")) patch.preferred_name = str(formData, "preferred_name")?.slice(0, 40) ?? null;
  if (formData.has("job_title")) patch.job_title = str(formData, "job_title")?.slice(0, 80) ?? null;
  if (Object.keys(patch).length === 0) return { ok: true };

  const { error } = await ctx.supabase.from("profiles").update(patch).eq("id", ctx.userId);
  if (error) return { ok: false, error: errorMessage(error) };
  refresh();
  return { ok: true, message: "Perfil atualizado" };
}

export type StageInput = { id?: string; name: string; color: string; category: StageCategory };

export async function saveStages(pipelineId: string, stages: StageInput[]): Promise<ActionResult> {
  const { ctx, denied } = await adminContext();
  if (denied) return denied;

  const clean = stages
    .map((s) => ({
      ...s,
      name: s.name.trim().slice(0, 60),
      color: (s.color in STAGE_COLORS ? s.color : "stone") as StageColor,
      category: (["open", "won", "lost"].includes(s.category) ? s.category : "open") as StageCategory,
    }))
    .filter((s) => s.name);
  if (!clean.some((s) => s.category === "open")) return { ok: false, error: "O pipeline precisa de pelo menos uma etapa em andamento." };

  const { data: existing } = await ctx.supabase
    .from("pipeline_stages")
    .select("id")
    .eq("pipeline_id", pipelineId)
    .eq("organization_id", ctx.org.id);
  if (!existing) return { ok: false, error: "Pipeline não encontrado." };

  const keep = new Set(clean.filter((s) => s.id).map((s) => s.id));
  const removed = existing.filter((s) => !keep.has(s.id)).map((s) => s.id);

  if (removed.length > 0) {
    const { count } = await ctx.supabase
      .from("leads")
      .select("id", { count: "exact", head: true })
      .in("stage_id", removed)
      .eq("organization_id", ctx.org.id);
    if ((count ?? 0) > 0) {
      return { ok: false, error: "Há leads em etapas que você removeu. Mova esses leads para outra etapa antes de excluir." };
    }
    const { error } = await ctx.supabase.from("pipeline_stages").delete().in("id", removed).eq("organization_id", ctx.org.id);
    if (error) return { ok: false, error: errorMessage(error) };
  }

  for (const [index, stage] of clean.entries()) {
    const values = { name: stage.name, color: stage.color, category: stage.category, position: index };
    const { error } = stage.id
      ? await ctx.supabase.from("pipeline_stages").update(values).eq("id", stage.id).eq("organization_id", ctx.org.id)
      : await ctx.supabase
          .from("pipeline_stages")
          .insert({ ...values, pipeline_id: pipelineId, organization_id: ctx.org.id });
    if (error) return { ok: false, error: errorMessage(error) };
  }

  refresh();
  return { ok: true, message: "Etapas salvas" };
}

/* ------------------------------------------------------------------
   Pipelines: cada um é um quadro com as próprias etapas. O padrão abre
   primeiro no quadro e alimenta o funil do Início.
   ------------------------------------------------------------------ */

/** Pipeline da empresa ativa, ou null quando o id não é dela. */
async function ownPipeline(ctx: Context, id: string | null) {
  if (!id || !UUID.test(id)) return null;
  const { data } = await ctx.supabase
    .from("pipelines")
    .select("id, name, is_default")
    .eq("id", id)
    .eq("organization_id", ctx.org.id)
    .maybeSingle();
  return data;
}

function pipelineName(value: string | null) {
  return value?.replace(/\s+/g, " ").trim().slice(0, 80) || null;
}

/** Nomes iguais (sem diferenciar maiúsculas) confundiriam a lista e os filtros por etapa. */
async function pipelineNameTaken(ctx: Context, name: string, exceptId?: string) {
  const { data } = await ctx.supabase.from("pipelines").select("id, name").eq("organization_id", ctx.org.id);
  const key = name.toLocaleLowerCase("pt-BR");
  return (data ?? []).some((p) => p.id !== exceptId && p.name.trim().toLocaleLowerCase("pt-BR") === key);
}

/**
 * Cria um pipeline com as etapas do modelo padrão de vendas ou com as de outro pipeline da
 * empresa (`template` = id dele). Entra no fim da lista e não vira o padrão.
 */
export async function createPipeline(formData: FormData): Promise<ActionResult> {
  const { ctx, denied } = await adminContext();
  if (denied) return denied;
  const name = pipelineName(str(formData, "name"));
  if (!name) return { ok: false, error: "Dê um nome ao pipeline." };
  if (await pipelineNameTaken(ctx, name)) return { ok: false, error: "Já existe um pipeline com esse nome." };

  let stages: { name: string; color: string; category: StageCategory }[] = DEFAULT_PIPELINE_STAGES;
  const template = str(formData, "template");
  if (template && template !== "standard") {
    const source = await ownPipeline(ctx, template);
    if (!source) return { ok: false, error: "O pipeline escolhido como modelo não existe mais." };
    const { data, error } = await ctx.supabase
      .from("pipeline_stages")
      .select("name, color, category")
      .eq("pipeline_id", source.id)
      .eq("organization_id", ctx.org.id)
      .order("position");
    if (error) return { ok: false, error: errorMessage(error) };
    if (data.length > 0) stages = data;
  }

  const { data: last } = await ctx.supabase
    .from("pipelines")
    .select("position")
    .eq("organization_id", ctx.org.id)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: created, error } = await ctx.supabase
    .from("pipelines")
    .insert({ organization_id: ctx.org.id, name, position: (last?.position ?? -1) + 1 })
    .select("id")
    .single();
  if (error) return { ok: false, error: errorMessage(error) };

  const { error: stagesError } = await ctx.supabase.from("pipeline_stages").insert(
    stages.map((s, position) => ({
      organization_id: ctx.org.id,
      pipeline_id: created.id,
      name: s.name,
      color: s.color,
      category: s.category,
      position,
    })),
  );
  if (stagesError) {
    // Sem etapas o quadro fica inútil: desfaz o pipeline
    await ctx.supabase.from("pipelines").delete().eq("id", created.id).eq("organization_id", ctx.org.id);
    return { ok: false, error: errorMessage(stagesError) };
  }

  refresh();
  return { ok: true, id: created.id, message: "Pipeline criado" };
}

export async function renamePipeline(formData: FormData): Promise<ActionResult> {
  const { ctx, denied } = await adminContext();
  if (denied) return denied;
  const pipeline = await ownPipeline(ctx, str(formData, "id"));
  if (!pipeline) return { ok: false, error: "Pipeline não encontrado." };
  const name = pipelineName(str(formData, "name"));
  if (!name) return { ok: false, error: "Dê um nome ao pipeline." };
  if (name === pipeline.name) return { ok: true };
  if (await pipelineNameTaken(ctx, name, pipeline.id)) return { ok: false, error: "Já existe um pipeline com esse nome." };

  const { error } = await ctx.supabase.from("pipelines").update({ name }).eq("id", pipeline.id).eq("organization_id", ctx.org.id);
  if (error) return { ok: false, error: errorMessage(error) };
  refresh();
  return { ok: true, message: "Pipeline renomeado" };
}

export async function setDefaultPipeline(id: string): Promise<ActionResult> {
  const { ctx, denied } = await adminContext();
  if (denied) return denied;
  const pipeline = await ownPipeline(ctx, id);
  if (!pipeline) return { ok: false, error: "Pipeline não encontrado." };
  if (pipeline.is_default) return { ok: true };

  // Marca o novo antes de desmarcar os outros: se algo falhar no meio, nunca fica sem padrão
  const { error } = await ctx.supabase
    .from("pipelines")
    .update({ is_default: true })
    .eq("id", pipeline.id)
    .eq("organization_id", ctx.org.id);
  if (error) return { ok: false, error: errorMessage(error) };
  const { error: othersError } = await ctx.supabase
    .from("pipelines")
    .update({ is_default: false })
    .eq("organization_id", ctx.org.id)
    .eq("is_default", true)
    .neq("id", pipeline.id);
  if (othersError) return { ok: false, error: errorMessage(othersError) };

  refresh();
  return { ok: true, message: `“${pipeline.name}” agora é o pipeline padrão` };
}

/**
 * Exclui um pipeline e as etapas dele. Os leads vão antes para `targetId`: cada um entra na etapa
 * de mesmo nome e tipo no destino ou, se não houver, na primeira etapa do mesmo tipo (em
 * andamento, ganho ou perdido).
 */
export async function deletePipeline(id: string, targetId: string | null): Promise<ActionResult> {
  const { ctx, denied } = await adminContext();
  if (denied) return denied;
  const pipeline = await ownPipeline(ctx, id);
  if (!pipeline) return { ok: false, error: "Pipeline não encontrado." };
  if (pipeline.is_default) {
    return { ok: false, error: "Este é o pipeline padrão. Defina outro como padrão antes de excluir." };
  }

  const { data: leads, error: leadsError } = await ctx.supabase
    .from("leads")
    .select("stage_id")
    .eq("pipeline_id", pipeline.id)
    .eq("organization_id", ctx.org.id)
    .limit(10000);
  if (leadsError) return { ok: false, error: errorMessage(leadsError) };

  let movedTo: string | null = null;
  if (leads.length > 0) {
    const target = targetId && targetId !== pipeline.id ? await ownPipeline(ctx, targetId) : null;
    if (!target) return { ok: false, error: "Escolha para qual pipeline os leads vão." };

    const { data: stages, error: stagesError } = await ctx.supabase
      .from("pipeline_stages")
      .select("id, pipeline_id, name, category")
      .in("pipeline_id", [pipeline.id, target.id])
      .eq("organization_id", ctx.org.id)
      .order("position");
    if (stagesError) return { ok: false, error: errorMessage(stagesError) };

    const nameKey = (name: string) => name.trim().toLocaleLowerCase("pt-BR");
    const sourceStage = new Map(stages.filter((s) => s.pipeline_id === pipeline.id).map((s) => [s.id, s]));
    const targetStages = stages.filter((s) => s.pipeline_id === target.id);

    // Confere todas as etapas antes de mover qualquer lead
    const moves: { from: string; to: string }[] = [];
    for (const from of new Set(leads.map((l) => l.stage_id))) {
      const stage = sourceStage.get(from);
      const category = stage?.category ?? "open";
      const sameType = targetStages.filter((s) => s.category === category);
      const to = (stage && sameType.find((s) => nameKey(s.name) === nameKey(stage.name))) ?? sameType[0];
      if (!to) {
        return {
          ok: false,
          error: `“${target.name}” não tem etapa do tipo “${STAGE_CATEGORY_LABEL[category]}” para receber os leads. Crie uma ou escolha outro pipeline.`,
        };
      }
      moves.push({ from, to: to.id });
    }
    for (const move of moves) {
      const { error } = await ctx.supabase
        .from("leads")
        .update({ stage_id: move.to })
        .eq("stage_id", move.from)
        .eq("organization_id", ctx.org.id);
      if (error) return { ok: false, error: errorMessage(error) };
    }
    movedTo = target.name;
  }

  const { error } = await ctx.supabase.from("pipelines").delete().eq("id", pipeline.id).eq("organization_id", ctx.org.id);
  if (error) return { ok: false, error: errorMessage(error) };

  refresh();
  return {
    ok: true,
    message: movedTo
      ? `Pipeline excluído. ${leads.length === 1 ? "1 lead foi" : `${leads.length} leads foram`} para “${movedTo}”.`
      : "Pipeline excluído",
  };
}

export async function inviteMember(formData: FormData): Promise<ActionResult> {
  const { ctx, denied } = await adminContext();
  if (denied) return denied;
  const email = str(formData, "email")?.toLowerCase();
  const role: MemberRole = str(formData, "role") === "admin" ? "admin" : "member";
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, error: "Informe um e-mail válido." };

  const { data: members } = await ctx.supabase
    .from("organization_members")
    .select("profile:profiles(email)")
    .eq("organization_id", ctx.org.id);
  if ((members ?? []).some((m) => m.profile?.email?.toLowerCase() === email)) {
    return { ok: false, error: "Essa pessoa já faz parte do time." };
  }

  const { error } = await ctx.supabase
    .from("organization_invites")
    .upsert({ organization_id: ctx.org.id, email, role, invited_by: ctx.userId, accepted_at: null }, { onConflict: "organization_id,email" });
  if (error) return { ok: false, error: errorMessage(error) };
  refresh();
  return { ok: true, message: "Convite criado" };
}

export async function revokeInvite(id: string): Promise<ActionResult> {
  const { ctx, denied } = await adminContext();
  if (denied) return denied;
  const { error } = await ctx.supabase.from("organization_invites").delete().eq("id", id).eq("organization_id", ctx.org.id);
  if (error) return { ok: false, error: errorMessage(error) };
  refresh();
  return { ok: true, message: "Convite removido" };
}

export async function updateMemberRole(userId: string, role: MemberRole): Promise<ActionResult> {
  const { ctx, denied } = await adminContext();
  if (denied) return denied;
  if (role === "owner") return { ok: false, error: "A propriedade da empresa não pode ser transferida por aqui." };
  if (userId === ctx.userId) return { ok: false, error: "Você não pode alterar o seu próprio papel." };
  const { error } = await ctx.supabase
    .from("organization_members")
    .update({ role })
    .eq("organization_id", ctx.org.id)
    .eq("user_id", userId)
    .neq("role", "owner");
  if (error) return { ok: false, error: errorMessage(error) };
  refresh();
  return { ok: true, message: "Papel atualizado" };
}

export async function removeMember(userId: string): Promise<ActionResult> {
  const { ctx, denied } = await adminContext();
  if (denied) return denied;
  if (userId === ctx.userId) return { ok: false, error: "Você não pode remover a si mesmo." };
  const { error } = await ctx.supabase
    .from("organization_members")
    .delete()
    .eq("organization_id", ctx.org.id)
    .eq("user_id", userId)
    .neq("role", "owner");
  if (error) return { ok: false, error: errorMessage(error) };
  refresh();
  return { ok: true, message: "Pessoa removida da equipe" };
}
