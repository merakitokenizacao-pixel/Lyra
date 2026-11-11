import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { MemberRole } from "@/lib/constants";

export const ORG_COOKIE = "lyro_org";
export const ORG_COOKIE_OPTIONS = { path: "/", sameSite: "lax", httpOnly: true, maxAge: 60 * 60 * 24 * 365 } as const;

/** Um cliente Supabase por requisição. */
export const getSupabase = cache(createClient);

/** Usuário autenticado (JWT verificado via getClaims) ou null. */
export const getUser = cache(async () => {
  const supabase = await getSupabase();
  const { data, error } = await supabase.auth.getClaims();
  const sub = data?.claims?.sub;
  if (error || !sub) return null;
  return { id: sub, email: (data.claims.email as string | undefined) ?? null };
});

async function loadMemberships(userId: string) {
  const supabase = await getSupabase();
  const { data } = await supabase
    .from("organization_members")
    .select("role, created_at, organization:organizations(id, name)")
    .eq("user_id", userId)
    .order("created_at");
  return (data ?? []).filter((m) => m.organization);
}

/**
 * Camada de acesso a dados: garante sessão + organização ativa.
 * Redireciona para /login sem sessão e para /onboarding sem organização.
 */
export const getContext = cache(async () => {
  const supabase = await getSupabase();
  const user = await getUser();
  if (!user) redirect("/login");

  let memberships = await loadMemberships(user.id);
  if (memberships.length === 0) {
    // Convites pendentes para o e-mail do usuário viram associação automaticamente
    const { data: acceptedOrg } = await supabase.rpc("accept_pending_invites");
    if (acceptedOrg) memberships = await loadMemberships(user.id);
    if (memberships.length === 0) redirect("/onboarding");
  }

  const preferred = (await cookies()).get(ORG_COOKIE)?.value;
  const current = memberships.find((m) => m.organization!.id === preferred) ?? memberships[0];

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, preferred_name, job_title, email, avatar_url, created_at")
    .eq("id", user.id)
    .single();

  const email = profile?.email ?? user.email;
  const emailName = email?.split("@")[0] ?? null;
  const fullName = profile?.full_name?.trim() || null;

  return {
    supabase,
    userId: user.id,
    profile: {
      id: user.id,
      full_name: fullName ?? emailName ?? "Você",
      preferred_name: profile?.preferred_name ?? null,
      job_title: profile?.job_title ?? null,
      email,
      avatar_url: profile?.avatar_url ?? null,
      created_at: profile?.created_at ?? null,
      /** O nome ainda é o começo do e-mail, preenchido no cadastro quando a pessoa não informou o nome. */
      name_missing: !fullName || fullName.toLowerCase() === emailName?.toLowerCase(),
    },
    org: current.organization!,
    role: current.role as MemberRole,
    /** Quando a pessoa entrou no time da empresa ativa. */
    joined_at: current.created_at,
    orgs: memberships.map((m) => ({ ...m.organization!, role: m.role as MemberRole, joined_at: m.created_at })),
  };
});

export type AppContext = Awaited<ReturnType<typeof getContext>>;

export function isAdmin(role: MemberRole) {
  return role === "owner" || role === "admin";
}
