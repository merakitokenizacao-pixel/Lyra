"use server";

import { refresh } from "next/cache";
import { getContext } from "@/lib/auth";
import type { BillingCycle } from "@/lib/constants";
import { errorMessage, parseMoney, str, type ActionResult } from "@/lib/utils";

function productFields(formData: FormData) {
  const billing: BillingCycle = str(formData, "billing") === "monthly" ? "monthly" : "one_time";
  return {
    name: str(formData, "name") ?? "",
    description: str(formData, "description"),
    unit_price: parseMoney(formData.get("unit_price")),
    unit: (str(formData, "unit") ?? "un").slice(0, 20),
    billing,
    active: formData.get("active") !== "off",
  };
}

export async function createProduct(formData: FormData): Promise<ActionResult> {
  const ctx = await getContext();
  const fields = productFields(formData);
  if (!fields.name) return { ok: false, error: "Informe o nome do produto ou serviço." };
  const { error } = await ctx.supabase.from("products").insert({ ...fields, organization_id: ctx.org.id });
  if (error) return { ok: false, error: errorMessage(error) };
  refresh();
  return { ok: true, message: "Produto cadastrado" };
}

export async function updateProduct(id: string, formData: FormData): Promise<ActionResult> {
  const ctx = await getContext();
  const fields = productFields(formData);
  if (!fields.name) return { ok: false, error: "Informe o nome do produto ou serviço." };
  const { error } = await ctx.supabase.from("products").update(fields).eq("id", id).eq("organization_id", ctx.org.id);
  if (error) return { ok: false, error: errorMessage(error) };
  refresh();
  return { ok: true, message: "Produto atualizado" };
}

export async function setProductActive(id: string, active: boolean): Promise<ActionResult> {
  const ctx = await getContext();
  const { error } = await ctx.supabase.from("products").update({ active }).eq("id", id).eq("organization_id", ctx.org.id);
  if (error) return { ok: false, error: errorMessage(error) };
  refresh();
  return { ok: true, message: active ? "Produto ativado" : "Produto desativado" };
}

export async function deleteProduct(id: string): Promise<ActionResult> {
  const ctx = await getContext();
  const { error } = await ctx.supabase.from("products").delete().eq("id", id).eq("organization_id", ctx.org.id);
  if (error) return { ok: false, error: errorMessage(error) };
  refresh();
  return { ok: true, message: "Produto excluído" };
}
