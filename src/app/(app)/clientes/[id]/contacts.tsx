"use client";

import { useState } from "react";
import { Mail, Phone, Plus, Star, Trash2, UsersRound } from "lucide-react";
import { Card, CardHeader, EmptyState, Avatar } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Input } from "@/components/ui/input";
import { Dialog, DialogBody, DialogClose, DialogContent, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { SubmitButton } from "@/components/ui/confirm";
import { useAction } from "@/components/ui/use-action";
import { addContact, deleteContact } from "../actions";

type Contact = {
  id: string;
  name: string;
  job_title: string | null;
  email: string | null;
  phone: string | null;
  is_primary: boolean;
};

export function ContactsCard({ clientId, contacts }: { clientId: string; contacts: Contact[] }) {
  const [open, setOpen] = useState(false);
  const { pending, submit } = useAction();
  const remove = useAction();

  return (
    <Card>
      <CardHeader
        title="Contatos"
        icon={<UsersRound />}
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="xs" variant="ghost">
                <Plus />
                Adicionar
              </Button>
            </DialogTrigger>
            <DialogContent title="Novo contato" size="sm">
              <form onSubmit={submit((fd) => addContact(clientId, fd), { onSuccess: () => setOpen(false) })}>
                <DialogBody>
                  <Field label="Nome *" htmlFor="ct-name">
                    <Input id="ct-name" name="name" required autoFocus />
                  </Field>
                  <Field label="Cargo" htmlFor="ct-job">
                    <Input id="ct-job" name="job_title" />
                  </Field>
                  <Field label="E-mail" htmlFor="ct-email">
                    <Input id="ct-email" name="email" type="email" />
                  </Field>
                  <Field label="Telefone" htmlFor="ct-phone">
                    <Input id="ct-phone" name="phone" />
                  </Field>
                  <label className="flex items-center gap-2 text-[13px] text-ink-2">
                    <Checkbox name="is_primary" defaultChecked={contacts.length === 0} />
                    Contato principal
                  </label>
                </DialogBody>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="secondary">Cancelar</Button>
                  </DialogClose>
                  <SubmitButton pending={pending}>Adicionar contato</SubmitButton>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />
      {contacts.length === 0 ? (
        <EmptyState className="py-6" title="Nenhum contato" description="Adicione as pessoas com quem você fala neste cliente." />
      ) : (
        <ul className="divide-y divide-line border-t border-line">
          {contacts.map((c) => (
            <li key={c.id} className="group flex items-start gap-2.5 px-4 py-3">
              <Avatar name={c.name} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 text-[13px] font-medium text-ink">
                  <span className="truncate">{c.name}</span>
                  {c.is_primary ? <Star className="size-3 shrink-0 fill-amber-400 text-amber-400" aria-label="Principal" /> : null}
                </p>
                {c.job_title ? <p className="text-xs text-ink-3">{c.job_title}</p> : null}
                <div className="mt-1 flex flex-col gap-0.5 text-xs">
                  {c.email ? (
                    <a href={`mailto:${c.email}`} className="inline-flex items-center gap-1.5 text-ink-2 hover:text-accent">
                      <Mail className="size-3 text-ink-4" />
                      <span className="truncate">{c.email}</span>
                    </a>
                  ) : null}
                  {c.phone ? (
                    <a href={`tel:${c.phone.replace(/[^\d+]/g, "")}`} className="inline-flex items-center gap-1.5 text-ink-2 hover:text-accent">
                      <Phone className="size-3 text-ink-4" />
                      {c.phone}
                    </a>
                  ) : null}
                </div>
              </div>
              <button
                type="button"
                title="Remover contato"
                disabled={remove.pending}
                onClick={() => remove.run(() => deleteContact(c.id))}
                className="grid size-6 cursor-pointer place-items-center rounded-md text-ink-4 opacity-0 group-hover:opacity-100 hover:bg-hover hover:text-danger focus-visible:opacity-100"
              >
                <Trash2 className="size-3.5" />
                <span className="sr-only">Remover</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
