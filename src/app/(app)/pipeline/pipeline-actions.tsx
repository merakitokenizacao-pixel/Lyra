"use client";

import { useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Ellipsis, Loader2, Pencil, Settings2, Target, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/confirm";
import { Dialog, DialogBody, DialogClose, DialogContent, DialogFooter } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Field, Input, Select } from "@/components/ui/input";
import { useAction } from "@/components/ui/use-action";
import { deletePipeline, renamePipeline, setDefaultPipeline, type StageInput } from "../configuracoes/actions";
import { StagesEditor } from "../configuracoes/pipeline/stages-editor";

type PipelineRef = { id: string; name: string; is_default: boolean };

/** Ações do pipeline aberto no quadro (só administradores): etapas, nome, padrão e exclusão. */
export function PipelineActions({
  pipeline,
  leads,
  stages,
  others,
}: {
  pipeline: PipelineRef;
  /** Total de leads do pipeline, de todas as etapas */
  leads: number;
  stages: (StageInput & { id: string; leads: number })[];
  /** Os outros pipelines da empresa, destinos possíveis dos leads ao excluir */
  others: PipelineRef[];
}) {
  const router = useRouter();
  const [dialog, setDialog] = useState<"stages" | "rename" | "delete" | null>(null);
  const close = (open: boolean) => !open && setDialog(null);
  // Diálogo aberto por um item do menu: o menu não devolve o foco para o "⋯" (o diálogo ficaria sem
  // foco e o Enter cairia no botão), e o foco só volta para o "⋯" quando o diálogo fecha.
  const menuTrigger = useRef<HTMLButtonElement>(null);
  const renameInput = useRef<HTMLInputElement>(null);
  const menuOpensDialog = useRef(false);
  const openFromMenu = (next: "rename" | "delete") => {
    menuOpensDialog.current = true;
    setDialog(next);
  };
  const backToMenu = (event: Event) => {
    event.preventDefault();
    menuTrigger.current?.focus();
  };
  const { pending, run, submit } = useAction();
  const nameId = useId();
  const targetId = useId();
  const fallbackTarget = others.find((p) => p.is_default)?.id ?? others[0]?.id ?? "";
  const [target, setTarget] = useState(fallbackTarget);
  // O destino escolhido pode ter sido excluído em outra aba: volta para o padrão
  const moveTo = others.some((p) => p.id === target) ? target : fallbackTarget;

  return (
    <div className="flex items-center gap-2">
      <Button variant="secondary" size="sm" aria-label="Editar etapas" onClick={() => setDialog("stages")}>
        <Settings2 />
        <span className="hidden sm:inline">Editar etapas</span>
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button ref={menuTrigger} variant="secondary" size="icon-sm" aria-label="Mais opções do pipeline">
            <Ellipsis />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="w-64"
          onCloseAutoFocus={(event) => {
            if (!menuOpensDialog.current) return;
            menuOpensDialog.current = false;
            event.preventDefault();
          }}
        >
          <DropdownMenuItem onSelect={() => openFromMenu("rename")}>
            <Pencil />
            Renomear
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={pipeline.is_default || pending}
            onSelect={() => run(() => setDefaultPipeline(pipeline.id))}
          >
            <Target />
            <span className="min-w-0 flex-1">
              <span className="block">{pipeline.is_default ? "Este é o pipeline padrão" : "Definir como padrão"}</span>
              <span className="block text-[11.5px] leading-snug text-ink-4">Abre primeiro e aparece no Início</span>
            </span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem destructive disabled={pipeline.is_default} onSelect={() => openFromMenu("delete")}>
            <Trash2 />
            <span className="min-w-0 flex-1">
              <span className="block">Excluir pipeline</span>
              {pipeline.is_default ? (
                <span className="block text-[11.5px] leading-snug">Defina outro como padrão antes de excluir</span>
              ) : null}
            </span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={dialog === "stages"} onOpenChange={close}>
        <DialogContent
          title="Etapas do pipeline"
          description={`${pipeline.name} · Renomeie, escolha a cor e o tipo de cada etapa e ajuste a ordem com as setas.`}
          size="lg"
        >
          <StagesEditor pipelineId={pipeline.id} stages={stages} canEdit onSaved={() => setDialog(null)} />
        </DialogContent>
      </Dialog>

      <Dialog open={dialog === "rename"} onOpenChange={close}>
        <DialogContent
          title="Renomear pipeline"
          size="sm"
          // Vindo do menu, o autoFocus não pega: o foco iria para o "Fechar". Já abre com o nome selecionado.
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            renameInput.current?.focus();
            renameInput.current?.select();
          }}
          onCloseAutoFocus={backToMenu}
        >
          <form onSubmit={submit(renamePipeline, { onSuccess: () => setDialog(null) })}>
            <input type="hidden" name="id" value={pipeline.id} />
            <DialogBody>
              <Field label="Nome" htmlFor={nameId}>
                <Input
                  ref={renameInput}
                  id={nameId}
                  name="name"
                  defaultValue={pipeline.name}
                  required
                  maxLength={80}
                  autoComplete="off"
                />
              </Field>
            </DialogBody>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="secondary">Cancelar</Button>
              </DialogClose>
              <SubmitButton pending={pending}>Salvar</SubmitButton>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={dialog === "delete"} onOpenChange={close}>
        <DialogContent title="Excluir pipeline?" size="sm" onCloseAutoFocus={backToMenu}>
          <DialogBody>
            {leads > 0 ? (
              <>
                <p className="text-[13px] text-ink-2">
                  <strong className="font-medium text-ink">{pipeline.name}</strong> e as etapas dele serão excluídos.{" "}
                  {leads === 1 ? "O lead dele não se perde: vai" : `Os ${leads} leads dele não se perdem: vão`} para o
                  pipeline escolhido abaixo, na etapa de mesmo nome ou, se ela não existir lá, na primeira do mesmo tipo
                  (em andamento, ganho ou perdido).
                </p>
                <Field label={leads === 1 ? "Mover o lead para" : "Mover os leads para"} htmlFor={targetId}>
                  <Select id={targetId} value={moveTo} onChange={(e) => setTarget(e.target.value)}>
                    {others.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.is_default ? `${p.name} (padrão)` : p.name}
                      </option>
                    ))}
                  </Select>
                </Field>
              </>
            ) : (
              <p className="text-[13px] text-ink-2">
                <strong className="font-medium text-ink">{pipeline.name}</strong> não tem leads. Ele e as etapas dele serão
                excluídos. Essa ação não pode ser desfeita.
              </p>
            )}
          </DialogBody>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="secondary">Cancelar</Button>
            </DialogClose>
            <Button
              variant="danger-solid"
              disabled={pending || (leads > 0 && !moveTo)}
              onClick={() =>
                run(() => deletePipeline(pipeline.id, leads > 0 ? moveTo : null), {
                  onSuccess: () => {
                    setDialog(null);
                    router.push(leads > 0 ? `/pipeline?pipeline=${moveTo}` : "/pipeline");
                  },
                })
              }
            >
              {pending ? <Loader2 className="animate-spin" /> : null}
              Excluir pipeline
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
