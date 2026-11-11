"use server";

import { redirect } from "next/navigation";
import { getContext } from "@/lib/auth";
import { readVariants, sanitizeDoc, templateByKey, type FunnelDoc } from "@/lib/funnels";
import type { Json } from "@/lib/supabase/database.types";
import { errorMessage, str, type ActionResult } from "@/lib/utils";

const UUID = /^[0-9a-f-]{36}$/i;

/** Produto do catálogo da empresa ativa (ou null quando não é dela). */
async function ownProduct(productId: string | null) {
  if (!productId || !UUID.test(productId)) return null;
  const ctx = await getContext();
  const { data } = await ctx.supabase
    .from("products")
    .select("id, unit_price")
    .eq("id", productId)
    .eq("organization_id", ctx.org.id)
    .maybeSingle();
  return data;
}

/** Cria o funil a partir de um modelo e abre o editor. Sem nome, usa o do modelo. */
export async function createFunnel(formData: FormData): Promise<ActionResult> {
  const ctx = await getContext();
  const template = templateByKey(str(formData, "template"));
  const name = str(formData, "name") ?? (template.key === "blank" ? "Novo funil" : template.name);

  const product = await ownProduct(str(formData, "product_id"));
  const price = product ? Number(product.unit_price) : 0;
  // O preço do produto vira o valor da venda no modelo
  const variant = template.build({ value: price > 0 ? price : undefined });

  const { data, error } = await ctx.supabase
    .from("funnels")
    .insert({
      organization_id: ctx.org.id,
      name: name.slice(0, 120),
      description: str(formData, "description")?.slice(0, 2000) ?? null,
      product_id: product?.id ?? null,
      variants: [variant] as unknown as Json,
    })
    .select("id")
    .single();
  if (error) return { ok: false, error: errorMessage(error) };
  redirect(`/funis/${data.id}`);
}

export type SaveFunnelResult = { ok: true; version: string } | { ok: false; error: string; conflict?: boolean };

/**
 * Salvamento automático do editor: o documento inteiro, validado aqui antes de ir para o banco.
 * `version` é o updated_at que o editor conhece; se o banco tiver uma versão mais nova (outra aba,
 * outra pessoa), nada é gravado e o editor pergunta o que fazer. Sem `version`, grava por cima.
 */
export async function saveFunnel(id: string, input: FunnelDoc, version: string | null): Promise<SaveFunnelResult> {
  const ctx = await getContext();
  if (!UUID.test(id)) return { ok: false, error: "Funil não encontrado." };
  const doc = sanitizeDoc(input);
  if (!doc) return { ok: false, error: "Não foi possível ler o funil. Recarregue a página." };

  const product = doc.productId ? await ownProduct(doc.productId) : null;
  let query = ctx.supabase
    .from("funnels")
    .update({
      name: doc.name,
      description: doc.description || null,
      status: doc.status,
      product_id: product?.id ?? null,
      variants: doc.variants as unknown as Json,
      winner_variant: doc.winnerId,
    })
    .eq("id", id)
    .eq("organization_id", ctx.org.id);
  if (version) query = query.eq("updated_at", version);
  const { data, error } = await query.select("updated_at").maybeSingle();
  if (error) return { ok: false, error: errorMessage(error) };
  if (!data) {
    const { data: current } = await ctx.supabase
      .from("funnels")
      .select("id")
      .eq("id", id)
      .eq("organization_id", ctx.org.id)
      .maybeSingle();
    return current
      ? { ok: false, conflict: true, error: "Este funil foi salvo em outra aba ou por outra pessoa enquanto você editava." }
      : { ok: false, error: "Funil não encontrado. Ele pode ter sido excluído." };
  }
  return { ok: true, version: data.updated_at };
}

export async function duplicateFunnel(id: string) {
  const ctx = await getContext();
  const { data: source } = await ctx.supabase
    .from("funnels")
    .select("name, description, product_id, variants, winner_variant")
    .eq("id", id)
    .eq("organization_id", ctx.org.id)
    .maybeSingle();
  if (!source) return { ok: false, error: "Funil não encontrado." } satisfies ActionResult;

  const { data: copy, error } = await ctx.supabase
    .from("funnels")
    .insert({
      organization_id: ctx.org.id,
      name: `${source.name} (cópia)`.slice(0, 120),
      description: source.description,
      product_id: source.product_id,
      variants: readVariants(source.variants) as unknown as Json,
      winner_variant: source.winner_variant,
    })
    .select("id")
    .single();
  if (error) return { ok: false, error: errorMessage(error) } satisfies ActionResult;
  redirect(`/funis/${copy.id}`);
}

export async function deleteFunnel(id: string) {
  const ctx = await getContext();
  const { error } = await ctx.supabase.from("funnels").delete().eq("id", id).eq("organization_id", ctx.org.id);
  if (error) return { ok: false, error: errorMessage(error) } satisfies ActionResult;
  redirect("/funis");
}
