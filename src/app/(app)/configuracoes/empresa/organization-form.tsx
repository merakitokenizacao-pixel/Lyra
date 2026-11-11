"use client";

import { useState } from "react";
import { Card, CardHeader } from "@/components/ui/misc";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/confirm";
import { useAction } from "@/components/ui/use-action";
import { FormFooter, SettingRow } from "../settings-ui";
import { updateOrganization } from "../actions";

export function OrganizationForm({ name, canEdit }: { name: string; canEdit: boolean }) {
  const [value, setValue] = useState(name);
  const { pending, submit } = useAction();
  const dirty = value.trim() !== name;

  return (
    <Card>
      <CardHeader
        title="Dados da empresa"
        description={canEdit ? "Visíveis para todo o time e para os seus clientes." : "Somente o proprietário e administradores podem alterar."}
      />
      <form onSubmit={submit(updateOrganization)} className="divide-y divide-line border-t border-line">
        <SettingRow
          label="Nome da empresa"
          htmlFor="org-name"
          description="Aparece no menu de todo o time e no topo das propostas enviadas aos clientes."
        >
          <Input
            id="org-name"
            name="name"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            disabled={!canEdit}
            required
            maxLength={120}
            autoComplete="organization"
          />
          <p className="mt-2.5 flex min-w-0 items-center gap-2 text-xs text-ink-3">
            <span className="shrink-0">Nas propostas:</span>
            <span className="truncate rounded-md border border-line bg-canvas px-2 py-0.5 text-[12.5px] font-semibold tracking-tight text-ink">
              {value.trim() || "Sua empresa"}
            </span>
          </p>
        </SettingRow>
        {canEdit ? (
          <FormFooter dirty={dirty}>
            {dirty ? (
              <Button size="sm" variant="ghost" onClick={() => setValue(name)}>
                Descartar
              </Button>
            ) : null}
            <SubmitButton size="sm" pending={pending} disabled={!dirty || !value.trim()}>
              Salvar alterações
            </SubmitButton>
          </FormFooter>
        ) : null}
      </form>
    </Card>
  );
}
