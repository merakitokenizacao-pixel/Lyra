"use client";

import { useActionState, useState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Input } from "@/components/ui/input";
import { createOrganization } from "./actions";

export function OnboardingForm() {
  const [state, action, pending] = useActionState(createOrganization, null);
  // Fica travado depois do envio até a navegação terminar (no dev, compilar "/" pode levar alguns segundos).
  // Guarda o estado do momento do envio: se a action devolver um erro, o estado muda e o botão destrava.
  const [submittedWith, setSubmittedWith] = useState<{ state: typeof state } | null>(null);
  const busy = pending || submittedWith?.state === state;

  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (busy) {
          event.preventDefault();
          return;
        }
        setSubmittedWith({ state });
      }}
      className="flex flex-col gap-4"
    >
      {state?.error ? (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700">
          {state.error}
        </p>
      ) : null}
      <Field label="Nome da empresa" htmlFor="org-name">
        <Input id="org-name" name="name" required autoFocus placeholder="Ex.: Acme Consultoria" className="h-10" maxLength={120} />
      </Field>
      <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-line bg-subtle px-3 py-3">
        <Checkbox name="demo" defaultChecked className="mt-0.5" />
        <span>
          <span className="block text-[13px] font-medium text-ink">Começar com dados de exemplo</span>
          <span className="block text-xs text-ink-3">
            12 leads, 6 clientes, 3 propostas e um catálogo fictícios para explorar o Lyra. Você pode excluí-los depois.
          </span>
        </span>
      </label>
      <Button type="submit" variant="primary" size="lg" disabled={busy} className="mt-1 w-full">
        {busy ? <Loader2 className="animate-spin" /> : null}
        {busy ? "Preparando seu espaço…" : "Criar meu espaço"}
        {!busy ? <ArrowRight /> : null}
      </Button>
      <p className="text-center text-xs text-ink-4">Criamos o pipeline “Qualificação de leads” com 7 etapas prontas para usar.</p>
    </form>
  );
}
