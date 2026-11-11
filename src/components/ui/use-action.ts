"use client";

import { useTransition, type FormEvent } from "react";
import { toast } from "sonner";
import type { ActionResult } from "@/lib/utils";

type Options = {
  success?: string;
  /** Não mostra o toast padrão de sucesso (quando o chamador mostra o seu). */
  silent?: boolean;
  onSuccess?: (result: Extract<ActionResult, { ok: true }> | undefined) => void;
};

/**
 * Executa uma Server Action dentro de uma transição e mostra o resultado em toast.
 * Diferente de <form action>, não limpa o formulário quando há erro de validação.
 */
export function useAction() {
  const [pending, startTransition] = useTransition();

  function run(fn: () => Promise<ActionResult | void>, options: Options = {}) {
    startTransition(async () => {
      try {
        const result = await fn();
        if (result && !result.ok) {
          toast.error(result.error);
          return;
        }
        const message = options.success ?? (result && result.ok ? result.message : undefined);
        if (message && !options.silent) toast.success(message);
        options.onSuccess?.(result ? (result as Extract<ActionResult, { ok: true }>) : undefined);
      } catch (error) {
        // Redirecionamentos de Server Actions são tratados pelo roteador
        if (error && typeof error === "object" && "digest" in error && String(error.digest).startsWith("NEXT_")) throw error;
        toast.error("Não foi possível concluir. Verifique sua conexão e tente novamente.");
      }
    });
  }

  function submit(fn: (formData: FormData) => Promise<ActionResult | void>, options: Options = {}) {
    return (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const formData = new FormData(event.currentTarget);
      run(() => fn(formData), options);
    };
  }

  return { pending, run, submit };
}
