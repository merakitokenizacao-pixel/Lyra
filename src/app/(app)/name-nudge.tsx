"use client";

import Link from "next/link";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/confirm";
import { useAction } from "@/components/ui/use-action";
import { updateProfile } from "./configuracoes/actions";

/** Tela inicial: enquanto o nome da pessoa for só o começo do e-mail, pergunta como chamá-la. */
export function NameNudge() {
  const { pending, submit } = useAction();

  return (
    <form
      onSubmit={submit(updateProfile, { success: "Prazer! Agora o Lyra sabe como te chamar." })}
      className="flex w-full max-w-md flex-col gap-2"
    >
      <div className="flex gap-2">
        <Input
          name="full_name"
          required
          maxLength={120}
          autoComplete="name"
          placeholder="Seu nome e sobrenome"
          aria-label="Seu nome e sobrenome"
          className="h-10 min-w-0 flex-1 text-sm"
        />
        <SubmitButton size="lg" pending={pending}>
          Salvar
        </SubmitButton>
      </div>
      <p className="text-xs text-ink-3">
        Aparece para o seu time. Apelido e cargo você ajusta em{" "}
        <Link href="/configuracoes/conta" className="font-medium text-ink-2 underline-offset-4 hover:text-accent hover:underline">
          Minha conta
        </Link>
        .
      </p>
    </form>
  );
}
