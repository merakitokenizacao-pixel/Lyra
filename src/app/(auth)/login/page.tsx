import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { AuthCard } from "../auth-card";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Entrar" };

export default function LoginPage() {
  return (
    <AuthCard title="Bem-vindo de volta." muted="Entre para continuar.">
      <Suspense fallback={<div className="h-[188px]" />}>
        <LoginForm />
      </Suspense>
      <p className="mt-6 text-center text-[13px] text-ink-3">
        Ainda não tem conta?{" "}
        <Link href="/signup" className="font-medium text-ink underline-offset-4 hover:underline">
          Criar conta
        </Link>
      </p>
    </AuthCard>
  );
}
