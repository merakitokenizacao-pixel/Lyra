"use client";

import { useActionState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowRight, CircleCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Label } from "@/components/ui/input";
import { signIn } from "../actions";

const MESSAGES: Record<string, string> = {
  confirmed: "E-mail confirmado. Entre com sua senha.",
  link_invalid: "O link expirou ou já foi usado. Entre ou peça um novo cadastro.",
  signed_out: "Você saiu da sua conta.",
};

export function LoginForm() {
  const params = useSearchParams();
  const [state, action, pending] = useActionState(signIn, null);
  const message = MESSAGES[params.get("message") ?? ""];

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="next" value={params.get("next") ?? "/"} />
      {message && !state?.error ? (
        <p className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-[13px] text-emerald-800">
          <CircleCheck className="mt-0.5 size-4 shrink-0" />
          {message}
        </p>
      ) : null}
      {state?.error ? (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700">
          {state.error}
        </p>
      ) : null}
      <Field label="E-mail" htmlFor="email">
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          defaultValue={state?.email}
          placeholder="voce@empresa.com.br"
          className="h-10"
        />
      </Field>
      <div className="flex flex-col gap-1.5">
        <div className="flex items-baseline justify-between gap-3">
          <Label htmlFor="password">Senha</Label>
          <Link
            href="/recuperar-senha"
            className="text-[12.5px] text-ink-3 underline-offset-4 hover:text-ink hover:underline"
          >
            Esqueceu a senha?
          </Link>
        </div>
        <Input id="password" name="password" type="password" autoComplete="current-password" required className="h-10" />
      </div>
      <Button type="submit" variant="primary" size="lg" disabled={pending} className="mt-1 w-full">
        {pending ? <Loader2 className="animate-spin" /> : null}
        Entrar
        {!pending ? <ArrowRight /> : null}
      </Button>
    </form>
  );
}
