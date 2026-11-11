import type { Metadata } from "next";
import { Suspense } from "react";
import type { User } from "@supabase/supabase-js";
import { getContext } from "@/lib/auth";
import { ROLE_LABEL } from "@/lib/constants";
import { formatDate, formatDateTime, greeting } from "@/lib/format";
import { switchOrganization } from "@/app/(app)/shell-actions";
import { Avatar, Card, CardHeader, Skeleton } from "@/components/ui/misc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SettingsTitle } from "../settings-ui";
import { EmailChangeNotice } from "./email-change-notice";
import { ProfileForm } from "./profile-form";
import { SecurityCard, type PendingEmailChange } from "./security-card";

export const metadata: Metadata = { title: "Minha conta" };

export default function AccountPage() {
  return (
    <div className="flex flex-col gap-6">
      <SettingsTitle
        title="Minha conta"
        description="Seus dados pessoais e o seu acesso ao Lyra. Valem para todas as empresas em que você está."
      />
      <Suspense fallback={<AccountSkeleton />}>
        <AccountContent />
      </Suspense>
    </div>
  );
}

async function AccountContent() {
  const ctx = await getContext();
  const { profile } = ctx;
  // Direto do Supabase Auth: já mostra o e-mail novo logo após a confirmação e a troca que ainda falta confirmar
  const { data: auth } = await ctx.supabase.auth.getUser();
  const email = auth.user?.email ?? profile.email ?? "";
  const initial = {
    full_name: profile.name_missing ? "" : profile.full_name,
    preferred_name: profile.preferred_name ?? "",
    job_title: profile.job_title ?? "",
  };

  return (
    <>
      <EmailChangeNotice email={email} />

      <Card className="overflow-hidden">
        <div className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center">
          <Avatar name={profile.full_name} size="xl" />
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-[26px] leading-tight text-ink">{profile.full_name}</p>
            <p className="mt-1 truncate text-[13px] text-ink-3">
              {profile.job_title ? `${profile.job_title} · ` : null}
              {email}
            </p>
          </div>
          <Badge tone={ctx.role === "owner" ? "dark" : "muted"} className="self-start sm:self-center">
            {ROLE_LABEL[ctx.role]} na {ctx.org.name}
          </Badge>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-1 border-t border-line bg-subtle px-5 py-2.5 text-xs text-ink-3">
          {profile.created_at ? <span>Conta criada em {formatDate(profile.created_at, "long")}</span> : null}
          <span>
            No time da {ctx.org.name} desde {formatDate(ctx.joined_at, "long")}
          </span>
        </div>
      </Card>

      <ProfileForm
        key={Object.values(initial).join("|")}
        initial={initial}
        emailName={email.split("@")[0] ?? ""}
        greeting={greeting()}
      />

      <SecurityCard email={email} pendingEmail={pendingEmailChange(auth.user)} />

      <Card>
        <CardHeader title="Suas empresas" description="Onde você tem acesso no Lyra e com qual papel." />
        <ul className="divide-y divide-line border-t border-line">
          {ctx.orgs.map((org) => (
            <li key={org.id} className="flex items-center gap-3 px-4 py-3 sm:px-5">
              <span
                aria-hidden
                className="grid size-8 shrink-0 place-items-center rounded-lg bg-ink font-display text-[16px] leading-none text-white"
              >
                {org.name.trim().charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13.5px] font-medium text-ink">{org.name}</p>
                <p className="text-xs text-ink-3">
                  {ROLE_LABEL[org.role]} · no time desde {formatDate(org.joined_at)}
                </p>
              </div>
              {org.id === ctx.org.id ? (
                <Badge tone="accent">Em uso</Badge>
              ) : (
                <form action={switchOrganization.bind(null, org.id)}>
                  <Button type="submit" size="sm">
                    Abrir
                  </Button>
                </form>
              )}
            </li>
          ))}
        </ul>
      </Card>
    </>
  );
}

/** Troca de e-mail pedida nas últimas 24 horas e ainda não confirmada. */
function pendingEmailChange(user: User | null): PendingEmailChange {
  const sentAt = user?.email_change_sent_at;
  if (!user?.new_email || !sentAt) return null;
  if (Date.now() - new Date(sentAt).getTime() > 24 * 60 * 60 * 1000) return null;
  return { email: user.new_email, since: formatDateTime(sentAt) };
}

function AccountSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-36 w-full rounded-xl" />
      <Skeleton className="h-96 w-full rounded-xl" />
      <Skeleton className="h-60 w-full rounded-xl" />
      <Skeleton className="h-28 w-full rounded-xl" />
    </div>
  );
}
