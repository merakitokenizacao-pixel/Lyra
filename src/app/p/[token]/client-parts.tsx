"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Printer, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/input";
import { useAction } from "@/components/ui/use-action";
import { markViewed, respondToProposal } from "./actions";

export function MarkViewed({ token }: { token: string }) {
  const done = useRef(false);
  useEffect(() => {
    if (done.current) return;
    done.current = true;
    void markViewed(token);
  }, [token]);
  return null;
}

export function PrintButton() {
  return (
    <Button variant="secondary" size="sm" onClick={() => window.print()}>
      <Printer />
      Imprimir / PDF
    </Button>
  );
}

export function RespondForm({ token }: { token: string }) {
  const [choice, setChoice] = useState<"accept" | "reject" | null>(null);
  const { pending, run } = useAction();

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        // O botão que enviou o formulário define a decisão (evita depender de estado assíncrono)
        const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
        if (!submitter) return;
        const accept = submitter.value === "accept";
        const formData = new FormData(event.currentTarget);
        setChoice(accept ? "accept" : "reject");
        run(() => respondToProposal(token, accept, formData));
      }}
      className="flex flex-col gap-4"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Seu nome" htmlFor="r-name">
          <Input
            id="r-name"
            name="name"
            required
            autoComplete="name"
            placeholder="Nome e sobrenome"
            className="h-10"
            onKeyDown={(e) => {
              // A decisão exige um clique explícito em Aceitar ou Recusar
              if (e.key === "Enter") e.preventDefault();
            }}
          />
        </Field>
        <Field label="Comentário (opcional)" htmlFor="r-comment">
          <Textarea id="r-comment" name="comment" rows={1} className="min-h-10" placeholder="Alguma observação?" />
        </Field>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row-reverse">
        <Button type="submit" name="decision" value="accept" variant="primary" size="lg" disabled={pending} className="sm:min-w-48">
          <Check />
          {pending && choice === "accept" ? "Registrando…" : "Aceitar proposta"}
        </Button>
        <Button type="submit" name="decision" value="reject" variant="secondary" size="lg" disabled={pending}>
          <X />
          {pending && choice === "reject" ? "Registrando…" : "Recusar"}
        </Button>
      </div>
      <p className="text-xs text-ink-4">
        Ao aceitar, registramos seu nome, data e horário como confirmação do aceite desta proposta.
      </p>
    </form>
  );
}
