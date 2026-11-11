"use client";

import { useState, type ReactNode } from "react";
import { KeyRound, LogOut, Mail, MailWarning, type LucideIcon } from "lucide-react";
import { sendMyPasswordResetLink } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/confirm";
import { Field, Input } from "@/components/ui/input";
import { Card, CardHeader } from "@/components/ui/misc";
import { PasswordInput } from "@/components/ui/password-input";
import { useAction } from "@/components/ui/use-action";
import { PASSWORD_MIN } from "@/lib/password";
import { SettingRow } from "../settings-ui";
import { changeEmail, changePassword } from "./actions";

/** Troca de e-mail pedida e ainda não confirmada. `since` já vem formatado do servidor. */
export type PendingEmailChange = { email: string; since: string } | null;

export function SecurityCard({ email, pendingEmail }: { email: string; pendingEmail: PendingEmailChange }) {
  return (
    <Card id="acesso" className="scroll-mt-20 lg:scroll-mt-24">
      <CardHeader title="Acesso e segurança" description="Como você entra no Lyra. Vale para todas as suas empresas." />
      <div className="divide-y divide-line border-t border-line">
        <EmailSetting email={email} pending={pendingEmail} />
        <PasswordSetting email={email} />
        <SettingRow label="Sessão" description="Sair desconecta só este navegador.">
          <form action="/auth/signout" method="post">
            <Button type="submit">
              <LogOut />
              Sair da conta
            </Button>
          </form>
        </SettingRow>
      </div>
    </Card>
  );
}

function EmailSetting({ email, pending }: { email: string; pending: PendingEmailChange }) {
  const [editing, setEditing] = useState(false);
  const { pending: saving, submit } = useAction();

  return (
    <SettingRow
      label="E-mail de acesso"
      description="É com ele que você entra. Também aparece como contato nas propostas que você envia."
    >
      {editing ? (
        <form onSubmit={submit(changeEmail, { onSuccess: () => setEditing(false) })} className="flex flex-col gap-3">
          <Field label="E-mail novo" htmlFor="acc-new-email">
            <Input
              id="acc-new-email"
              name="email"
              type="email"
              required
              autoFocus
              autoComplete="email"
              defaultValue={pending?.email}
              placeholder="voce@empresa.com.br"
            />
          </Field>
          <Field label="Senha atual" htmlFor="acc-email-password" hint="Confirma que é você mesmo pedindo a troca.">
            <PasswordInput id="acc-email-password" name="current_password" required autoComplete="current-password" />
          </Field>
          <p className="text-xs leading-relaxed text-ink-3">
            Mandamos um link para o e-mail atual e outro para o novo. A troca só acontece depois que você abrir os dois, neste
            navegador.
          </p>
          <EditActions onCancel={() => setEditing(false)}>
            <SubmitButton size="sm" pending={saving}>
              Enviar confirmação
            </SubmitButton>
          </EditActions>
        </form>
      ) : (
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center gap-2">
            <ValueBox icon={Mail}>{email}</ValueBox>
            <Button aria-label="Alterar e-mail" onClick={() => setEditing(true)}>
              Alterar
            </Button>
          </div>
          {pending ? (
            <div className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50/70 px-3 py-2.5">
              <MailWarning className="mt-0.5 size-4 shrink-0 text-amber-600" aria-hidden />
              <div className="min-w-0 text-[12.5px] leading-relaxed text-amber-900">
                <p>
                  Troca para <strong className="font-medium break-all">{pending.email}</strong> esperando confirmação.
                </p>
                <p className="mt-0.5 text-amber-800">
                  Pedido em {pending.since}. Abra os links que mandamos para os dois e-mails. Não chegou?{" "}
                  <button
                    type="button"
                    onClick={() => setEditing(true)}
                    className="cursor-pointer font-medium underline underline-offset-2 hover:text-amber-950"
                  >
                    Pedir de novo
                  </button>
                </p>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </SettingRow>
  );
}

function PasswordSetting({ email }: { email: string }) {
  const [editing, setEditing] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const save = useAction();
  const resetLink = useAction();
  const mismatch = confirmation.length > 0 && confirmation !== password;

  function close() {
    setEditing(false);
    setPassword("");
    setConfirmation("");
  }

  return (
    <SettingRow label="Senha" description="Use uma senha forte, que você não repete em outros sites.">
      {editing ? (
        <form onSubmit={save.submit(changePassword, { onSuccess: close })} className="flex flex-col gap-3">
          {/* Ajuda o gerenciador de senhas a atualizar a senha da conta certa */}
          <input type="email" name="username" autoComplete="username" value={email} readOnly hidden />
          <Field label="Senha atual" htmlFor="acc-current-password">
            <PasswordInput id="acc-current-password" name="current_password" required autoFocus autoComplete="current-password" />
          </Field>
          <Field label="Senha nova" htmlFor="acc-new-password" hint={`Mínimo de ${PASSWORD_MIN} caracteres.`}>
            <PasswordInput
              id="acc-new-password"
              name="password"
              required
              minLength={PASSWORD_MIN}
              maxLength={72}
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </Field>
          <Field label="Repita a senha nova" htmlFor="acc-confirm-password" error={mismatch ? "As senhas não são iguais." : null}>
            <PasswordInput
              id="acc-confirm-password"
              name="confirm_password"
              required
              maxLength={72}
              autoComplete="new-password"
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              aria-invalid={mismatch || undefined}
            />
          </Field>
          <EditActions
            onCancel={close}
            extra={
              <button
                type="button"
                disabled={resetLink.pending}
                onClick={() => resetLink.run(sendMyPasswordResetLink)}
                className="cursor-pointer text-left text-xs font-medium text-ink-3 underline-offset-4 hover:text-accent hover:underline disabled:cursor-default disabled:opacity-60"
              >
                {resetLink.pending ? "Enviando link…" : "Esqueceu a senha atual?"}
              </button>
            }
          >
            <SubmitButton size="sm" pending={save.pending}>
              Salvar senha nova
            </SubmitButton>
          </EditActions>
        </form>
      ) : (
        <div className="flex items-center gap-2">
          <ValueBox icon={KeyRound}>
            <span className="sr-only">Senha definida</span>
            <span aria-hidden className="tracking-[0.2em]">
              ••••••••••
            </span>
          </ValueBox>
          <Button aria-label="Alterar senha" onClick={() => setEditing(true)}>
            Alterar
          </Button>
        </div>
      )}
    </SettingRow>
  );
}

/** Valor atual, só leitura, no mesmo tamanho dos campos. */
function ValueBox({ icon: Icon, children }: { icon: LucideIcon; children: ReactNode }) {
  return (
    <div className="flex h-8 min-w-0 flex-1 items-center gap-2 rounded-lg border border-line bg-subtle px-2.5 text-[13px] text-ink-2">
      <Icon className="size-3.5 shrink-0 text-ink-4" aria-hidden />
      <span className="min-w-0 flex-1 truncate">{children}</span>
    </div>
  );
}

function EditActions({ onCancel, extra, children }: { onCancel: () => void; extra?: ReactNode; children: ReactNode }) {
  return (
    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-2">
      {extra}
      <div className="ml-auto flex items-center gap-2">
        <Button size="sm" variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
        {children}
      </div>
    </div>
  );
}
