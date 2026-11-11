"use client";

import { ChevronRight, Link2, Mail, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { ROLE_LABEL, type MemberRole } from "@/lib/constants";
import { firstName, formatDate } from "@/lib/format";
import { Avatar, Card, CardHeader, Count } from "@/components/ui/misc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { ConfirmDialog, SubmitButton } from "@/components/ui/confirm";
import { useAction } from "@/components/ui/use-action";
import { DotGlyph } from "@/components/brand";
import { inviteMember, removeMember, revokeInvite, updateMemberRole } from "../actions";

type Member = { id: string; name: string; email: string | null; jobTitle: string | null; role: MemberRole; joinedAt: string };
type Invite = { id: string; email: string; role: MemberRole; createdAt: string; invitedBy: string | null };

const ROLE_HELP: Record<MemberRole, string> = {
  owner: "Criou a empresa no Lyra. Tem acesso a tudo e não pode ser removido.",
  admin: "Altera os dados da empresa e as etapas do pipeline e gerencia o time.",
  member: "Trabalha com leads, clientes, propostas e produtos.",
};

/** O Lyra não envia e-mail de convite: o link abre o cadastro com o e-mail já preenchido. */
async function copyInviteLink(email: string) {
  try {
    await navigator.clipboard.writeText(`${window.location.origin}/signup?convite=1&email=${encodeURIComponent(email)}`);
    return true;
  } catch {
    return false;
  }
}

export function TeamSection({
  members,
  invites,
  currentUserId,
  canManage,
}: {
  members: Member[];
  invites: Invite[];
  currentUserId: string;
  canManage: boolean;
}) {
  const action = useAction();
  const invite = useAction();
  const alone = members.length === 1 && invites.length === 0;

  return (
    <Card>
      <CardHeader
        title="Time"
        description="Quem tem acesso aos leads, clientes e propostas desta empresa."
        action={
          <Count>
            {members.length} {members.length === 1 ? "pessoa" : "pessoas"}
          </Count>
        }
      />

      <ul className="divide-y divide-line border-t border-line">
        {members.map((member) => {
          const you = member.id === currentUserId;
          const editable = canManage && member.role !== "owner" && !you;
          return (
            <li key={member.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3 sm:px-5">
              <Avatar name={member.name} />
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 text-[13.5px] font-medium text-ink">
                  <span className="truncate">{member.name}</span>
                  {you ? (
                    <span className="shrink-0 rounded-full bg-hover px-1.5 py-px text-[10.5px] font-medium text-ink-3">você</span>
                  ) : null}
                </p>
                <p className="truncate text-xs text-ink-3">{[member.jobTitle, member.email].filter(Boolean).join(" · ")}</p>
              </div>
              <span className="hidden shrink-0 text-xs text-ink-4 md:block">No time desde {formatDate(member.joinedAt)}</span>
              {editable ? (
                <div className="flex shrink-0 items-center gap-1">
                  <Select
                    value={member.role}
                    disabled={action.pending}
                    onChange={(e) => action.run(() => updateMemberRole(member.id, e.target.value as MemberRole))}
                    className="w-36"
                    aria-label={`Papel de ${member.name}`}
                  >
                    <option value="admin">{ROLE_LABEL.admin}</option>
                    <option value="member">{ROLE_LABEL.member}</option>
                  </Select>
                  <ConfirmDialog
                    title={`Remover ${member.name} do time?`}
                    description="A pessoa perde o acesso a esta empresa no Lyra. Leads, clientes e propostas que ela criou continuam aqui."
                    confirmLabel="Remover"
                    action={() => removeMember(member.id)}
                    trigger={
                      <Button size="icon-sm" variant="ghost" title="Remover do time" aria-label={`Remover ${member.name} do time`}>
                        <Trash2 />
                      </Button>
                    }
                  />
                </div>
              ) : (
                <Badge tone={member.role === "owner" ? "dark" : "muted"}>{ROLE_LABEL[member.role]}</Badge>
              )}
            </li>
          );
        })}

        {invites.map((item) => (
          <li key={item.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3 sm:px-5">
            <span className="grid size-8 shrink-0 place-items-center rounded-full border border-dashed border-line-strong text-ink-4">
              <Mail className="size-3.5" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13.5px] text-ink-2">{item.email}</p>
              <p className="truncate text-xs text-ink-3">
                Convite pendente · {ROLE_LABEL[item.role]} · {item.invitedBy ? `por ${firstName(item.invitedBy)} ` : ""}em{" "}
                {formatDate(item.createdAt)}
              </p>
            </div>
            {canManage ? (
              <div className="flex shrink-0 items-center gap-1">
                <Button
                  size="xs"
                  onClick={() =>
                    void copyInviteLink(item.email).then((copied) =>
                      copied ? toast.success("Link do convite copiado") : toast.error("Não foi possível copiar o link."),
                    )
                  }
                >
                  <Link2 className="size-3.5" />
                  Copiar link
                </Button>
                <Button size="xs" variant="ghost" disabled={action.pending} onClick={() => action.run(() => revokeInvite(item.id))}>
                  Cancelar
                </Button>
              </div>
            ) : null}
          </li>
        ))}
      </ul>

      {alone ? (
        <div className="flex items-center gap-3 border-t border-dashed border-line px-4 py-4 sm:px-5">
          <DotGlyph name="clients" tone="muted" className="size-9 shrink-0" />
          <p className="text-[13px] leading-relaxed text-ink-3">
            Por enquanto é só você por aqui.
            {canManage ? " Convide quem trabalha com você para dividir leads, clientes e propostas." : null}
          </p>
        </div>
      ) : null}

      {canManage ? (
        <form
          onSubmit={(event) => {
            const form = event.currentTarget;
            const email = String(new FormData(form).get("email") ?? "").trim().toLowerCase();
            invite.submit(inviteMember, {
              silent: true,
              onSuccess: () => {
                form.reset();
                void copyInviteLink(email).then((copied) =>
                  copied
                    ? toast.success("Convite criado e link copiado. É só enviar para a pessoa.")
                    : toast.success("Convite criado. Use “Copiar link” para enviar à pessoa."),
                );
              },
            })(event);
          }}
          className="border-t border-line bg-subtle px-4 py-4 sm:px-5"
        >
          <p className="text-[13px] font-medium text-ink">Convidar para o time</p>
          <p className="mt-0.5 text-xs leading-relaxed text-ink-3">
            O Lyra cria um link de convite: envie para a pessoa por e-mail ou WhatsApp. Ela entra no time assim que criar a conta com
            este e-mail.
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-[minmax(0,1fr)_150px_auto]">
            <Input name="email" type="email" required placeholder="nome@empresa.com.br" aria-label="E-mail da pessoa" />
            <Select name="role" defaultValue="member" aria-label="Papel da pessoa">
              <option value="member">{ROLE_LABEL.member}</option>
              <option value="admin">{ROLE_LABEL.admin}</option>
            </Select>
            <SubmitButton pending={invite.pending}>
              {invite.pending ? null : <UserPlus />}
              Convidar
            </SubmitButton>
          </div>
        </form>
      ) : null}

      <details className="group border-t border-line">
        <summary className="flex cursor-pointer list-none items-center gap-1.5 rounded-b-xl px-4 py-3 text-xs font-medium text-ink-3 select-none hover:text-ink sm:px-5 [&::-webkit-details-marker]:hidden">
          <ChevronRight className="size-3.5 transition-transform group-open:rotate-90" aria-hidden />O que cada papel pode fazer
        </summary>
        <dl className="grid gap-px border-t border-line bg-line sm:grid-cols-3">
          {(["owner", "admin", "member"] as const).map((role) => (
            <div key={role} className="bg-panel px-4 py-3 last:rounded-b-xl sm:px-5 sm:first:rounded-bl-xl sm:last:rounded-bl-none">
              <dt className="text-xs font-medium text-ink-2">{ROLE_LABEL[role]}</dt>
              <dd className="mt-0.5 text-xs leading-relaxed text-ink-3">{ROLE_HELP[role]}</dd>
            </div>
          ))}
        </dl>
      </details>
    </Card>
  );
}
