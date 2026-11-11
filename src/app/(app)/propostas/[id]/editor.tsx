"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Check,
  Copy,
  Eye,
  FileText,
  Link2,
  Mail,
  MessageCircle,
  MoreHorizontal,
  Package,
  PenLine,
  Plus,
  Send,
  Trash2,
  Undo2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  BILLING_LABEL,
  PROPOSAL_STATUSES,
  type BillingCycle,
  type ProposalSection,
  type ProposalStatus,
} from "@/lib/constants";
import { formatDateTime, formatMoney } from "@/lib/format";
import { cn, parseMoney } from "@/lib/utils";
import { PageHeader } from "@/components/shell/page-header";
import { Button } from "@/components/ui/button";
import { DotBadge } from "@/components/ui/badge";
import { Card, CardHeader } from "@/components/ui/misc";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogBody, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm";
import { useAction } from "@/components/ui/use-action";
import { ProposalDocument, lineTotal, proposalTotals, type DocumentItem } from "@/components/proposal-document";
import { deleteProposal, duplicateProposal, saveProposal, setProposalStatus, type ProposalDraft } from "../actions";

type Product = { id: string; name: string; description: string | null; unit_price: number; unit: string; billing: BillingCycle };

type ItemRow = {
  key: string;
  product_id: string | null;
  name: string;
  description: string;
  quantity: string;
  unit_price: string;
  discount_pct: string;
  billing: BillingCycle;
};

export type EditorProposal = {
  id: string;
  number: number;
  title: string;
  status: ProposalStatus;
  client_id: string | null;
  lead_id: string | null;
  valid_until: string | null;
  intro: string | null;
  sections: ProposalSection[];
  terms: string | null;
  public_token: string;
  created_at: string;
  sent_at: string | null;
  viewed_at: string | null;
  responded_at: string | null;
  response_name: string | null;
  response_comment: string | null;
};

type Recipients = {
  clients: { id: string; name: string; legal_name: string | null }[];
  leads: { id: string; name: string; company: string | null }[];
};

type State = {
  title: string;
  client_id: string | null;
  lead_id: string | null;
  valid_until: string;
  intro: string;
  sections: ProposalSection[];
  terms: string;
  items: ItemRow[];
};

let keySeed = 0;
const newKey = () => `k${Date.now().toString(36)}${(keySeed++).toString(36)}`;
const num = (value: string, fallback = 0) => {
  const n = Number.parseFloat(value.replace(/\./g, "").replace(",", "."));
  return Number.isFinite(n) ? n : fallback;
};
const fmtInput = (n: number) => (Number.isInteger(n) ? String(n) : String(n).replace(".", ","));

function toDocumentItems(items: ItemRow[]): DocumentItem[] {
  return items.map((i) => ({
    name: i.name || "Item",
    description: i.description || null,
    quantity: Math.max(num(i.quantity, 1), 0.01),
    unit_price: parseMoney(i.unit_price),
    discount_pct: Math.min(Math.max(num(i.discount_pct), 0), 100),
    billing: i.billing,
  }));
}

export function ProposalEditor({
  proposal,
  initialItems,
  products,
  recipients,
  organization,
  owner,
  siteUrl,
}: {
  proposal: EditorProposal;
  initialItems: Omit<ItemRow, "key">[];
  products: Product[];
  recipients: Recipients;
  organization: string;
  owner: { name: string | null; email: string | null } | null;
  siteUrl: string;
}) {
  const initialState = useMemo<State>(
    () => ({
      title: proposal.title,
      client_id: proposal.client_id,
      lead_id: proposal.lead_id,
      valid_until: proposal.valid_until ?? "",
      intro: proposal.intro ?? "",
      sections: proposal.sections,
      terms: proposal.terms ?? "",
      items: initialItems.map((i) => ({ ...i, key: newKey() })),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  const [state, setState] = useState<State>(initialState);
  const [savedSnapshot, setSavedSnapshot] = useState(() => JSON.stringify({ ...initialState, items: initialState.items.map(({ key, ...rest }) => rest) }));
  const editable = proposal.status === "draft";
  const [chosenMode, setMode] = useState<"edit" | "preview">("edit");
  // Proposta enviada/respondida não é editável: mostra o documento
  const mode = editable ? chosenMode : "preview";
  const [linkOpen, setLinkOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const save = useAction();
  const status = useAction();
  const other = useAction();

  const snapshot = JSON.stringify({ ...state, items: state.items.map(({ key, ...rest }) => rest) });
  const dirty = editable && snapshot !== savedSnapshot;
  const docItems = toDocumentItems(state.items);
  const totals = proposalTotals(docItems);
  const publicUrl = `${siteUrl}/p/${proposal.public_token}`;

  const patch = (next: Partial<State>) => setState((prev) => ({ ...prev, ...next }));
  const patchItem = (key: string, next: Partial<ItemRow>) =>
    setState((prev) => ({ ...prev, items: prev.items.map((i) => (i.key === key ? { ...i, ...next } : i)) }));
  const patchSection = (id: string, next: Partial<ProposalSection>) =>
    setState((prev) => ({ ...prev, sections: prev.sections.map((s) => (s.id === id ? { ...s, ...next } : s)) }));
  const moveSection = (index: number, dir: -1 | 1) =>
    setState((prev) => {
      const sections = [...prev.sections];
      const target = index + dir;
      if (target < 0 || target >= sections.length) return prev;
      [sections[index], sections[target]] = [sections[target], sections[index]];
      return { ...prev, sections };
    });

  const draft = useCallback(
    (): ProposalDraft => ({
      title: state.title,
      client_id: state.client_id,
      lead_id: state.lead_id,
      valid_until: state.valid_until || null,
      intro: state.intro,
      sections: state.sections,
      terms: state.terms,
      items: toDocumentItems(state.items).map((item, index) => ({
        ...item,
        product_id: state.items[index].product_id,
      })),
    }),
    [state],
  );

  const doSave = useCallback(
    (then?: () => void) => {
      const current = snapshot;
      save.run(() => saveProposal(proposal.id, draft()), {
        success: then ? undefined : "Proposta salva",
        onSuccess: () => {
          setSavedSnapshot(current);
          then?.();
        },
      });
    },
    [draft, proposal.id, save, snapshot],
  );

  // Ctrl/Cmd + S salva; aviso ao sair com alterações pendentes
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        if (dirty && !save.pending) doSave();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dirty, doSave, save.pending]);

  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  function send() {
    if (totals.oneTime + totals.monthly <= 0) {
      toast.error("Adicione ao menos um item com valor antes de enviar.");
      return;
    }
    const markSent = () =>
      status.run(() => setProposalStatus(proposal.id, "sent"), {
        success: "Proposta pronta para envio",
        onSuccess: () => setLinkOpen(true),
      });
    if (dirty) doSave(markSent);
    else markSent();
  }

  function changeStatus(next: ProposalStatus) {
    status.run(() => setProposalStatus(proposal.id, next), {
      onSuccess: () => {
        if (next === "draft") setMode("edit");
      },
    });
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(publicUrl);
      toast.success("Link copiado");
    } catch {
      toast.error("Não foi possível copiar. Selecione o link e copie manualmente.");
    }
  }

  const recipientValue = state.client_id ? `client:${state.client_id}` : state.lead_id ? `lead:${state.lead_id}` : "";
  const client = recipients.clients.find((c) => c.id === state.client_id);
  const lead = recipients.leads.find((l) => l.id === state.lead_id);
  const recipientName = client?.name ?? lead?.company ?? lead?.name ?? null;
  const recipientDetail = client ? client.legal_name : lead?.company ? lead.name : null;
  const meta = PROPOSAL_STATUSES[proposal.status];

  const shareText = `Olá! Segue a proposta "${state.title}": ${publicUrl}`;

  return (
    <>
      <PageHeader
        title={`#${proposal.number} · ${state.title || "Sem título"}`}
        icon={<FileText />}
        breadcrumb={{ label: "Propostas", href: "/propostas" }}
        actions={
          <>
            {dirty ? <span className="hidden text-xs text-ink-3 md:inline">Alterações não salvas</span> : null}
            <div className="hidden rounded-lg border border-line bg-subtle p-0.5 sm:inline-flex">
              <button
                type="button"
                disabled={!editable}
                title={editable ? undefined : "Volte para rascunho para editar"}
                onClick={() => setMode("edit")}
                className={cn(
                  "inline-flex h-6.5 cursor-pointer items-center gap-1.5 rounded-md px-2 text-[12.5px] disabled:cursor-not-allowed disabled:opacity-50",
                  mode === "edit" ? "bg-panel font-medium text-ink shadow-xs" : "text-ink-3 hover:text-ink",
                )}
              >
                <PenLine className="size-3.5" />
                Editar
              </button>
              <button
                type="button"
                onClick={() => setMode("preview")}
                className={cn(
                  "inline-flex h-6.5 cursor-pointer items-center gap-1.5 rounded-md px-2 text-[12.5px]",
                  mode === "preview" ? "bg-panel font-medium text-ink shadow-xs" : "text-ink-3 hover:text-ink",
                )}
              >
                <Eye className="size-3.5" />
                Visualizar
              </button>
            </div>
            {editable ? (
              <>
                <Button variant="secondary" disabled={!dirty || save.pending} onClick={() => doSave()}>
                  {save.pending ? "Salvando…" : dirty ? "Salvar" : (<><Check />Salvo</>)}
                </Button>
                <Button variant="primary" disabled={status.pending || save.pending} onClick={send}>
                  <Send />
                  <span className="hidden sm:inline">Enviar</span>
                </Button>
              </>
            ) : (
              <Button variant="primary" onClick={() => setLinkOpen(true)}>
                <Link2 />
                <span className="hidden sm:inline">Link do cliente</span>
              </Button>
            )}
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" size="icon" title="Mais ações">
                  <MoreHorizontal />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                <DropdownMenuItem onSelect={() => setMode(mode === "edit" ? "preview" : "edit")} className="sm:hidden">
                  {mode === "edit" ? <Eye /> : <PenLine />}
                  {mode === "edit" ? "Visualizar" : "Editar"}
                </DropdownMenuItem>
                {!editable ? (
                  <DropdownMenuItem asChild>
                    <a href={`${publicUrl}?preview=1`} target="_blank" rel="noreferrer">
                      <Eye />
                      Abrir página do cliente
                    </a>
                  </DropdownMenuItem>
                ) : null}
                <DropdownMenuItem disabled={other.pending} onSelect={() => other.run(() => duplicateProposal(proposal.id))}>
                  <Copy />
                  Duplicar proposta
                </DropdownMenuItem>
                {proposal.status !== "draft" ? (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel>Registrar resposta</DropdownMenuLabel>
                    {proposal.status !== "accepted" ? (
                      <DropdownMenuItem onSelect={() => changeStatus("accepted")}>
                        <Check />
                        Marcar como aceita
                      </DropdownMenuItem>
                    ) : null}
                    {proposal.status !== "rejected" ? (
                      <DropdownMenuItem onSelect={() => changeStatus("rejected")}>
                        <X />
                        Marcar como recusada
                      </DropdownMenuItem>
                    ) : null}
                    <DropdownMenuItem onSelect={() => changeStatus("draft")}>
                      <Undo2 />
                      Voltar para rascunho
                    </DropdownMenuItem>
                  </>
                ) : null}
                <DropdownMenuSeparator />
                <DropdownMenuItem destructive onSelect={() => setDeleteOpen(true)}>
                  <Trash2 />
                  Excluir proposta
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        }
      />

      {!editable ? (
        <div className="flex flex-wrap items-center gap-2 border-b border-line bg-subtle px-4 py-2.5 text-[13px] text-ink-2 sm:px-6 lg:px-page">
          <DotBadge dotClassName={meta.dot}>{meta.label}</DotBadge>
          {proposal.status === "accepted" || proposal.status === "rejected" ? (
            <span>
              {proposal.status === "accepted" ? "Aceita" : "Recusada"}
              {proposal.response_name ? ` por ${proposal.response_name}` : ""}
              {proposal.responded_at ? ` em ${formatDateTime(proposal.responded_at)}` : ""}.
              {proposal.response_comment ? <span className="text-ink-3"> “{proposal.response_comment}”</span> : null}
            </span>
          ) : (
            <span>Esta proposta já foi enviada. Para editar, use “Voltar para rascunho” no menu ⋯.</span>
          )}
        </div>
      ) : null}

      {mode === "preview" ? (
        <div className="flex-1 bg-canvas px-3 py-6 sm:px-6 lg:px-page sm:py-10">
          <ProposalDocument
            className="rounded-xl border border-line shadow-card"
            data={{
              number: proposal.number,
              title: state.title || "Sem título",
              organization,
              recipient: recipientName,
              recipientDetail,
              createdAt: proposal.created_at,
              validUntil: state.valid_until || null,
              intro: state.intro || null,
              sections: state.sections,
              items: docItems,
              terms: state.terms || null,
              owner,
            }}
          />
        </div>
      ) : (
        <div className="grid flex-1 gap-6 px-4 py-6 sm:px-6 lg:px-page xl:grid-cols-[minmax(0,1fr)_300px]">
          <div className="flex min-w-0 flex-col gap-4">
            <Card>
              <CardHeader title="Informações" />
              <div className="grid gap-4 border-t border-line px-4 py-4 sm:grid-cols-2">
                <Field label="Título" htmlFor="p-title" className="sm:col-span-2">
                  <Input id="p-title" value={state.title} onChange={(e) => patch({ title: e.target.value })} maxLength={200} />
                </Field>
                <Field label="Destinatário" htmlFor="p-recipient">
                  <Select
                    id="p-recipient"
                    value={recipientValue}
                    onChange={(e) => {
                      const [kind, id] = e.target.value.split(":");
                      if (kind === "client") patch({ client_id: id, lead_id: proposal.client_id === id ? proposal.lead_id : null });
                      else if (kind === "lead") patch({ lead_id: id, client_id: null });
                      else patch({ client_id: null, lead_id: null });
                    }}
                  >
                    <option value="">Sem destinatário</option>
                    {recipients.clients.length > 0 ? (
                      <optgroup label="Clientes">
                        {recipients.clients.map((c) => (
                          <option key={c.id} value={`client:${c.id}`}>
                            {c.name}
                          </option>
                        ))}
                      </optgroup>
                    ) : null}
                    {recipients.leads.length > 0 ? (
                      <optgroup label="Leads">
                        {recipients.leads.map((l) => (
                          <option key={l.id} value={`lead:${l.id}`}>
                            {l.company ? `${l.company} · ${l.name}` : l.name}
                          </option>
                        ))}
                      </optgroup>
                    ) : null}
                  </Select>
                </Field>
                <Field label="Válida até" htmlFor="p-valid">
                  <Input id="p-valid" type="date" value={state.valid_until} onChange={(e) => patch({ valid_until: e.target.value })} />
                </Field>
                <Field label="Introdução" htmlFor="p-intro" className="sm:col-span-2" hint="Aparece logo abaixo do título.">
                  <Textarea id="p-intro" value={state.intro} onChange={(e) => patch({ intro: e.target.value })} rows={3} />
                </Field>
              </div>
            </Card>

            <Card>
              <CardHeader
                title="Seções"
                description="Contexto, escopo, cronograma… Use “- ” no início da linha para criar listas."
                action={
                  <Button
                    size="xs"
                    variant="ghost"
                    onClick={() => patch({ sections: [...state.sections, { id: newKey(), title: "Nova seção", body: "" }] })}
                  >
                    <Plus />
                    Seção
                  </Button>
                }
              />
              <div className="flex flex-col divide-y divide-line border-t border-line">
                {state.sections.length === 0 ? (
                  <p className="px-4 py-6 text-center text-[13px] text-ink-3">Nenhuma seção. Adicione o contexto e o escopo do trabalho.</p>
                ) : null}
                {state.sections.map((section, index) => (
                  <div key={section.id} className="flex flex-col gap-2 px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] text-ink-4">{String(index + 1).padStart(2, "0")}</span>
                      <Input
                        value={section.title}
                        onChange={(e) => patchSection(section.id, { title: e.target.value })}
                        className="h-7 border-transparent px-1.5 font-medium shadow-none hover:border-line"
                        aria-label="Título da seção"
                      />
                      <div className="flex shrink-0 items-center">
                        <Button size="icon-sm" variant="ghost" title="Subir" disabled={index === 0} onClick={() => moveSection(index, -1)}>
                          <ArrowUp />
                        </Button>
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          title="Descer"
                          disabled={index === state.sections.length - 1}
                          onClick={() => moveSection(index, 1)}
                        >
                          <ArrowDown />
                        </Button>
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          title="Remover seção"
                          onClick={() => patch({ sections: state.sections.filter((s) => s.id !== section.id) })}
                        >
                          <Trash2 />
                        </Button>
                      </div>
                    </div>
                    <Textarea
                      value={section.body}
                      onChange={(e) => patchSection(section.id, { body: e.target.value })}
                      rows={4}
                      placeholder="Escreva o conteúdo desta seção…"
                      aria-label={`Conteúdo de ${section.title}`}
                    />
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <CardHeader
                title="Itens e valores"
                description="Produtos do catálogo ou itens personalizados."
                action={
                  <>
                    {products.length > 0 ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="xs" variant="ghost">
                            <Package />
                            Do catálogo
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-72">
                          <DropdownMenuLabel>Produtos e serviços</DropdownMenuLabel>
                          {products.map((product) => (
                            <DropdownMenuItem
                              key={product.id}
                              onSelect={() =>
                                patch({
                                  items: [
                                    ...state.items,
                                    {
                                      key: newKey(),
                                      product_id: product.id,
                                      name: product.name,
                                      description: product.description ?? "",
                                      quantity: "1",
                                      unit_price: fmtInput(Number(product.unit_price)),
                                      discount_pct: "0",
                                      billing: product.billing,
                                    },
                                  ],
                                })
                              }
                              className="items-start"
                            >
                              <span className="min-w-0 flex-1">
                                <span className="block truncate font-medium">{product.name}</span>
                                <span className="block text-xs text-ink-3">
                                  {formatMoney(product.unit_price)}/{product.unit} · {BILLING_LABEL[product.billing]}
                                </span>
                              </span>
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : null}
                    <Button
                      size="xs"
                      variant="ghost"
                      onClick={() =>
                        patch({
                          items: [
                            ...state.items,
                            {
                              key: newKey(),
                              product_id: null,
                              name: "",
                              description: "",
                              quantity: "1",
                              unit_price: "",
                              discount_pct: "0",
                              billing: "one_time",
                            },
                          ],
                        })
                      }
                    >
                      <Plus />
                      Item
                    </Button>
                  </>
                }
              />
              <div className="border-t border-line">
                {state.items.length === 0 ? (
                  <p className="px-4 py-6 text-center text-[13px] text-ink-3">
                    Nenhum item ainda. Adicione do catálogo ou crie um item personalizado.
                  </p>
                ) : (
                  <ul className="divide-y divide-line">
                    {state.items.map((item, index) => (
                      <li key={item.key} className="grid gap-2 px-4 py-3 sm:grid-cols-12 sm:items-start">
                        <div className="flex flex-col gap-1.5 sm:col-span-5">
                          <Input
                            value={item.name}
                            onChange={(e) => patchItem(item.key, { name: e.target.value })}
                            placeholder="Nome do item"
                            className="font-medium"
                            aria-label="Nome do item"
                          />
                          <Input
                            value={item.description}
                            onChange={(e) => patchItem(item.key, { description: e.target.value })}
                            placeholder="Descrição (opcional)"
                            className="h-7 text-xs"
                            aria-label="Descrição do item"
                          />
                        </div>
                        <div className="grid grid-cols-4 gap-2 sm:col-span-6 sm:grid-cols-[56px_minmax(0,1fr)_64px_96px]">
                          <Input
                            value={item.quantity}
                            onChange={(e) => patchItem(item.key, { quantity: e.target.value })}
                            inputMode="decimal"
                            aria-label="Quantidade"
                            title="Quantidade"
                            className="text-right tabular-nums"
                          />
                          <Input
                            value={item.unit_price}
                            onChange={(e) => patchItem(item.key, { unit_price: e.target.value })}
                            inputMode="decimal"
                            placeholder="0,00"
                            aria-label="Valor unitário"
                            title="Valor unitário (R$)"
                            className="text-right tabular-nums"
                          />
                          <div className="relative">
                            <Input
                              value={item.discount_pct}
                              onChange={(e) => patchItem(item.key, { discount_pct: e.target.value })}
                              inputMode="decimal"
                              aria-label="Desconto (%)"
                              title="Desconto (%)"
                              className="pr-5 text-right tabular-nums"
                            />
                            <span className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 text-xs text-ink-4">%</span>
                          </div>
                          <Select
                            value={item.billing}
                            onChange={(e) => patchItem(item.key, { billing: e.target.value as BillingCycle })}
                            aria-label="Cobrança"
                          >
                            <option value="one_time">Único</option>
                            <option value="monthly">Mensal</option>
                          </Select>
                          <p className="col-span-4 text-right text-[13px] font-semibold text-ink tabular-nums">
                            {formatMoney(lineTotal(docItems[index]))}
                            {item.billing === "monthly" ? "/mês" : ""}
                          </p>
                        </div>
                        <div className="flex justify-end sm:col-span-1">
                          <Button
                            size="icon-sm"
                            variant="ghost"
                            title="Remover item"
                            onClick={() => patch({ items: state.items.filter((i) => i.key !== item.key) })}
                          >
                            <Trash2 />
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </Card>

            <Card>
              <CardHeader title="Condições" description="Pagamento, prazos, garantias e validade." />
              <div className="border-t border-line px-4 py-4">
                <Textarea value={state.terms} onChange={(e) => patch({ terms: e.target.value })} rows={5} aria-label="Condições" />
              </div>
            </Card>
          </div>

          <aside className="xl:sticky xl:top-20 xl:self-start">
            <Card>
              <CardHeader title="Resumo" />
              <dl className="flex flex-col gap-2.5 border-t border-line px-4 py-4 text-[13px]">
                <div className="flex justify-between gap-2">
                  <dt className="text-ink-3">Investimento único</dt>
                  <dd className="font-semibold text-ink tabular-nums">{formatMoney(totals.oneTime)}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-ink-3">Mensalidade</dt>
                  <dd className="font-semibold text-ink tabular-nums">{formatMoney(totals.monthly)}/mês</dd>
                </div>
                <div className="flex justify-between gap-2 border-t border-line pt-2.5">
                  <dt className="text-ink-3">Primeiro ano</dt>
                  <dd className="font-semibold text-ink tabular-nums">{formatMoney(totals.oneTime + totals.monthly * 12)}</dd>
                </div>
              </dl>
              <div className="border-t border-line px-4 py-3 text-xs text-ink-3">
                <p>
                  Para: <span className="font-medium text-ink-2">{recipientName ?? "sem destinatário"}</span>
                </p>
                <p className="mt-1">{state.items.length} {state.items.length === 1 ? "item" : "itens"} · Ctrl + S para salvar</p>
              </div>
              <div className="flex flex-col gap-2 border-t border-line px-4 py-3">
                <Button variant="secondary" onClick={() => setMode("preview")}>
                  <Eye />
                  Pré-visualizar documento
                </Button>
              </div>
            </Card>
          </aside>
        </div>
      )}

      <Dialog open={linkOpen} onOpenChange={setLinkOpen}>
        <DialogContent
          title="Link da proposta"
          description="Envie este link para o cliente. Ele visualiza a proposta, e pode aceitar ou recusar online."
        >
          <DialogBody>
            <div className="flex gap-2">
              <Input readOnly value={publicUrl} onFocus={(e) => e.currentTarget.select()} className="font-mono text-xs" />
              <Button variant="primary" onClick={copyLink}>
                <Copy />
                Copiar
              </Button>
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              <Button asChild variant="secondary">
                <a href={`https://wa.me/?text=${encodeURIComponent(shareText)}`} target="_blank" rel="noreferrer">
                  <MessageCircle />
                  WhatsApp
                </a>
              </Button>
              <Button asChild variant="secondary">
                <a href={`mailto:?subject=${encodeURIComponent(state.title)}&body=${encodeURIComponent(shareText)}`}>
                  <Mail />
                  E-mail
                </a>
              </Button>
              <Button asChild variant="secondary">
                <a href={`${publicUrl}?preview=1`} target="_blank" rel="noreferrer">
                  <Eye />
                  Pré-visualizar
                </a>
              </Button>
            </div>
            <p className="text-xs text-ink-3">
              Quando o cliente abrir o link, o status muda para “Visualizada”. A resposta dele aparece aqui e na linha do tempo.
            </p>
          </DialogBody>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setLinkOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Excluir proposta?"
        description="A proposta e seus itens serão removidos e o link público deixará de funcionar. Essa ação não pode ser desfeita."
        action={() => deleteProposal(proposal.id)}
      />
    </>
  );
}
