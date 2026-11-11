import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getSupabase } from "@/lib/auth";
import { canResetPasswordWithoutCurrent } from "@/lib/auth-flows";
import { Skeleton } from "@/components/ui/misc";
import { AuthCard } from "../auth-card";
import { NewPasswordForm, RecoveryLinkNeeded } from "./new-password-form";

export const metadata: Metadata = { title: "Nova senha" };

export default function NewPasswordPage() {
  return (
    <Suspense
      fallback={
        <AuthCard title="Crie sua senha nova." muted="E volte direto para o Lyra.">
          <FormSkeleton />
        </AuthCard>
      }
    >
      <NewPasswordGate />
    </Suspense>
  );
}

/**
 * Só cria senha sem pedir a atual quem acabou de abrir o link de recuperação.
 * Para os outros, a tela oferece um link novo (ou a troca em Minha conta).
 */
async function NewPasswordGate() {
  const supabase = await getSupabase();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) redirect("/recuperar-senha");
  const email = claims.email ?? "";

  if (!canResetPasswordWithoutCurrent(claims)) {
    return (
      <AuthCard title="Vamos confirmar que é você." muted="É rapidinho.">
        <RecoveryLinkNeeded email={email} />
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Crie sua senha nova." muted="E volte direto para o Lyra.">
      <NewPasswordForm email={email} />
    </AuthCard>
  );
}

function FormSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-hidden>
      <Skeleton className="h-10 w-full rounded-lg" />
      <div className="flex flex-col gap-1.5">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-full rounded-lg" />
      </div>
      <div className="flex flex-col gap-1.5">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-10 w-full rounded-lg" />
      </div>
      <Skeleton className="mt-1 h-10 w-full rounded-lg" />
    </div>
  );
}
