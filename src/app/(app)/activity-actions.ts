"use server";

import { refresh } from "next/cache";
import { getContext } from "@/lib/auth";
import { COMPOSER_TYPES, type ActivityType } from "@/lib/constants";
import { errorMessage, str, type ActionResult } from "@/lib/utils";

/** "2026-11-12T14:30" (horário de São Paulo, sem horário de verão) → ISO. */
function localToIso(value: string | null) {
  if (!value) return null;
  const withSeconds = value.length === 16 ? `${value}:00` : value;
  const date = new Date(`${withSeconds}-03:00`);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export async function createActivity(
  target: { leadId?: string | null; clientId?: string | null },
  formData: FormData,
): Promise<ActionResult> {
  const ctx = await getContext();
  const type = (str(formData, "type") ?? "note") as ActivityType;
  if (!COMPOSER_TYPES.includes(type)) return { ok: false, error: "Tipo de atividade inválido." };
  if (!target.leadId && !target.clientId) return { ok: false, error: "Atividade sem lead ou cliente." };

  const title = str(formData, "title");
  const body = str(formData, "body");
  const dueAt = localToIso(str(formData, "due_at"));

  if (type === "task" && !title) return { ok: false, error: "Descreva a tarefa." };
  if (type !== "task" && !body && !title) return { ok: false, error: "Escreva algo antes de registrar." };

  const { error } = await ctx.supabase.from("activities").insert({
    organization_id: ctx.org.id,
    lead_id: target.leadId ?? null,
    client_id: target.clientId ?? null,
    type,
    title: title?.slice(0, 200) ?? null,
    body: body?.slice(0, 5000) ?? null,
    due_at: type === "task" ? dueAt : null,
    created_by: ctx.userId,
  });
  if (error) return { ok: false, error: errorMessage(error) };

  refresh();
  return { ok: true, message: type === "task" ? "Tarefa criada" : "Atividade registrada" };
}

export async function toggleTask(id: string, done: boolean): Promise<ActionResult> {
  const ctx = await getContext();
  const { error } = await ctx.supabase
    .from("activities")
    .update({ completed_at: done ? new Date().toISOString() : null })
    .eq("id", id)
    .eq("organization_id", ctx.org.id)
    .eq("type", "task");
  if (error) return { ok: false, error: errorMessage(error) };
  refresh();
  return { ok: true };
}

export async function deleteActivity(id: string): Promise<ActionResult> {
  const ctx = await getContext();
  const { error } = await ctx.supabase
    .from("activities")
    .delete()
    .eq("id", id)
    .eq("organization_id", ctx.org.id)
    .in("type", COMPOSER_TYPES);
  if (error) return { ok: false, error: errorMessage(error) };
  refresh();
  return { ok: true, message: "Atividade removida" };
}
