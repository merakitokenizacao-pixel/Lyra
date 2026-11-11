import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { AuthCard } from "../auth-card";
import { SignupForm } from "./signup-form";

export const metadata: Metadata = { title: "Criar conta" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SignupPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <Suspense fallback={<SignupCard />}>
      <InviteAwareSignup searchParams={searchParams} />
    </Suspense>
  );
}

/** O link de convite (Configurações › Empresa e time) traz ?convite=1&email=… */
async function InviteAwareSignup({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const email = typeof params.email === "string" ? params.email.trim().toLowerCase().slice(0, 254) : "";
  const invited = params.convite === "1" && EMAIL.test(email);
  return <SignupCard invitedEmail={invited ? email : undefined} />;
}

function SignupCard({ invitedEmail }: { invitedEmail?: string }) {
  return (
    <AuthCard
      title={invitedEmail ? "Seu time te espera." : "Comece com o Lyro."}
      muted={invitedEmail ? "Crie sua conta para entrar." : "Leva menos de um minuto."}
    >
      <SignupForm invitedEmail={invitedEmail} />
      <p className="mt-6 text-center text-[13px] text-ink-3">
        Já tem conta?{" "}
        <Link href="/login" className="font-medium text-ink underline-offset-4 hover:underline">
          Entrar
        </Link>
      </p>
    </AuthCard>
  );
}
