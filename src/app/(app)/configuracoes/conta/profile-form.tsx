"use client";

import { useState, type ChangeEvent } from "react";
import { Smile } from "lucide-react";
import { firstName } from "@/lib/format";
import { Card, CardHeader } from "@/components/ui/misc";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/confirm";
import { useAction } from "@/components/ui/use-action";
import { FormFooter, SettingRow } from "../settings-ui";
import { updateProfile } from "../actions";

type Values = { full_name: string; preferred_name: string; job_title: string };

export function ProfileForm({
  initial,
  emailName,
  greeting,
}: {
  initial: Values;
  /** Começo do e-mail: enquanto o nome for só isso, a saudação não usa nome. */
  emailName: string;
  /** "Bom dia" / "Boa tarde" / "Boa noite", calculado no servidor. */
  greeting: string;
}) {
  const [values, setValues] = useState(initial);
  const { pending, submit } = useAction();

  const dirty = (Object.keys(initial) as (keyof Values)[]).some((key) => values[key].trim() !== initial[key]);
  const set = (key: keyof Values) => (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  // Mesma regra da tela inicial: nome preferido, senão o primeiro nome (se não for só o começo do e-mail)
  const fullName = values.full_name.trim();
  const hasRealName = Boolean(fullName) && fullName.toLowerCase() !== emailName.toLowerCase();
  const called = values.preferred_name.trim() || (hasRealName ? firstName(fullName) : "");

  return (
    <Card>
      <CardHeader title="Perfil" description="Como você aparece para o time e para os clientes." />
      <form onSubmit={submit(updateProfile)} className="divide-y divide-line border-t border-line">
        {!initial.full_name ? (
          <div className="flex items-start gap-3 bg-accent-soft/60 px-4 py-3 sm:px-5">
            <Smile className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
            <p className="text-[13px] leading-relaxed text-ink-2">
              Hoje o Lyra te chama de <span className="font-medium text-ink">{emailName}</span>, o começo do seu e-mail. Conte seu nome
              para o time saber quem é você e para a tela inicial te cumprimentar direito.
            </p>
          </div>
        ) : null}

        <SettingRow
          label="Nome completo"
          htmlFor="pf-name"
          description="Aparece para o time, como responsável por leads e clientes e nas propostas."
        >
          <Input
            id="pf-name"
            name="full_name"
            value={values.full_name}
            onChange={set("full_name")}
            required
            maxLength={120}
            autoComplete="name"
            placeholder="Nome e sobrenome"
          />
        </SettingRow>

        <SettingRow
          label="Como prefere ser chamado"
          htmlFor="pf-preferred"
          description="Usado na saudação da tela inicial. Em branco, usamos seu primeiro nome."
        >
          <Input
            id="pf-preferred"
            name="preferred_name"
            value={values.preferred_name}
            onChange={set("preferred_name")}
            maxLength={40}
            autoComplete="nickname"
            placeholder={hasRealName ? firstName(fullName) : "Apelido ou primeiro nome"}
          />
          <p className="mt-2.5 flex flex-wrap items-baseline gap-x-2 gap-y-1 text-xs text-ink-3">
            Na tela inicial:
            <span className="font-display text-[17px] leading-none text-ink">
              {greeting}
              {called ? `, ${called}.` : "!"}
            </span>
          </p>
        </SettingRow>

        <SettingRow label="Cargo" htmlFor="pf-title" description="Ajuda o time a saber quem faz o quê.">
          <Input
            id="pf-title"
            name="job_title"
            value={values.job_title}
            onChange={set("job_title")}
            maxLength={80}
            autoComplete="organization-title"
            placeholder="Ex.: Executivo de vendas"
          />
        </SettingRow>

        <FormFooter dirty={dirty}>
          {dirty ? (
            <Button size="sm" variant="ghost" onClick={() => setValues(initial)}>
              Descartar
            </Button>
          ) : null}
          <SubmitButton size="sm" pending={pending} disabled={!dirty}>
            Salvar alterações
          </SubmitButton>
        </FormFooter>
      </form>
    </Card>
  );
}
