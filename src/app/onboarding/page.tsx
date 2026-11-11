import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { LyroLogo } from "@/components/brand";
import { Skeleton } from "@/components/ui/misc";
import { getSupabase, getUser } from "@/lib/auth";
import { AuthCard } from "@/app/(auth)/auth-card";
import { OnboardingForm } from "./onboarding-form";

export const metadata: Metadata = { title: "Configurar empresa" };

export default function OnboardingPage() {
  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-canvas">
      <div className="grid-frame pointer-events-none absolute inset-0" aria-hidden />
      <header className="relative z-10 flex h-16 items-center justify-between px-5 sm:px-8">
        <LyroLogo />
        <form action="/auth/signout" method="post">
          <button type="submit" className="cursor-pointer text-[13px] text-ink-3 hover:text-ink">
            Sair
          </button>
        </form>
      </header>
      <main className="relative z-10 flex flex-1 items-center justify-center px-4 pb-16">
        <AuthCard title="Quase lá." muted="Como se chama sua empresa?">
          <Suspense fallback={<FormSkeleton />}>
            <OnboardingGate />
          </Suspense>
        </AuthCard>
      </main>
    </div>
  );
}

/**
 * Só cria empresa quem ainda não está em nenhuma. Quem já tem time (ou um convite
 * pendente para o seu e-mail) vai direto para o app — evita empresas duplicadas.
 */
async function OnboardingGate() {
  const user = await getUser();
  if (!user) redirect("/login?next=/onboarding");
  const supabase = await getSupabase();

  const { data: memberships } = await supabase
    .from("organization_members")
    .select("organization:organizations(id)")
    .eq("user_id", user.id);
  if (memberships?.some((m) => m.organization)) redirect("/");

  const { data: joinedOrg } = await supabase.rpc("accept_pending_invites");
  if (joinedOrg) redirect("/");

  return (
    <>
      <OnboardingForm />
      <p className="mt-6 border-t border-line pt-5 text-[12.5px] leading-relaxed text-ink-3">
        Vai trabalhar no time de outra pessoa? Peça um convite para{" "}
        <span className="font-medium break-all text-ink-2">{user.email ?? "o seu e-mail"}</span> e recarregue esta página: você
        entra direto, sem criar outra empresa.
      </p>
    </>
  );
}

function FormSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-hidden>
      <div className="flex flex-col gap-1.5">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-10 w-full rounded-lg" />
      </div>
      <Skeleton className="h-[74px] w-full rounded-lg" />
      <Skeleton className="mt-1 h-10 w-full rounded-lg" />
    </div>
  );
}
