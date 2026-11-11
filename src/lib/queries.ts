import "server-only";
import { cache } from "react";
import { getContext } from "@/lib/auth";
import type { MemberRole, StageCategory } from "@/lib/constants";

export type TeamMember = {
  id: string;
  name: string;
  email: string | null;
  jobTitle: string | null;
  role: MemberRole;
  joinedAt: string;
};

const ROLE_ORDER: Record<MemberRole, number> = { owner: 0, admin: 1, member: 2 };

/** Time da empresa ativa: proprietário, administradores e membros, cada grupo por ordem de chegada. */
export const getTeam = cache(async (): Promise<TeamMember[]> => {
  const { supabase, org } = await getContext();
  const { data } = await supabase
    .from("organization_members")
    .select("user_id, role, created_at, profile:profiles(full_name, email, job_title)")
    .eq("organization_id", org.id)
    .order("created_at");
  return (data ?? [])
    .map((m) => ({
      id: m.user_id,
      name: m.profile?.full_name ?? m.profile?.email ?? "Usuário",
      email: m.profile?.email ?? null,
      jobTitle: m.profile?.job_title ?? null,
      role: m.role,
      joinedAt: m.created_at,
    }))
    .sort((a, b) => ROLE_ORDER[a.role] - ROLE_ORDER[b.role]);
});

export type StageOption = {
  id: string;
  name: string;
  color: string;
  category: StageCategory;
  position: number;
  pipeline_id: string;
};

export type PipelineWithStages = {
  id: string;
  name: string;
  is_default: boolean;
  stages: StageOption[];
};

/** Pipelines da organização com suas etapas, já ordenados. */
export const getPipelines = cache(async (): Promise<PipelineWithStages[]> => {
  const { supabase, org } = await getContext();
  const [{ data: pipelines }, { data: stages }] = await Promise.all([
    supabase.from("pipelines").select("id, name, is_default, position").eq("organization_id", org.id).order("position"),
    supabase
      .from("pipeline_stages")
      .select("id, name, color, category, position, pipeline_id")
      .eq("organization_id", org.id)
      .order("position"),
  ]);
  return (pipelines ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    is_default: p.is_default,
    stages: (stages ?? []).filter((s) => s.pipeline_id === p.id),
  }));
});

export const getStages = cache(async (): Promise<StageOption[]> => {
  const pipelines = await getPipelines();
  return pipelines.flatMap((p) => p.stages);
});

export type MemberOption = { id: string; name: string; email: string | null; role: string };

export const getMembers = cache(async (): Promise<MemberOption[]> => {
  const { supabase, org } = await getContext();
  const { data } = await supabase
    .from("organization_members")
    .select("user_id, role, profile:profiles(id, full_name, email)")
    .eq("organization_id", org.id)
    .order("created_at");
  return (data ?? []).map((m) => ({
    id: m.user_id,
    name: m.profile?.full_name ?? m.profile?.email ?? "Usuário",
    email: m.profile?.email ?? null,
    role: m.role,
  }));
});

export type OwnerOption = { id: string; name: string; you: boolean };

/** Opções do campo "Responsável": o usuário atual primeiro, marcado como "(você)". */
export const getOwnerOptions = cache(async (): Promise<OwnerOption[]> => {
  const [{ userId }, members] = await Promise.all([getContext(), getMembers()]);
  return members
    .map((m) => ({ id: m.id, name: m.id === userId ? `${m.name} (você)` : m.name, you: m.id === userId }))
    .sort((a, b) => Number(b.you) - Number(a.you));
});

/** Remove caracteres que quebram filtros do PostgREST (or/ilike). */
export function sanitizeSearch(value: string | undefined | null) {
  return (value ?? "").replace(/[%,()*\\"':]/g, " ").replace(/\s+/g, " ").trim().slice(0, 80);
}

export function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export type SearchParams = Promise<Record<string, string | string[] | undefined>>;
