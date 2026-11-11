"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ORG_COOKIE, getSupabase, getUser } from "@/lib/auth";
import { errorMessage, str } from "@/lib/utils";

export type OnboardingState = { error?: string } | null;

const DUPLICATE_WINDOW_MS = 10 * 60 * 1000;

async function selectOrganization(orgId: string) {
  (await cookies()).set(ORG_COOKIE, orgId, { path: "/", sameSite: "lax", httpOnly: true, maxAge: 60 * 60 * 24 * 365 });
}

export async function createOrganization(_prev: OnboardingState, formData: FormData): Promise<OnboardingState> {
  const user = await getUser();
  if (!user) redirect("/login");

  const name = str(formData, "name")?.slice(0, 120);
  if (!name) return { error: "Informe o nome da sua empresa." };

  const supabase = await getSupabase();

  // Idempotência: um segundo envio do mesmo formulário reaproveita a empresa recém-criada
  const { data: owned } = await supabase
    .from("organization_members")
    .select("organization:organizations(id, name, created_at)")
    .eq("user_id", user.id)
    .eq("role", "owner");
  const duplicate = (owned ?? [])
    .map((m) => m.organization)
    .find((o) => o && o.name === name && Date.now() - new Date(o.created_at).getTime() < DUPLICATE_WINDOW_MS);
  if (duplicate) {
    await selectOrganization(duplicate.id);
    redirect("/");
  }

  const { data: orgId, error } = await supabase.rpc("create_organization", {
    p_name: name,
    p_with_demo: formData.get("demo") === "on",
  });
  if (error || !orgId) return { error: errorMessage(error, "Não foi possível criar a empresa.") };

  await selectOrganization(orgId);
  redirect("/");
}
