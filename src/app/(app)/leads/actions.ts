"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { getContext } from "@/lib/auth";
import { BANT, TEMPERATURE_ORDER, type BantKey, type LeadTemperature } from "@/lib/constants";
import type { TablesUpdate } from "@/lib/supabase/database.types";
import { errorMessage, parseMoney, parseTags, str, type ActionResult } from "@/lib/utils";

function temperature(value: string | null): LeadTemperature {
  return TEMPERATURE_ORDER.includes(value as LeadTemperature) ? (value as LeadTemperature) : "warm";
}

function leadFields(formData: FormData) {
  return {
    name: str(formData, "name") ?? "",
    company: str(formData, "company"),
    job_title: str(formData, "job_title"),
    email: str(formData, "email")?.toLowerCase() ?? null,
    phone: str(formData, "phone"),
    source: str(formData, "source"),
    estimated_value: parseMoney(formData.get("estimated_value")),
    temperature: temperature(str(formData, "temperature")),
    expected_close_date: str(formData, "expected_close_date"),
    notes: str(formData, "notes"),
    tags: parseTags(str(formData, "tags")),
  };
}

export async function createLead(formData: FormData): Promise<ActionResult> {
  const ctx = await getContext();
  const fields = leadFields(formData);
  if (!fields.name) return { ok: false, error: "Informe o nome do lead." };

  const stageId = str(formData, "stage_id");
  const { data: stage } = stageId
    ? await ctx.supabase
        .from("pipeline_stages")
        .select("id, pipeline_id")
        .eq("id", stageId)
        .eq("organization_id", ctx.org.id)
        .maybeSingle()
    : { data: null };
  if (!stage) return { ok: false, error: "Escolha uma etapa válida do pipeline." };

  const { data, error } = await ctx.supabase
    .from("leads")
    .insert({
      ...fields,
      organization_id: ctx.org.id,
      pipeline_id: stage.pipeline_id,
      stage_id: stage.id,
      owner_id: str(formData, "owner_id") ?? ctx.userId,
      created_by: ctx.userId,
    })
    .select("id")
    .single();
  if (error) return { ok: false, error: errorMessage(error) };

  refresh();
  return { ok: true, id: data.id, message: "Lead criado" };
}

export async function updateLead(id: string, formData: FormData): Promise<ActionResult> {
  const ctx = await getContext();
  const fields = leadFields(formData);
  if (!fields.name) return { ok: false, error: "Informe o nome do lead." };

  const { error } = await ctx.supabase
    .from("leads")
    .update({ ...fields, owner_id: str(formData, "owner_id") })
    .eq("id", id)
    .eq("organization_id", ctx.org.id);
  if (error) return { ok: false, error: errorMessage(error) };

  refresh();
  return { ok: true, message: "Lead atualizado" };
}

export async function moveLead(id: string, stageId: string, lostReason?: string | null): Promise<ActionResult> {
  const ctx = await getContext();
  const update: TablesUpdate<"leads"> = { stage_id: stageId };
  if (lostReason !== undefined) update.lost_reason = lostReason?.trim() ? lostReason.trim().slice(0, 500) : null;

  const { error } = await ctx.supabase.from("leads").update(update).eq("id", id).eq("organization_id", ctx.org.id);
  if (error) return { ok: false, error: errorMessage(error) };

  refresh();
  return { ok: true };
}

export async function updateQualification(
  id: string,
  patch: Partial<Record<BantKey, boolean>> & { temperature?: LeadTemperature },
): Promise<ActionResult> {
  const ctx = await getContext();
  const update: TablesUpdate<"leads"> = {};
  for (const { key } of BANT) {
    if (typeof patch[key] === "boolean") update[key] = patch[key];
  }
  if (patch.temperature) update.temperature = temperature(patch.temperature);
  if (Object.keys(update).length === 0) return { ok: true };

  const { error } = await ctx.supabase.from("leads").update(update).eq("id", id).eq("organization_id", ctx.org.id);
  if (error) return { ok: false, error: errorMessage(error) };

  refresh();
  return { ok: true };
}

export async function convertLead(id: string): Promise<ActionResult> {
  const ctx = await getContext();
  const { data, error } = await ctx.supabase.rpc("convert_lead_to_client", { p_lead_id: id });
  if (error) return { ok: false, error: errorMessage(error) };
  refresh();
  return { ok: true, id: data, message: "Lead convertido em cliente" };
}

export async function deleteLead(id: string): Promise<ActionResult> {
  const ctx = await getContext();
  const { error } = await ctx.supabase.from("leads").delete().eq("id", id).eq("organization_id", ctx.org.id);
  if (error) return { ok: false, error: errorMessage(error) };
  redirect("/leads");
}
