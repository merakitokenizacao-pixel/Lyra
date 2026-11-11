"use server";

import { refresh } from "next/cache";
import { getContext, isAdmin } from "@/lib/auth";
import { STAGE_COLORS, type MemberRole, type StageCategory, type StageColor } from "@/lib/constants";
import { errorMessage, str, type ActionResult } from "@/lib/utils";

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
