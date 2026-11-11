"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { useAction } from "@/components/ui/use-action";
import { PASSWORD_MIN } from "@/lib/password";
import { sendMyPasswordResetLink, setNewPassword } from "../actions";

export function NewPasswordForm({ email }: { email: string }) {
  const router = useRouter();
  const { pending, submit } = useAction();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const mismatch = confirmation.length > 0 && confirmation !== password;

  return (
    <form onSubmit={submit(setNewPassword, { onSuccess: () => router.replace("/") })} className="flex flex-col gap-4">
      <p className="text-[13px] leading-relaxed text-ink-3">
        Para a conta <strong className="font-medium break-all text-ink-2">{email}</strong>. Escolha uma senha que você não usa em
        outros sites.
      </p>
      {/* Ajuda o gerenciador de senhas a guardar a senha nova na conta certa */}
      <input type="email" name="username" autoComplete="username" value={email} readOnly hidden />
      <Field label="Senha nova" htmlFor="np-password" hint={`Mínimo de ${PASSWORD_MIN} caracteres.`}>
        <PasswordInput
          id="np-password"
          name="password"
          autoComplete="new-password"
          required
          minLength={PASSWORD_MIN}
          maxLength={72}
          autoFocus
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="h-10"
        />
      </Field>
      <Field label="Repita a senha nova" htmlFor="np-confirm" error={mismatch ? "As senhas não são iguais." : null}>
        <PasswordInput
          id="np-confirm"
          name="confirm_password"
          autoComplete="new-password"
          required
          maxLength={72}
          value={confirmation}
          onChange={(event) => setConfirmation(event.target.value)}
          aria-invalid={mismatch || undefined}
          className="h-10"
        />
      </Field>
      <Button type="submit" variant="primary" size="lg" disabled={pending} className="mt-1 w-full">
        {pending ? <Loader2 className="animate-spin" /> : null}
        Salvar senha nova
        {!pending ? <ArrowRight /> : null}
      </Button>
    </form>
  );
}

/** Sem um link de recuperação recente: manda outro para o e-mail da conta. */
export function RecoveryLinkNeeded({ email }: { email: string }) {
  const { pending, run } = useAction();
  const [sent, setSent] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      <p className="text-[13px] leading-relaxed text-ink-3">
        Para criar uma senha sem informar a atual, confirme pelo link que vamos mandar para{" "}
        <strong className="font-medium break-all text-ink-2">{email}</strong>. Abra o link neste navegador: por segurança, ele
        vale por pouco tempo.
      </p>
      {sent ? (
        <p
          role="status"
          className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-[13px] text-emerald-800"
        >
          <MailCheck className="mt-0.5 size-4 shrink-0" aria-hidden />
          Link enviado. Confira sua caixa de entrada.
        </p>
      ) : null}
      <Button
        variant="primary"
        size="lg"
        disabled={pending}
        className="w-full"
        onClick={() => run(sendMyPasswordResetLink, { silent: true, onSuccess: () => setSent(true) })}
      >
        {pending ? <Loader2 className="animate-spin" /> : null}
        {sent ? "Enviar outro link" : "Enviar link"}
      </Button>
      <p className="text-center text-[13px] text-ink-3">
        Lembra a senha atual?{" "}
        <Link href="/configuracoes/conta#acesso" className="font-medium text-ink underline-offset-4 hover:underline">
          Troque em Minha conta
        </Link>
      </p>
    </div>
  );
}
