"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { getContext } from "@/lib/auth";
import { CLIENT_STATUS_ORDER, type ClientStatus } from "@/lib/constants";
import { errorMessage, parseMoney, parseTags, str, type ActionResult } from "@/lib/utils";

function clientFields(formData: FormData) {
  const kind = str(formData, "kind") === "person" ? "person" : "company";
  const state = str(formData, "state")?.toUpperCase().slice(0, 2) ?? null;
  return {
    name: str(formData, "name") ?? "",
    legal_name: str(formData, "legal_name"),
    kind,
    document: str(formData, "document"),
    email: str(formData, "email")?.toLowerCase() ?? null,
    phone: str(formData, "phone"),
    website: str(formData, "website"),
    industry: str(formData, "industry"),
    city: str(formData, "city"),
    state,
    monthly_value: parseMoney(formData.get("monthly_value")),
    customer_since: str(formData, "customer_since"),
    notes: str(formData, "notes"),
    tags: parseTags(str(formData, "tags")),
    owner_id: str(formData, "owner_id"),
  };
}

function status(value: string | null): ClientStatus {
  return CLIENT_STATUS_ORDER.includes(value as ClientStatus) ? (value as ClientStatus) : "onboarding";
}

export async function createCustomer(formData: FormData): Promise<ActionResult> {
  const ctx = await getContext();
  const fields = clientFields(formData);
  if (!fields.name) return { ok: false, error: "Informe o nome do cliente." };

  const { data, error } = await ctx.supabase
    .from("clients")
    .insert({
      ...fields,
      owner_id: fields.owner_id ?? ctx.userId,
      status: status(str(formData, "status")),
      organization_id: ctx.org.id,
      created_by: ctx.userId,
    })
    .select("id")
    .single();
  if (error) return { ok: false, error: errorMessage(error) };

  refresh();
  return { ok: true, id: data.id, message: "Cliente cadastrado" };
}

export async function updateCustomer(id: string, formData: FormData): Promise<ActionResult> {
  const ctx = await getContext();
  const fields = clientFields(formData);
  if (!fields.name) return { ok: false, error: "Informe o nome do cliente." };

  const { error } = await ctx.supabase.from("clients").update(fields).eq("id", id).eq("organization_id", ctx.org.id);
  if (error) return { ok: false, error: errorMessage(error) };

  refresh();
  return { ok: true, message: "Cliente atualizado" };
}

export async function setClientStatus(id: string, next: ClientStatus): Promise<ActionResult> {
  const ctx = await getContext();
  const { error } = await ctx.supabase
    .from("clients")
    .update({ status: status(next) })
    .eq("id", id)
    .eq("organization_id", ctx.org.id);
  if (error) return { ok: false, error: errorMessage(error) };
  refresh();
  return { ok: true };
}

export async function deleteCustomer(id: string): Promise<ActionResult> {
  const ctx = await getContext();
  const { error } = await ctx.supabase.from("clients").delete().eq("id", id).eq("organization_id", ctx.org.id);
  if (error) return { ok: false, error: errorMessage(error) };
  redirect("/clientes");
}

export async function addContact(clientId: string, formData: FormData): Promise<ActionResult> {
  const ctx = await getContext();
  const name = str(formData, "name");
  if (!name) return { ok: false, error: "Informe o nome do contato." };
  const isPrimary = formData.get("is_primary") === "on";

  if (isPrimary) {
    await ctx.supabase.from("contacts").update({ is_primary: false }).eq("client_id", clientId).eq("organization_id", ctx.org.id);
  }
  const { error } = await ctx.supabase.from("contacts").insert({
    organization_id: ctx.org.id,
    client_id: clientId,
    name,
    job_title: str(formData, "job_title"),
    email: str(formData, "email")?.toLowerCase() ?? null,
    phone: str(formData, "phone"),
    is_primary: isPrimary,
  });
  if (error) return { ok: false, error: errorMessage(error) };

  refresh();
  return { ok: true, message: "Contato adicionado" };
}

export async function deleteContact(id: string): Promise<ActionResult> {
  const ctx = await getContext();
  const { error } = await ctx.supabase.from("contacts").delete().eq("id", id).eq("organization_id", ctx.org.id);
  if (error) return { ok: false, error: errorMessage(error) };
  refresh();
  return { ok: true, message: "Contato removido" };
}
