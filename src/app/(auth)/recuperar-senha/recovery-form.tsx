"use client";

import { useActionState, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowRight, Loader2, MailCheck, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { requestPasswordReset } from "../actions";

/** Remonta o formulário a cada novo pedido, para "pedir de novo" voltar ao campo de e-mail. */
export function RecoveryForm() {
  const [attempt, setAttempt] = useState({ key: 0, email: "" });
  return (
    <RecoveryAttempt
      key={attempt.key}
      defaultEmail={attempt.email}
      onRetry={(email) => setAttempt((prev) => ({ key: prev.key + 1, email }))}
    />
  );
}

function RecoveryAttempt({ defaultEmail, onRetry }: { defaultEmail: string; onRetry: (email: string) => void }) {
  const params = useSearchParams();
  const [state, action, pending] = useActionState(requestPasswordReset, null);

  if (state?.sent) {
    return (
      <div className="flex flex-col items-start gap-3" role="status">
        <span className="grid size-10 place-items-center rounded-full bg-accent-soft text-accent">
          <MailCheck className="size-5" />
        </span>
        <p className="text-[14px] font-medium text-ink">Confira seu e-mail</p>
        <p className="text-[13px] leading-relaxed text-ink-3">
          Se existir uma conta com <strong className="font-medium break-all text-ink-2">{state.email}</strong>, você vai receber
          um link para criar uma senha nova. Abra o link <strong className="font-medium text-ink-2">neste mesmo navegador</strong>.
        </p>
        <p className="text-[12.5px] text-ink-3">
          Não chegou em alguns minutos? Veja a caixa de spam ou{" "}
          <button
            type="button"
            onClick={() => onRetry(state.email ?? "")}
            className="cursor-pointer font-medium text-ink-2 underline-offset-4 hover:text-ink hover:underline"
          >
            peça de novo
          </button>
          .
        </p>
      </div>
    );
  }

  const linkFailed = params.get("erro") === "link";

  return (
    <form action={action} className="flex flex-col gap-4">
      {state?.error ? (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700">
          {state.error}
        </p>
      ) : linkFailed ? (
        <p className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-[13px] leading-relaxed text-amber-900">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>
            Esse link não vale mais. Ele expira depois de um tempo, só funciona uma vez e precisa ser aberto no mesmo navegador em
            que você pediu. Peça um novo abaixo.
          </span>
        </p>
      ) : (
        <p className="text-[13px] leading-relaxed text-ink-3">
          Informe o e-mail da sua conta. Enviamos um link para você criar uma senha nova.
        </p>
      )}
      <Field label="E-mail" htmlFor="email">
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          defaultValue={state?.email ?? defaultEmail}
          placeholder="voce@empresa.com.br"
          className="h-10"
        />
      </Field>
      <Button type="submit" variant="primary" size="lg" disabled={pending} className="mt-1 w-full">
        {pending ? <Loader2 className="animate-spin" /> : null}
        Enviar link
        {!pending ? <ArrowRight /> : null}
      </Button>
    </form>
  );
}
