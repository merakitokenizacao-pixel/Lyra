import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { AuthCard } from "../auth-card";
import { RecoveryForm } from "./recovery-form";

export const metadata: Metadata = { title: "Recuperar senha" };

export default function RecoverPasswordPage() {
  return (
    <AuthCard title="Esqueceu a senha?" muted="A gente te ajuda a voltar.">
      <Suspense fallback={<div className="h-[164px]" />}>
        <RecoveryForm />
      </Suspense>
      <p className="mt-6 text-center text-[13px] text-ink-3">
        Lembrou?{" "}
        <Link href="/login" className="font-medium text-ink underline-offset-4 hover:underline">
          Voltar para o login
        </Link>
      </p>
    </AuthCard>
  );
}
