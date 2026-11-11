"use client";

import { useActionState } from "react";
import { ArrowRight, Loader2, MailCheck, UsersRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { PASSWORD_MIN } from "@/lib/password";
import { signUp } from "../actions";

/** `invitedEmail` vem do link de convite: a conta criada com ele entra direto no time. */
export function SignupForm({ invitedEmail }: { invitedEmail?: string }) {
  const [state, action, pending] = useActionState(signUp, null);

  if (state?.sent) {
    return (
      <div className="flex flex-col items-start gap-3">
        <span className="grid size-10 place-items-center rounded-full bg-accent-soft text-accent">
          <MailCheck className="size-5" />
        </span>
        <p className="text-[14px] font-medium text-ink">Confira seu e-mail</p>
        <p className="text-[13px] text-ink-3">
          Enviamos um link de confirmação para <strong className="font-medium text-ink-2">{state.email}</strong>. Depois de
          confirmar, volte aqui e entre com sua senha.
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-4">
      {state?.error ? (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700">
          {state.error}
        </p>
      ) : invitedEmail ? (
        <div className="flex items-start gap-2.5 rounded-lg bg-accent-soft/70 px-3 py-2.5">
          <UsersRound className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
          <p className="text-[13px] leading-relaxed text-ink-2">
            Você foi convidado para um time no Lyro. Crie sua conta com o e-mail do convite e você entra direto, sem configurar
            nada.
          </p>
        </div>
      ) : null}
      <Field label="Seu nome" htmlFor="full_name">
        <Input id="full_name" name="full_name" autoComplete="name" required placeholder="Nome e sobrenome" className="h-10" />
      </Field>
      <Field label="E-mail de trabalho" htmlFor="email">
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          defaultValue={state?.email ?? invitedEmail}
          placeholder="voce@empresa.com.br"
          className="h-10"
        />
      </Field>
      <Field label="Senha" htmlFor="password" hint={`Mínimo de ${PASSWORD_MIN} caracteres.`}>
        <Input id="password" name="password" type="password" autoComplete="new-password" minLength={PASSWORD_MIN} required className="h-10" />
      </Field>
      <Button type="submit" variant="primary" size="lg" disabled={pending} className="mt-1 w-full">
        {pending ? <Loader2 className="animate-spin" /> : null}
        Criar conta
        {!pending ? <ArrowRight /> : null}
      </Button>
    </form>
  );
}
