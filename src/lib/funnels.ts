import {
  Bot,
  CirclePlay,
  ClipboardList,
  CreditCard,
  FileText,
  Globe,
  Handshake,
  LayoutTemplate,
  Mail,
  Megaphone,
  MessageCircle,
  MonitorSmartphone,
  Phone,
  PhoneOutgoing,
  Search,
  Send,
  Share2,
  Square,
  StickyNote,
  Users,
  Video,
  type LucideIcon,
} from "lucide-react";
import type { Enums } from "@/lib/supabase/database.types";

/*
 * Funis: o caminho que uma pessoa faz até comprar um produto (origem → páginas → conversa → conversão).
 * Cada funil tem variantes (abordagens diferentes) e cada variante é um grafo de etapas ligadas por
 * conexões com a taxa de passagem. A simulação abaixo calcula quantas pessoas chegam a cada etapa,
 * quanto isso custa e quanto rende, para comparar as abordagens antes (previsto) e depois (real).
 * Este módulo é puro: roda no servidor (lista, validação) e no navegador (editor).
 */

/* ---------- Status ---------- */
export type FunnelStatus = Enums<"funnel_status">;

export const FUNNEL_STATUSES: Record<FunnelStatus, { label: string; dot: string; hint: string }> = {
  draft: { label: "Rascunho", dot: "bg-stone-400", hint: "Ainda em desenho" },
  testing: { label: "Em teste", dot: "bg-violet-500", hint: "Comparando abordagens" },
  active: { label: "Ativo", dot: "bg-emerald-500", hint: "Rodando com a abordagem escolhida" },
  paused: { label: "Pausado", dot: "bg-amber-500", hint: "Parado por enquanto" },
  archived: { label: "Arquivado", dot: "bg-stone-300", hint: "Guardado para consulta" },
};
export const FUNNEL_STATUS_ORDER: FunnelStatus[] = ["draft", "testing", "active", "paused", "archived"];

/* ---------- Tipos de etapa ---------- */
export type StepGroup = "source" | "page" | "conversation" | "conversion" | "other";

/**
 * Grupos de etapa. As cores repetem a paleta categórica já validada do app (status de cliente),
 * na mesma ordem de separação: violeta, azul, laranja, verde. Cinza fica para o resto.
 */
export const STEP_GROUPS: Record<StepGroup, { label: string; hint: string; tile: string; hex: string }> = {
  source: { label: "Origem", hint: "De onde as pessoas vêm", tile: "bg-violet-50 text-violet-700", hex: "#6250d6" },
  page: { label: "Páginas", hint: "Onde a pessoa conhece a oferta", tile: "bg-blue-50 text-blue-700", hex: "#2a78d6" },
  conversation: { label: "Conversa", hint: "Atendimento e qualificação", tile: "bg-orange-50 text-orange-700", hex: "#eb6834" },
  conversion: { label: "Conversão", hint: "Onde a venda acontece", tile: "bg-emerald-50 text-emerald-700", hex: "#1baf7a" },
  other: { label: "Outros", hint: "Etapas livres e anotações", tile: "bg-stone-100 text-stone-600", hex: "#a6a09b" },
};
export const STEP_GROUP_ORDER: StepGroup[] = ["source", "page", "conversation", "conversion", "other"];

export type StepKind =
  | "ads"
  | "social"
  | "seo"
  | "referral"
  | "base"
  | "outbound"
  | "site"
  | "landing"
  | "form"
  | "content"
  | "ai_agent"
  | "whatsapp"
  | "email"
  | "call"
  | "meeting"
  | "platform"
  | "checkout"
  | "proposal"
  | "deal"
  | "step"
  | "note";

export const STEP_KINDS: Record<StepKind, { label: string; group: StepGroup; icon: LucideIcon; hint: string }> = {
  ads: { label: "Anúncios pagos", group: "source", icon: Megaphone, hint: "Meta, Google, TikTok, LinkedIn" },
  social: { label: "Redes sociais", group: "source", icon: Share2, hint: "Conteúdo orgânico" },
  seo: { label: "Busca orgânica", group: "source", icon: Search, hint: "Google e SEO" },
  referral: { label: "Indicação", group: "source", icon: Users, hint: "Clientes e parceiros" },
  base: { label: "Base de contatos", group: "source", icon: Mail, hint: "Lista de e-mail, clientes antigos" },
  outbound: { label: "Prospecção ativa", group: "source", icon: PhoneOutgoing, hint: "SDR, cold call, cold mail" },
  site: { label: "Site", group: "page", icon: Globe, hint: "Página institucional" },
  landing: { label: "Landing page", group: "page", icon: LayoutTemplate, hint: "Página de uma oferta" },
  form: { label: "Formulário", group: "page", icon: ClipboardList, hint: "Cadastro ou captura de contato" },
  content: { label: "Conteúdo", group: "page", icon: CirclePlay, hint: "Vídeo, post, e-book, aula" },
  ai_agent: { label: "Agente de IA", group: "conversation", icon: Bot, hint: "Atendimento automático" },
  whatsapp: { label: "WhatsApp", group: "conversation", icon: MessageCircle, hint: "Conversa com o time" },
  email: { label: "Sequência de e-mails", group: "conversation", icon: Send, hint: "Nutrição automática" },
  call: { label: "Ligação", group: "conversation", icon: Phone, hint: "Contato por telefone" },
  meeting: { label: "Reunião", group: "conversation", icon: Video, hint: "Demonstração ou diagnóstico" },
  platform: { label: "Plataforma", group: "conversion", icon: MonitorSmartphone, hint: "Cadastro, teste ou assinatura" },
  checkout: { label: "Checkout", group: "conversion", icon: CreditCard, hint: "Pagamento online" },
  proposal: { label: "Proposta", group: "conversion", icon: FileText, hint: "Proposta comercial" },
  deal: { label: "Contrato fechado", group: "conversion", icon: Handshake, hint: "Venda concluída" },
  step: { label: "Etapa livre", group: "other", icon: Square, hint: "Qualquer outra etapa" },
  note: { label: "Nota", group: "other", icon: StickyNote, hint: "Hipótese ou aprendizado no quadro" },
};
export const STEP_KIND_ORDER = Object.keys(STEP_KINDS) as StepKind[];

export function isStepKind(value: unknown): value is StepKind {
  return typeof value === "string" && value in STEP_KINDS;
}
export function groupOf(kind: StepKind): StepGroup {
  return STEP_KINDS[kind].group;
}
export function isSource(kind: StepKind) {
  return STEP_KINDS[kind].group === "source";
}

/* ---------- Documento ---------- */
export type FunnelNode = {
  id: string;
  kind: StepKind;
  x: number;
  y: number;
  name: string;
  /** Hipótese, roteiro ou anotação da etapa (numa nota, é o texto dela). */
  note: string;
  url: string;
  /** Origem: pessoas por mês que entram por aqui. */
  volume: number;
  /** Custo fixo por mês (mídia, ferramenta, time). */
  cost: number;
  /** Custo por pessoa que chega à etapa (ex.: conversa do agente de IA). */
  unitCost: number;
  /** Receita por pessoa que chega à etapa (ticket médio ou valor do contrato). */
  value: number;
  /** Resultado real: pessoas por mês que chegaram aqui de verdade. */
  actual: number | null;
};

/** Conexão: `rate` é a % das pessoas da etapa de origem que seguem para a de destino. */
export type FunnelEdge = { id: string; source: string; target: string; rate: number };

export type FunnelVariant = {
  id: string;
  name: string;
  /** Etapa que conta como conversão; null = escolhida automaticamente. */
  goalId: string | null;
  nodes: FunnelNode[];
  edges: FunnelEdge[];
};

export type FunnelDoc = {
  name: string;
  description: string;
  status: FunnelStatus;
  productId: string | null;
  winnerId: string | null;
  variants: FunnelVariant[];
};

export const FUNNEL_LIMITS = { variants: 6, nodes: 80, edges: 160 } as const;

/** Tamanho do card de etapa no quadro (usado para posicionar e organizar). */
export const NODE_SIZE = { width: 216, height: 92 } as const;
/** Distância entre colunas (etapas em sequência) e entre linhas (etapas em paralelo). */
export const LAYOUT = { column: 320, row: 132 } as const;
const COLUMN_GAP = LAYOUT.column;
const ROW_GAP = LAYOUT.row;

export function uid(prefix = "n") {
  return `${prefix}${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-4)}`;
}

export function variantLetter(index: number) {
  return String.fromCharCode(65 + (index % 26));
}

export function newNode(kind: StepKind, position: { x: number; y: number }, patch: Partial<FunnelNode> = {}): FunnelNode {
  return {
    id: uid(),
    kind,
    x: Math.round(position.x),
    y: Math.round(position.y),
    name: kind === "note" ? "Nota" : STEP_KINDS[kind].label,
    note: "",
    url: "",
    volume: isSource(kind) ? 1000 : 0,
    cost: 0,
    unitCost: 0,
    value: 0,
    actual: null,
    ...patch,
  };
}

/** Taxa sugerida para uma conexão nova: a origem leva todo mundo adiante; as outras etapas, 25%. */
export function suggestedRate(variant: FunnelVariant, sourceId: string) {
  const source = variant.nodes.find((n) => n.id === sourceId);
  const used = variant.edges.filter((e) => e.source === sourceId).reduce((sum, e) => sum + e.rate, 0);
  const remaining = Math.max(0, 100 - used);
  if (source && isSource(source.kind)) return remaining > 0 ? remaining : 50;
  return remaining > 0 ? Math.min(25, remaining) : 25;
}

/** A conexão source → target criaria um ciclo? (o destino já leva de volta à origem) */
export function createsCycle(edges: FunnelEdge[], source: string, target: string) {
  if (source === target) return true;
  const next = new Map<string, string[]>();
  for (const e of edges) next.set(e.source, [...(next.get(e.source) ?? []), e.target]);
  const stack = [target];
  const seen = new Set<string>();
  while (stack.length) {
    const id = stack.pop()!;
    if (id === source) return true;
    if (seen.has(id)) continue;
    seen.add(id);
    stack.push(...(next.get(id) ?? []));
  }
  return false;
}

/* ---------- Simulação ---------- */
export type NodeSim = {
  /** Pessoas por mês que chegam à etapa. */
  arrivals: number;
  /** Pessoas que seguem para alguma próxima etapa. */
  forwarded: number;
  /** Parcela que para aqui (0–1). Só faz sentido quando a etapa tem saídas. */
  dropShare: number;
  /** As taxas de saída somam mais de 100% (a simulação divide proporcionalmente). */
  overflow: boolean;
  hasExits: boolean;
  revenue: number;
  cost: number;
  depth: number;
};

export type EdgeSim = {
  /** Pessoas por mês que passam pela conexão. */
  flow: number;
  /** Taxa usada no cálculo (0–1), já ajustada quando as saídas passam de 100%. */
  share: number;
  /** Taxa real (0–1), quando as duas pontas têm resultado real e o destino só recebe por aqui. */
  realShare: number | null;
};

export type FunnelSim = {
  nodes: Record<string, NodeSim>;
  edges: Record<string, EdgeSim>;
  entries: number;
  goalId: string | null;
  /** A meta foi escolhida automaticamente (a pessoa não marcou nenhuma etapa). */
  goalAuto: boolean;
  conversions: number;
  rate: number;
  revenue: number;
  cost: number;
  profit: number;
  roi: number | null;
  costPerConversion: number | null;
  /** Caminho com mais gente até a meta, da origem à conversão. */
  path: string[];
  pathEdges: string[];
  /** Conexão com a menor taxa no caminho principal: o gargalo. */
  weakest: string | null;
  maxFlow: number;
  hasCycle: boolean;
  steps: number;
  real: {
    filled: number;
    entries: number | null;
    conversions: number | null;
    rate: number | null;
    revenue: number | null;
  };
};

function sum(values: number[]) {
  return values.reduce((total, n) => total + n, 0);
}

export function simulate(variant: FunnelVariant): FunnelSim {
  const flowNodes = variant.nodes.filter((n) => n.kind !== "note");
  const byId = new Map(flowNodes.map((n) => [n.id, n]));
  const edges = variant.edges.filter((e) => byId.has(e.source) && byId.has(e.target) && e.source !== e.target);

  // Ordem topológica (Kahn). Etapas presas num ciclo vão no fim e as conexões de volta são ignoradas.
  const incoming = new Map<string, FunnelEdge[]>();
  const outgoing = new Map<string, FunnelEdge[]>();
  for (const n of flowNodes) {
    incoming.set(n.id, []);
    outgoing.set(n.id, []);
  }
  for (const e of edges) {
    incoming.get(e.target)!.push(e);
    outgoing.get(e.source)!.push(e);
  }
  const indegree = new Map(flowNodes.map((n) => [n.id, incoming.get(n.id)!.length]));
  const queue = flowNodes.filter((n) => indegree.get(n.id) === 0).map((n) => n.id);
  const order: string[] = [];
  while (queue.length) {
    const id = queue.shift()!;
    order.push(id);
    for (const e of outgoing.get(id)!) {
      const left = indegree.get(e.target)! - 1;
      indegree.set(e.target, left);
      if (left === 0) queue.push(e.target);
    }
  }
  const hasCycle = order.length < flowNodes.length;
  if (hasCycle) for (const n of flowNodes) if (!order.includes(n.id)) order.push(n.id);
  const position = new Map(order.map((id, index) => [id, index]));

  const nodes: Record<string, NodeSim> = {};
  const edgeSims: Record<string, EdgeSim> = {};
  for (const id of order) {
    const node = byId.get(id)!;
    const ins = incoming.get(id)!.filter((e) => position.get(e.source)! < position.get(id)!);
    const arrivals = (isSource(node.kind) ? node.volume : 0) + sum(ins.map((e) => edgeSims[e.id]?.flow ?? 0));
    const depth = ins.length ? Math.max(...ins.map((e) => (nodes[e.source]?.depth ?? 0) + 1)) : 0;
    const outs = outgoing.get(id)!;
    const totalRate = sum(outs.map((e) => Math.max(0, e.rate)));
    const scale = totalRate > 100 ? 100 / totalRate : 1;
    let forwarded = 0;
    for (const e of outs) {
      const share = (Math.max(0, e.rate) / 100) * scale;
      const flow = arrivals * share;
      forwarded += flow;
      edgeSims[e.id] = { flow, share, realShare: null };
    }
    nodes[id] = {
      arrivals,
      forwarded,
      dropShare: outs.length && arrivals > 0 ? Math.max(0, 1 - forwarded / arrivals) : 0,
      overflow: totalRate > 100.0001,
      hasExits: outs.length > 0,
      revenue: arrivals * node.value,
      cost: node.cost + arrivals * node.unitCost,
      depth,
    };
  }
  // Conexões de volta (num ciclo) ficam sem fluxo
  for (const e of edges) edgeSims[e.id] ??= { flow: 0, share: 0, realShare: null };

  // Taxa real: as duas pontas medidas e o destino só recebe gente por esta conexão
  for (const e of edges) {
    const from = byId.get(e.source)!;
    const to = byId.get(e.target)!;
    if (from.actual != null && from.actual > 0 && to.actual != null && incoming.get(e.target)!.length === 1) {
      edgeSims[e.id].realShare = to.actual / from.actual;
    }
  }

  // Meta: a escolhida, ou a etapa de conversão mais adiante, ou a última etapa sem saída
  let goalId = variant.goalId && byId.has(variant.goalId) ? variant.goalId : null;
  const goalAuto = goalId == null;
  if (!goalId) {
    const pick = (list: FunnelNode[]) =>
      list.sort((a, b) => nodes[b.id].depth - nodes[a.id].depth || nodes[b.id].arrivals - nodes[a.id].arrivals)[0]?.id ?? null;
    goalId =
      pick(flowNodes.filter((n) => groupOf(n.kind) === "conversion")) ??
      pick(flowNodes.filter((n) => !isSource(n.kind) && outgoing.get(n.id)!.length === 0));
  }

  // Caminho principal: da meta para trás, sempre pela conexão com mais gente
  const path: string[] = [];
  const pathEdges: string[] = [];
  if (goalId) {
    const seen = new Set<string>();
    let current: string | null = goalId;
    while (current && !seen.has(current)) {
      seen.add(current);
      path.unshift(current);
      const best: FunnelEdge | undefined = incoming
        .get(current)!
        .filter((e) => !seen.has(e.source))
        .sort((a, b) => (edgeSims[b.id]?.flow ?? 0) - (edgeSims[a.id]?.flow ?? 0))[0];
      if (!best) break;
      pathEdges.unshift(best.id);
      current = best.source;
    }
  }
  const weakest =
    pathEdges
      .filter((id) => edgeSims[id].share < 0.999)
      .sort((a, b) => edgeSims[a].share - edgeSims[b].share)[0] ?? null;

  const entries = sum(flowNodes.filter((n) => isSource(n.kind)).map((n) => n.volume));
  const conversions = goalId ? nodes[goalId].arrivals : 0;
  const revenue = sum(Object.values(nodes).map((n) => n.revenue));
  const cost = sum(Object.values(nodes).map((n) => n.cost));
  const profit = revenue - cost;

  // Resultado real
  const measured = flowNodes.filter((n) => n.actual != null);
  const realSources = flowNodes.filter((n) => isSource(n.kind) && n.actual != null);
  const realEntries = realSources.length ? sum(realSources.map((n) => n.actual!)) : null;
  const goalNode = goalId ? byId.get(goalId)! : null;
  const realConversions = goalNode?.actual ?? null;

  return {
    nodes,
    edges: edgeSims,
    entries,
    goalId,
    goalAuto,
    conversions,
    rate: entries > 0 ? conversions / entries : 0,
    revenue,
    cost,
    profit,
    roi: cost > 0 ? profit / cost : null,
    costPerConversion: cost > 0 && conversions > 0 ? cost / conversions : null,
    path,
    pathEdges,
    weakest,
    maxFlow: Math.max(0, ...Object.values(edgeSims).map((e) => e.flow)),
    hasCycle,
    steps: flowNodes.length,
    real: {
      filled: measured.length,
      entries: realEntries,
      conversions: realConversions,
      rate: realEntries && realConversions != null ? realConversions / realEntries : null,
      revenue: measured.length ? sum(measured.map((n) => n.actual! * n.value)) : null,
    },
  };
}

/** Diferença do real para o previsto (−0,25 = 25% abaixo). */
export function realDelta(planned: number, actual: number | null) {
  if (actual == null || planned <= 0) return null;
  return (actual - planned) / planned;
}

/* ---------- Organização automática ---------- */
/**
 * Colunas pela profundidade (origem à esquerda). O caminho principal fica numa linha reta no meio;
 * as outras etapas ficam acima ou abaixo, perto de quem vem antes delas. A linha do meio também fica
 * livre nas colunas que uma conexão do caminho principal atravessa, para ela não passar por trás de um card.
 */
export function autoLayout(variant: FunnelVariant): Record<string, { x: number; y: number }> {
  const flow = variant.nodes.filter((n) => n.kind !== "note");
  const sim = simulate({ ...variant, nodes: flow });
  const depthOf = (id: string) => sim.nodes[id]?.depth ?? 0;
  const columns = new Map<number, FunnelNode[]>();
  for (const n of flow) columns.set(depthOf(n.id), [...(columns.get(depthOf(n.id)) ?? []), n]);

  const main = new Set(sim.path);
  const crossed = new Set<number>();
  for (const edgeId of sim.pathEdges) {
    const edge = variant.edges.find((e) => e.id === edgeId);
    if (!edge) continue;
    for (let d = depthOf(edge.source) + 1; d < depthOf(edge.target); d++) crossed.add(d);
  }

  const positions: Record<string, { x: number; y: number }> = {};
  const rowOf = new Map<string, number>();
  for (const depth of [...columns.keys()].sort((a, b) => a - b)) {
    const list = columns.get(depth)!;
    const used = new Set<number>();
    const spine = list.find((n) => main.has(n.id));
    if (spine) {
      rowOf.set(spine.id, 0);
      used.add(0);
    } else if (crossed.has(depth)) {
      used.add(0);
    }
    const desired = (n: FunnelNode) => {
      const rows = variant.edges.filter((e) => e.target === n.id && rowOf.has(e.source)).map((e) => rowOf.get(e.source)!);
      return rows.length ? sum(rows) / rows.length : 0;
    };
    const others = list.filter((n) => n !== spine).sort((a, b) => desired(a) - desired(b) || a.y - b.y);
    for (const n of others) {
      const want = Math.round(desired(n));
      // Linha livre mais próxima da desejada: want, want+1, want−1, want+2…
      let row = want;
      for (let step = 1; used.has(row); step++) row = want + (step % 2 === 1 ? (step + 1) / 2 : -step / 2);
      used.add(row);
      rowOf.set(n.id, row);
    }
    for (const n of list) positions[n.id] = { x: depth * COLUMN_GAP, y: rowOf.get(n.id)! * ROW_GAP };
  }
  // Notas vão para uma faixa acima do desenho, na ordem em que estavam
  const notes = variant.nodes.filter((n) => n.kind === "note").sort((a, b) => a.x - b.x);
  const top = Math.min(0, ...Object.values(positions).map((p) => p.y));
  notes.forEach((n, index) => {
    positions[n.id] = { x: index * (NODE_SIZE.width + 32), y: top - 180 };
  });
  return positions;
}

/* ---------- Formatação ---------- */
const integer = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });
const compact = new Intl.NumberFormat("pt-BR", { notation: "compact", maximumFractionDigits: 1 });
const decimal = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 });

/** Pessoas: "960", "8.000", "12,5 mil"; frações só abaixo de 10 ("2,4"). */
export function formatPeople(value: number) {
  if (!Number.isFinite(value)) return "—";
  if (value > 0 && value < 10 && Math.abs(value - Math.round(value)) > 0.05) return value.toFixed(1).replace(".", ",");
  if (value < 10_000) return integer.format(Math.round(value));
  return compact.format(value);
}

/** Taxa 0–1 em %: uma casa decimal abaixo de 10% ("2,5%"), inteira acima ("25%"). */
export function formatShare(share: number) {
  if (!Number.isFinite(share)) return "—";
  const pct = share * 100;
  if (pct > 0 && pct < 10) {
    const text = pct.toFixed(1).replace(".", ",");
    return `${text.endsWith(",0") ? text.slice(0, -2) : text}%`;
  }
  return `${Math.round(pct)}%`;
}

/** Retorno sobre o custo: "13x", "2,4x", "−0,5x". */
export function formatMultiple(value: number) {
  if (!Number.isFinite(value)) return "—";
  const abs = Math.abs(value);
  // 13x · 2,4x · 0,35x (abaixo de 1, duas casas para não virar "0x")
  const text = abs >= 10 ? String(Math.round(abs)) : abs.toFixed(abs >= 1 ? 1 : 2).replace(".", ",").replace(/,?0+$/, "");
  return `${value < 0 && text !== "0" ? "−" : ""}${text}x`;
}

/** Número para campo de edição: "6.000", "12,5", "0,4". */
export function formatInput(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value)) return "";
  return decimal.format(value);
}

/** Lê "1.234,5", "1234.5", "12%" ou "R$ 1.000". Null quando não há número. */
export function parseDecimal(input: string): number | null {
  let value = input.replace(/[^\d,.-]/g, "").trim();
  if (!value || value === "-") return null;
  if (value.includes(",")) value = value.replace(/\./g, "").replace(",", ".");
  else if ((value.match(/\./g) ?? []).length > 1 || /\.\d{3}$/.test(value)) value = value.replace(/\./g, "");
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}

/** Só links http(s) viram link de verdade (evita javascript: e afins). */
export function safeUrl(url: string) {
  const value = url.trim();
  if (!value) return null;
  return /^https?:\/\//i.test(value) ? value : null;
}

/* ---------- Validação (servidor) ---------- */
function text(value: unknown, max: number, fallback = "") {
  return typeof value === "string" ? value.trim().slice(0, max) : fallback;
}
function num(value: unknown, max: number, min = 0, digits = 2) {
  const n = typeof value === "number" ? value : typeof value === "string" ? Number(value) : Number.NaN;
  if (!Number.isFinite(n)) return Math.max(min, 0);
  const factor = 10 ** digits;
  return Math.round(Math.min(max, Math.max(min, n)) * factor) / factor;
}
function id(value: unknown, make: () => string) {
  return typeof value === "string" && /^[\w-]{1,40}$/.test(value) ? value : make();
}
function normalizeUrl(value: unknown) {
  const url = text(value, 500);
  if (!url) return "";
  return /^https?:\/\//i.test(url) ? url : `https://${url.replace(/^[a-z]+:\/*/i, "")}`;
}

function sanitizeVariant(input: unknown, index: number): FunnelVariant | null {
  if (!input || typeof input !== "object") return null;
  const raw = input as Record<string, unknown>;
  const nodes: FunnelNode[] = [];
  const nodeIds = new Set<string>();
  for (const item of Array.isArray(raw.nodes) ? raw.nodes.slice(0, FUNNEL_LIMITS.nodes) : []) {
    if (!item || typeof item !== "object") continue;
    const n = item as Record<string, unknown>;
    const nodeId = id(n.id, () => uid());
    if (nodeIds.has(nodeId)) continue;
    const kind = isStepKind(n.kind) ? n.kind : "step";
    nodeIds.add(nodeId);
    nodes.push({
      id: nodeId,
      kind,
      x: num(n.x, 100_000, -100_000, 0),
      y: num(n.y, 100_000, -100_000, 0),
      name: text(n.name, 80) || STEP_KINDS[kind].label,
      note: text(n.note, 1000),
      url: kind === "note" ? "" : normalizeUrl(n.url),
      volume: isSource(kind) ? num(n.volume, 1_000_000_000) : 0,
      cost: num(n.cost, 10_000_000_000),
      unitCost: num(n.unitCost, 10_000_000),
      value: num(n.value, 1_000_000_000),
      actual: n.actual == null || n.actual === "" ? null : num(n.actual, 1_000_000_000),
    });
  }
  const kindOf = new Map(nodes.map((n) => [n.id, n.kind]));
  const edges: FunnelEdge[] = [];
  const pairs = new Set<string>();
  for (const item of Array.isArray(raw.edges) ? raw.edges.slice(0, FUNNEL_LIMITS.edges) : []) {
    if (!item || typeof item !== "object") continue;
    const e = item as Record<string, unknown>;
    const source = typeof e.source === "string" ? e.source : "";
    const target = typeof e.target === "string" ? e.target : "";
    const sourceKind = kindOf.get(source);
    const targetKind = kindOf.get(target);
    if (!sourceKind || !targetKind || source === target) continue;
    if (sourceKind === "note" || targetKind === "note" || isSource(targetKind)) continue;
    const key = `${source}>${target}`;
    if (pairs.has(key) || createsCycle(edges, source, target)) continue;
    pairs.add(key);
    edges.push({ id: id(e.id, () => uid("e")), source, target, rate: num(e.rate, 100, 0, 1) });
  }
  const goal = typeof raw.goalId === "string" && kindOf.has(raw.goalId) && kindOf.get(raw.goalId) !== "note" ? raw.goalId : null;
  return {
    id: id(raw.id, () => uid("v")),
    name: text(raw.name, 60) || (index === 0 ? "Original" : `Variante ${variantLetter(index)}`),
    goalId: goal,
    nodes,
    edges,
  };
}

/** Valida o documento vindo do editor. Null quando não dá para aproveitar nada. */
export function sanitizeDoc(input: unknown): FunnelDoc | null {
  if (!input || typeof input !== "object") return null;
  const raw = input as Record<string, unknown>;
  const variants: FunnelVariant[] = [];
  const ids = new Set<string>();
  for (const item of Array.isArray(raw.variants) ? raw.variants.slice(0, FUNNEL_LIMITS.variants) : []) {
    const variant = sanitizeVariant(item, variants.length);
    if (!variant) continue;
    if (ids.has(variant.id)) variant.id = uid("v");
    ids.add(variant.id);
    variants.push(variant);
  }
  if (variants.length === 0) return null;
  const status = FUNNEL_STATUS_ORDER.includes(raw.status as FunnelStatus) ? (raw.status as FunnelStatus) : "draft";
  const productId = typeof raw.productId === "string" && /^[0-9a-f-]{36}$/i.test(raw.productId) ? raw.productId : null;
  const winnerId = typeof raw.winnerId === "string" && ids.has(raw.winnerId) ? raw.winnerId : null;
  return {
    name: text(raw.name, 120) || "Funil sem nome",
    description: text(raw.description, 2000),
    status,
    productId,
    winnerId,
    variants,
  };
}

/** Variantes guardadas no banco (jsonb) → tipo do editor. */
export function readVariants(value: unknown): FunnelVariant[] {
  const doc = sanitizeDoc({ variants: value });
  return doc?.variants ?? [emptyVariant()];
}

export function emptyVariant(): FunnelVariant {
  return { id: uid("v"), name: "Original", goalId: null, nodes: [], edges: [] };
}

/* ---------- Modelos ---------- */
type TemplateStep = Omit<Partial<FunnelNode>, "id" | "kind" | "x" | "y"> & { key: string; kind: StepKind; col: number; row: number };

function build(steps: TemplateStep[], links: [string, string, number][], goal: string | null): FunnelVariant {
  const ids = new Map(steps.map((s) => [s.key, uid()]));
  const nodes = steps.map(({ key, kind, col, row, ...patch }) =>
    newNode(kind, { x: col * COLUMN_GAP, y: row * ROW_GAP }, { ...patch, id: ids.get(key)! }),
  );
  const edges = links.map(([from, to, rate]) => ({ id: uid("e"), source: ids.get(from)!, target: ids.get(to)!, rate }));
  return { id: uid("v"), name: "Original", goalId: goal ? ids.get(goal)! : null, nodes, edges };
}

export type FunnelTemplate = {
  key: string;
  name: string;
  description: string;
  /** Sequência mostrada no cartão do modelo. */
  preview: StepKind[];
  build: (options?: { value?: number }) => FunnelVariant;
};

export const FUNNEL_TEMPLATES: FunnelTemplate[] = [
  {
    key: "ai",
    name: "Site → Agente de IA → Plataforma",
    description: "Tráfego no site, um agente de IA qualifica e a pessoa cria a conta na plataforma.",
    preview: ["ads", "site", "ai_agent", "platform"],
    build: (options) =>
      build(
        [
          { key: "ads", kind: "ads", col: 0, row: -0.6, name: "Anúncios (Meta)", volume: 6000, cost: 3000 },
          { key: "social", kind: "social", col: 0, row: 0.6, name: "Instagram orgânico", volume: 2000 },
          { key: "site", kind: "site", col: 1, row: 0 },
          { key: "agent", kind: "ai_agent", col: 2, row: 0, unitCost: 0.4, note: "Responde na hora, tira dúvidas e qualifica." },
          { key: "platform", kind: "platform", col: 3, row: 0, value: options?.value ?? 197 },
          {
            key: "hypothesis",
            kind: "note",
            col: 2,
            row: -1.75,
            name: "Hipótese",
            note: "O agente responde em segundos e converte mais que o formulário de contato.",
          },
        ],
        [
          ["ads", "site", 100],
          ["social", "site", 100],
          ["site", "agent", 12],
          ["agent", "platform", 25],
        ],
        "platform",
      ),
  },
  {
    key: "b2b",
    name: "Anúncio → Landing page → WhatsApp → Reunião",
    description: "Venda consultiva: captura na landing page, conversa no WhatsApp e reunião até o contrato.",
    preview: ["ads", "landing", "whatsapp", "meeting", "deal"],
    build: (options) =>
      build(
        [
          { key: "ads", kind: "ads", col: 0, row: 0, name: "Google Ads", volume: 3000, cost: 4500 },
          { key: "landing", kind: "landing", col: 1, row: 0 },
          { key: "form", kind: "form", col: 2, row: 0 },
          { key: "whatsapp", kind: "whatsapp", col: 3, row: 0 },
          { key: "meeting", kind: "meeting", col: 4, row: 0 },
          { key: "deal", kind: "deal", col: 5, row: 0, value: options?.value ?? 6000 },
        ],
        [
          ["ads", "landing", 100],
          ["landing", "form", 8],
          ["form", "whatsapp", 70],
          ["whatsapp", "meeting", 40],
          ["meeting", "deal", 30],
        ],
        "deal",
      ),
  },
  {
    key: "content",
    name: "Conteúdo → Lista → E-mails → Checkout",
    description: "Conteúdo atrai, a lista captura e a sequência de e-mails leva à compra online.",
    preview: ["social", "content", "form", "email", "checkout"],
    build: (options) =>
      build(
        [
          { key: "social", kind: "social", col: 0, row: 0, volume: 20000 },
          { key: "content", kind: "content", col: 1, row: 0, name: "Vídeo de conteúdo" },
          { key: "form", kind: "form", col: 2, row: 0, name: "Lista de espera" },
          { key: "email", kind: "email", col: 3, row: 0 },
          { key: "checkout", kind: "checkout", col: 4, row: 0, value: options?.value ?? 997 },
        ],
        [
          ["social", "content", 100],
          ["content", "form", 5],
          ["form", "email", 90],
          ["email", "checkout", 6],
        ],
        "checkout",
      ),
  },
  {
    key: "blank",
    name: "Em branco",
    description: "Comece do zero e arraste as etapas para o quadro.",
    preview: [],
    build: () => emptyVariant(),
  },
];

export function templateByKey(key: string | null | undefined) {
  return FUNNEL_TEMPLATES.find((t) => t.key === key) ?? FUNNEL_TEMPLATES[0];
}
