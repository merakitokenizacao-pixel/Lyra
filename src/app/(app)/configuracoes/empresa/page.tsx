import type { Metadata } from "next";
import { Suspense } from "react";
import { getContext, isAdmin } from "@/lib/auth";
import { getTeam } from "@/lib/queries";
import { ROLE_LABEL, type MemberRole } from "@/lib/constants";
import { formatDate, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Card, Skeleton } from "@/components/ui/misc";
import { Badge } from "@/components/ui/badge";
import { SettingsTitle } from "../settings-ui";
import { OrganizationForm } from "./organization-form";
import { TeamSection } from "./team-section";

export const metadata: Metadata = { title: "Empresa e time" };

export default function CompanyPage() {
  return (
    <div className="flex flex-col gap-6">
      <SettingsTitle
        title="Empresa e time"
        description="Como sua empresa aparece no Lyro e quem trabalha com você aqui dentro."
      />
      <Suspense fallback={<CompanySkeleton />}>
        <CompanyContent />
      </Suspense>
    </div>
  );
}

async function CompanyContent() {
  const ctx = await getContext();
  const { supabase } = ctx;
  const orgId = ctx.org.id;
  const admin = isAdmin(ctx.role);

  const [team, { data: org }, leads, clients, proposals, invites] = await Promise.all([
    getTeam(),
    supabase.from("organizations").select("created_at").eq("id", orgId).single(),
    supabase.from("leads").select("id", { count: "exact", head: true }).eq("organization_id", orgId),
    supabase.from("clients").select("id", { count: "exact", head: true }).eq("organization_id", orgId),
    supabase.from("proposals").select("id", { count: "exact", head: true }).eq("organization_id", orgId),
    // Convites só são visíveis para quem pode gerenciá-los (RLS)
    admin
      ? supabase
          .from("organization_invites")
          .select("id, email, role, created_at, inviter:profiles(full_name)")
          .eq("organization_id", orgId)
          .is("accepted_at", null)
          .order("created_at")
      : null,
  ]);

  const stats = [
    { label: team.length === 1 ? "Pessoa no time" : "Pessoas no time", value: team.length },
    { label: "Leads", value: leads.count ?? 0 },
    { label: "Clientes", value: clients.count ?? 0 },
    { label: "Propostas", value: proposals.count ?? 0 },
  ];

  return (
    <>
      <Card className="overflow-hidden">
        <div className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center">
          <span
            aria-hidden
            className="grid size-14 shrink-0 place-items-center rounded-2xl bg-ink font-display text-[28px] leading-none text-white"
          >
            {ctx.org.name.trim().charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-[26px] leading-tight text-ink">{ctx.org.name}</p>
            <p className="mt-1 text-[13px] text-ink-3">No Lyro desde {formatDate(org?.created_at, "long")}</p>
          </div>
          <Badge tone={ctx.role === "owner" ? "dark" : "muted"} className="self-start sm:self-center">
            Seu papel: {ROLE_LABEL[ctx.role]}
          </Badge>
        </div>
        <dl className="grid grid-cols-2 border-t border-line sm:grid-cols-4">
          {stats.map((stat, index) => (
            <div
              key={stat.label}
              className={cn(
                "border-line px-5 py-3",
                index % 2 === 0 && "border-r",
                index < 2 && "border-b sm:border-b-0",
                index === 1 && "sm:border-r",
              )}
            >
              <dt className="text-xs text-ink-3">{stat.label}</dt>
              <dd className="mt-0.5 text-[22px] leading-tight font-semibold tracking-tight text-ink tabular-nums">
                {formatNumber(stat.value)}
              </dd>
            </div>
          ))}
        </dl>
      </Card>

      <OrganizationForm key={ctx.org.name} name={ctx.org.name} canEdit={admin} />

      <TeamSection
        currentUserId={ctx.userId}
        canManage={admin}
        members={team}
        invites={(invites?.data ?? []).map((i) => ({
          id: i.id,
          email: i.email,
          role: i.role as MemberRole,
          createdAt: i.created_at,
          invitedBy: i.inviter?.full_name ?? null,
        }))}
      />
    </>
  );
}

function CompanySkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-44 w-full rounded-xl" />
      <Skeleton className="h-40 w-full rounded-xl" />
      <Skeleton className="h-72 w-full rounded-xl" />
    </div>
  );
}
