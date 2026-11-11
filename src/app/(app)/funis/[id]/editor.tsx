"use client";

import "@xyflow/react/dist/base.css";
import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type DragEvent, type ReactNode } from "react";
import Link from "next/link";
import {
  Background,
  BackgroundVariant,
  Panel,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type Connection,
  type EdgeChange,
  type NodeChange,
  type OnConnectEnd,
  type XYPosition,
} from "@xyflow/react";
import {
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CloudOff,
  Columns3,
  Copy,
  Loader2,
  Maximize,
  Minus,
  MoreHorizontal,
  Pencil,
  Plus,
  Redo2,
  Trash2,
  TriangleAlert,
  Trophy,
  Undo2,
  WandSparkles,
  Workflow,
} from "lucide-react";
import { toast } from "sonner";
import { formatMoney } from "@/lib/format";
import {
  FUNNEL_LIMITS,
  FUNNEL_STATUSES,
  FUNNEL_STATUS_ORDER,
  FUNNEL_TEMPLATES,
  LAYOUT,
  NODE_SIZE,
  STEP_GROUPS,
  STEP_GROUP_ORDER,
  STEP_KINDS,
  STEP_KIND_ORDER,
  autoLayout,
  createsCycle,
  emptyVariant,
  formatMultiple,
  formatPeople,
  formatShare,
  isSource,
  isStepKind,
  newNode,
  simulate,
  suggestedRate,
  templateByKey,
  uid,
  variantLetter,
  type FunnelDoc,
  type FunnelEdge,
  type FunnelNode,
  type FunnelSim,
  type FunnelVariant,
  type StepKind,
} from "@/lib/funnels";
import { cn } from "@/lib/utils";
import { DotGlyph } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm";
import { Dialog, DialogBody, DialogContent, DialogFooter } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useAction } from "@/components/ui/use-action";
import { deleteFunnel, duplicateFunnel, saveFunnel, type SaveFunnelResult } from "../actions";
import { TemplateChain } from "../template-chain";
import { CanvasContext, EDGE_TYPES, NODE_TYPES, type CanvasEdge, type CanvasNode, type CanvasView } from "./canvas";
import { CompareDialog } from "./compare-dialog";
import { Inspector, type Product, type Selection } from "./inspector";
import { DRAG_TYPE, Palette } from "./palette";
import { savedFunnels } from "./saved-cache";

/*
 * Editor do funil: quadro (React Flow) no meio, etapas à esquerda e detalhes à direita.
 * O documento inteiro (todas as variantes) mora num só estado com histórico para desfazer,
 * e é salvo sozinho no banco pouco depois de cada alteração.
 */

type Snapshot = { doc: FunnelDoc; variantId: string };
type History = Snapshot & {
  past: Snapshot[];
  future: Snapshot[];
  /** A próxima alteração abre um passo novo no desfazer (marcado ao focar um campo, começar a arrastar…). */
  armed: boolean;
};
type SaveState = {
  saved: FunnelDoc;
  failed: FunnelDoc | null;
  /** `conflict`: o banco tem uma versão mais nova (outra aba ou outra pessoa); nada é gravado até decidir. */
  status: "idle" | "saving" | "error" | "conflict";
  error: string | null;
};
type QuickAdd = { from: string; client: XYPosition; local: XYPosition };

const HISTORY_LIMIT = 100;
const EMPTY_SELECTION: Selection = { nodes: [], edges: [] };
const FIT = { padding: 0.25, maxZoom: 1, duration: 250 } as const;
const GRID = 16;

const ARIA_LABELS = {
  "node.a11yDescription.default": "Enter ou Espaço seleciona a etapa. Delete exclui e Esc cancela.",
  "node.a11yDescription.keyboardDisabled":
    "Enter ou Espaço seleciona a etapa. Depois, as setas movem a etapa. Delete exclui e Esc cancela.",
  "node.a11yDescription.ariaLiveMessage": ({ x, y }: { direction: string; x: number; y: number }) => `Etapa movida para x ${x}, y ${y}`,
  "edge.a11yDescription.default": "Enter ou Espaço seleciona a conexão. Depois, Delete exclui e Esc cancela.",
  "handle.ariaLabel": "Ponto de conexão",
};

/* ---------- Funções puras de apoio ---------- */

/** Só o que muda o cálculo (sem posições nem textos): arrastar cards não refaz a simulação. */
function simShape(v: FunnelVariant) {
  return JSON.stringify([
    v.goalId,
    v.edges.map((e) => [e.id, e.source, e.target, e.rate]),
    v.nodes.map((n) => [n.id, n.kind, n.volume, n.cost, n.unitCost, n.value, n.actual]),
  ]);
}

function fromShape(shape: string): FunnelVariant {
  const [goalId, edges, nodes] = JSON.parse(shape) as [
    string | null,
    [string, string, string, number][],
    [string, StepKind, number, number, number, number, number | null][],
  ];
  return {
    id: "",
    name: "",
    goalId,
    edges: edges.map(([id, source, target, rate]) => ({ id, source, target, rate })),
    nodes: nodes.map(([id, kind, volume, cost, unitCost, value, actual]) => ({
      id,
      kind,
      volume,
      cost,
      unitCost,
      value,
      actual,
      x: 0,
      y: 0,
      name: "",
      note: "",
      url: "",
    })),
  };
}

function applyPicks(list: string[], picks: Map<string, boolean>) {
  const set = new Set(list);
  for (const [id, on] of picks) {
    if (on) set.add(id);
    else set.delete(id);
  }
  const next = [...set];
  return next.length === list.length && next.every((id, i) => id === list[i]) ? list : next;
}

function snap(p: XYPosition): XYPosition {
  return { x: Math.round(p.x / GRID) * GRID, y: Math.round(p.y / GRID) * GRID };
}

function overlaps(p: XYPosition, height: number, nodes: FunnelNode[]) {
  return nodes.some((n) => Math.abs(n.x - p.x) < NODE_SIZE.width - 24 && Math.abs(n.y - p.y) < Math.max(height, NODE_SIZE.height) - 12);
}

/** Desloca a posição em passos até não cobrir outro card. */
function freeSpot(start: XYPosition, height: number, nodes: FunnelNode[], step: XYPosition) {
  let p = start;
  for (let i = 0; i < 40 && overlaps(p, height, nodes); i++) p = { x: p.x + step.x, y: p.y + step.y };
  return p;
}

/** Quanto mover (no eixo) para o trecho start–end caber entre min e max; se não couber, alinha no início. */
function shiftInto(start: number, end: number, min: number, max: number) {
  if (start < min) return min - start;
  if (end > max) return Math.max(max - end, min - start);
  return 0;
}

/** `a` é uma versão (updated_at do banco) mais nova que `b`? */
function isNewer(a: string, b: string) {
  return Date.parse(a) > Date.parse(b);
}

function isTyping(target: EventTarget | null) {
  return target instanceof HTMLElement && Boolean(target.closest("input, textarea, select, [contenteditable='true'], [role='dialog'], [role='menu']"));
}

/* ---------- Editor ---------- */

type EditorProps = {
  id: string;
  initial: FunnelDoc;
  /** updated_at do funil quando a página foi carregada. */
  version: string;
  products: Product[];
};

export function FunnelEditor(props: EditorProps) {
  return (
    <ReactFlowProvider>
      <TooltipProvider delayDuration={250}>
        <Editor {...props} />
      </TooltipProvider>
    </ReactFlowProvider>
  );
}

function Editor({ id, initial, version, products }: EditorProps) {
  const flow = useReactFlow<CanvasNode, CanvasEdge>();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const variantNameId = useId();

  /* ----- Documento e histórico ----- */
  // Se esta aba já salvou algo mais novo do que veio do servidor (página antiga no cache
  // do navegador), parte do que foi salvo: abrir o funil nunca desfaz alterações.
  const [start] = useState(() => {
    const cached = savedFunnels.get(id);
    return cached && isNewer(cached.version, version) ? cached : { doc: initial, version };
  });
  const [history, setHistory] = useState<History>(() => ({
    doc: start.doc,
    variantId: start.doc.variants[0].id,
    past: [],
    future: [],
    armed: false,
  }));
  const { doc } = history;
  const variantIndex = Math.max(
    0,
    doc.variants.findIndex((v) => v.id === history.variantId),
  );
  const variant = doc.variants[variantIndex];
  const letter = variantLetter(variantIndex);

  /** Aplica uma mudança. Vira um passo do desfazer quando `record` (ou depois de `commit`). */
  const apply = useCallback((fn: (state: Snapshot) => Snapshot, record: boolean) => {
    setHistory((h) => {
      const next = fn({ doc: h.doc, variantId: h.variantId });
      const variantId = next.doc.variants.some((v) => v.id === next.variantId) ? next.variantId : next.doc.variants[0].id;
      if (next.doc === h.doc && variantId === h.variantId) return h;
      if (next.doc === h.doc || !(record || h.armed)) return { ...h, doc: next.doc, variantId };
      return {
        doc: next.doc,
        variantId,
        past: [...h.past, { doc: h.doc, variantId: h.variantId }].slice(-HISTORY_LIMIT),
        future: [],
        armed: false,
      };
    });
  }, []);

  const commit = useCallback(() => setHistory((h) => (h.armed ? h : { ...h, armed: true })), []);

  const editDoc = useCallback(
    (fn: (doc: FunnelDoc) => FunnelDoc, record = true) => apply((s) => ({ ...s, doc: fn(s.doc) }), record),
    [apply],
  );

  const editVariant = useCallback(
    (fn: (variant: FunnelVariant) => FunnelVariant, record = true) =>
      apply((s) => {
        let changed = false;
        const variants = s.doc.variants.map((v) => {
          if (v.id !== s.variantId) return v;
          const next = fn(v);
          if (next !== v) changed = true;
          return next;
        });
        return changed ? { ...s, doc: { ...s.doc, variants } } : s;
      }, record),
    [apply],
  );

  const undo = useCallback(
    () =>
      setHistory((h) => {
        const prev = h.past.at(-1);
        if (!prev) return h;
        return {
          doc: prev.doc,
          variantId: prev.variantId,
          past: h.past.slice(0, -1),
          future: [{ doc: h.doc, variantId: prev.variantId }, ...h.future].slice(0, HISTORY_LIMIT),
          armed: false,
        };
      }),
    [],
  );

  const redo = useCallback(
    () =>
      setHistory((h) => {
        const next = h.future[0];
        if (!next) return h;
        const variantId = next.doc.variants.some((v) => v.id === next.variantId) ? next.variantId : next.doc.variants[0].id;
        return {
          doc: next.doc,
          variantId,
          past: [...h.past, { doc: h.doc, variantId: h.variantId }].slice(-HISTORY_LIMIT),
          future: h.future.slice(1),
          armed: false,
        };
      }),
    [],
  );

  /* ----- Estado da tela ----- */
  const [selection, setSelection] = useState<Selection>(EMPTY_SELECTION);
  const [measured, setMeasured] = useState<Record<string, { width: number; height: number }>>({});
  const [view, setView] = useState<CanvasView>("plan");
  const [compareOpen, setCompareOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [quickAdd, setQuickAdd] = useState<QuickAdd | null>(null);
  const other = useAction();

  /* ----- Simulação ----- */
  const shape = simShape(variant);
  const sim = useMemo(() => simulate(fromShape(shape)), [shape]);
  const sims = useMemo(() => doc.variants.map((v) => simulate(v)), [doc.variants]);

  /* ----- Regras de ligação ----- */
  const kindsKey = variant.nodes.map((n) => `${n.id}:${n.kind}`).join("|");
  const kinds = useMemo(
    () => new Map(kindsKey ? kindsKey.split("|").map((pair) => pair.split(":") as [string, StepKind]) : []),
    [kindsKey],
  );
  const edgeList = variant.edges;
  const canConnect = useCallback(
    (source: string, target: string) => {
      if (source === target) return false;
      const from = kinds.get(source);
      const to = kinds.get(target);
      if (!from || !to || from === "note" || to === "note" || isSource(to)) return false;
      if (edgeList.some((e) => e.source === source && e.target === target)) return false;
      return !createsCycle(edgeList, source, target);
    },
    [kinds, edgeList],
  );

  const pathEdges = useMemo(() => new Set(sim.pathEdges), [sim]);
  const selectEdge = useCallback((edgeId: string) => setSelection({ nodes: [], edges: [edgeId] }), []);
  const canvasState = useMemo(
    () => ({ sim, view, pathEdges, selectEdge, canConnect }),
    [sim, view, pathEdges, selectEdge, canConnect],
  );

  /* ----- Nós e conexões do React Flow (derivados do documento) ----- */
  const selectedNodes = useMemo(() => new Set(selection.nodes), [selection.nodes]);
  const selectedEdges = useMemo(() => new Set(selection.edges), [selection.edges]);
  const nodes = useMemo<CanvasNode[]>(
    () =>
      variant.nodes.map((n) => ({
        id: n.id,
        type: n.kind === "note" ? "note" : "step",
        position: { x: n.x, y: n.y },
        data: n,
        selected: selectedNodes.has(n.id),
        measured: measured[n.id],
      })),
    [variant.nodes, selectedNodes, measured],
  );
  const edges = useMemo<CanvasEdge[]>(
    () =>
      variant.edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        type: "flow",
        data: { rate: e.rate },
        selected: selectedEdges.has(e.id),
      })),
    [variant.edges, selectedEdges],
  );

  const onNodesChange = useCallback(
    (changes: NodeChange<CanvasNode>[]) => {
      const moved = new Map<string, XYPosition>();
      const sizes = new Map<string, { width: number; height: number }>();
      const picks = new Map<string, boolean>();
      for (const change of changes) {
        if (change.type === "position" && change.position) moved.set(change.id, change.position);
        else if (change.type === "dimensions" && change.dimensions) sizes.set(change.id, change.dimensions);
        else if (change.type === "select") picks.set(change.id, change.selected);
      }
      if (moved.size) {
        editVariant(
          (v) => ({
            ...v,
            nodes: v.nodes.map((n) => {
              const p = moved.get(n.id);
              return p ? { ...n, x: Math.round(p.x), y: Math.round(p.y) } : n;
            }),
          }),
          false,
        );
      }
      if (sizes.size) {
        setMeasured((current) => {
          const updates = [...sizes].filter(([nodeId, size]) => current[nodeId]?.width !== size.width || current[nodeId]?.height !== size.height);
          return updates.length ? { ...current, ...Object.fromEntries(updates) } : current;
        });
      }
      if (picks.size) {
        setSelection((s) => {
          const next = applyPicks(s.nodes, picks);
          return next === s.nodes ? s : { ...s, nodes: next };
        });
      }
    },
    [editVariant],
  );

  const onEdgesChange = useCallback((changes: EdgeChange<CanvasEdge>[]) => {
    const picks = new Map<string, boolean>();
    for (const change of changes) if (change.type === "select") picks.set(change.id, change.selected);
    if (!picks.size) return;
    setSelection((s) => {
      const next = applyPicks(s.edges, picks);
      return next === s.edges ? s : { ...s, edges: next };
    });
  }, []);

  /* ----- Editar o quadro ----- */
  const removeItems = useCallback(
    (nodeIds: string[], edgeIds: string[]) => {
      if (nodeIds.length === 0 && edgeIds.length === 0) return;
      const goneNodes = new Set(nodeIds);
      const goneEdges = new Set(edgeIds);
      editVariant((v) => ({
        ...v,
        goalId: v.goalId && goneNodes.has(v.goalId) ? null : v.goalId,
        nodes: v.nodes.filter((n) => !goneNodes.has(n.id)),
        edges: v.edges.filter((e) => !goneEdges.has(e.id) && !goneNodes.has(e.source) && !goneNodes.has(e.target)),
      }));
      setSelection((s) => ({ nodes: s.nodes.filter((n) => !goneNodes.has(n)), edges: s.edges.filter((e) => !goneEdges.has(e)) }));
    },
    [editVariant],
  );

  const connect = useCallback(
    (source: string, target: string) => {
      if (!canConnect(source, target)) return;
      if (edgeList.length >= FUNNEL_LIMITS.edges) {
        toast.error(`Cada variante comporta até ${FUNNEL_LIMITS.edges} conexões.`);
        return;
      }
      const edgeId = uid("e");
      editVariant((v) => ({ ...v, edges: [...v.edges, { id: edgeId, source, target, rate: suggestedRate(v, source) }] }));
      // A conexão nova fica selecionada: o painel abre direto na taxa de passagem
      setSelection({ nodes: [], edges: [edgeId] });
    },
    [canConnect, edgeList.length, editVariant],
  );

  const onConnect = useCallback((c: Connection) => connect(c.source, c.target), [connect]);
  const isValidConnection = useCallback((c: Connection | CanvasEdge) => canConnect(c.source, c.target), [canConnect]);

  /** Soltar a ligação em cima do card (fora da bolinha) também liga; no vazio, abre a lista de etapas. */
  const onConnectEnd = useCallback<OnConnectEnd>(
    (event, state) => {
      if (state.isValid || !state.fromNode) return;
      const point = "changedTouches" in event ? event.changedTouches[0] : event;
      if (!point) return;
      const fromId = state.fromNode.id;
      const element = document.elementFromPoint(point.clientX, point.clientY);
      const nodeElement = element?.closest<HTMLElement>(".react-flow__node");
      if (nodeElement) {
        const targetId = nodeElement.dataset.id;
        if (targetId && canConnect(fromId, targetId)) connect(fromId, targetId);
        return;
      }
      const rect = wrapperRef.current?.getBoundingClientRect();
      if (!rect || !element?.closest(".react-flow__pane")) return;
      setQuickAdd({
        from: fromId,
        client: { x: point.clientX, y: point.clientY },
        local: { x: point.clientX - rect.left, y: point.clientY - rect.top },
      });
    },
    [canConnect, connect],
  );

  function visibleBounds() {
    const rect = wrapperRef.current?.getBoundingClientRect();
    if (!rect) return null;
    return {
      topLeft: flow.screenToFlowPosition({ x: rect.left + 48, y: rect.top + 48 }),
      bottomRight: flow.screenToFlowPosition({ x: rect.right - 48, y: rect.bottom - 48 }),
      center: flow.screenToFlowPosition({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }),
    };
  }

  /**
   * Garante que o card apareça na tela, só se ele estiver (mesmo em parte) fora da área visível.
   * `nudge` desloca o mínimo para caber (card recém-criado, perto de onde se está olhando);
   * `center` centraliza (ir até uma etapa a partir do painel).
   */
  function reveal(p: XYPosition, height: number, mode: "nudge" | "center" = "nudge") {
    const bounds = visibleBounds();
    if (!bounds) return;
    const dx = shiftInto(p.x, p.x + NODE_SIZE.width, bounds.topLeft.x, bounds.bottomRight.x);
    const dy = shiftInto(p.y, p.y + height, bounds.topLeft.y, bounds.bottomRight.y);
    if (dx === 0 && dy === 0) return;
    if (mode === "center") {
      void flow.setCenter(p.x + NODE_SIZE.width / 2, p.y + height / 2, { zoom: flow.getZoom(), duration: 300 });
      return;
    }
    const viewport = flow.getViewport();
    void flow.setViewport(
      { x: viewport.x + dx * viewport.zoom, y: viewport.y + dy * viewport.zoom, zoom: viewport.zoom },
      { duration: 250 },
    );
  }

  function addStep(kind: StepKind, options: { at?: XYPosition; anchor?: "center" | "left"; from?: string | null } = {}) {
    if (variant.nodes.length >= FUNNEL_LIMITS.nodes) {
      toast.error(`Cada variante comporta até ${FUNNEL_LIMITS.nodes} etapas.`);
      return;
    }
    const height = kind === "note" ? 96 : NODE_SIZE.height;
    const fromNode = options.from ? variant.nodes.find((n) => n.id === options.from) : undefined;
    // Liga na etapa de origem quando faz sentido (origens e notas não recebem ligação)
    const chain = fromNode && fromNode.kind !== "note" && kind !== "note" && !isSource(kind) ? fromNode : undefined;

    let position: XYPosition;
    if (options.at) {
      position =
        options.anchor === "left"
          ? { x: options.at.x + 8, y: options.at.y - height / 2 }
          : { x: options.at.x - NODE_SIZE.width / 2, y: options.at.y - height / 2 };
      position = snap(position);
    } else if (chain) {
      position = freeSpot(snap({ x: chain.x + LAYOUT.column, y: chain.y }), height, variant.nodes, { x: 0, y: LAYOUT.row });
    } else {
      const center = visibleBounds()?.center ?? { x: 0, y: 0 };
      position = freeSpot(snap({ x: center.x - NODE_SIZE.width / 2, y: center.y - height / 2 }), height, variant.nodes, {
        x: GRID * 2,
        y: GRID * 2,
      });
    }

    const node = newNode(kind, position);
    const edgeId = chain ? uid("e") : null;
    editVariant((v) => ({
      ...v,
      nodes: [...v.nodes, node],
      edges: chain && edgeId ? [...v.edges, { id: edgeId, source: chain.id, target: node.id, rate: suggestedRate(v, chain.id) }] : v.edges,
    }));
    setSelection({ nodes: [node.id], edges: [] });
    reveal(position, height);
  }

  function onDragOver(event: DragEvent) {
    if (!event.dataTransfer.types.includes(DRAG_TYPE)) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }

  function onDrop(event: DragEvent) {
    const kind = event.dataTransfer.getData(DRAG_TYPE);
    if (!isStepKind(kind)) return;
    event.preventDefault();
    addStep(kind, { at: flow.screenToFlowPosition({ x: event.clientX, y: event.clientY }) });
  }

  function pickQuick(kind: StepKind) {
    if (!quickAdd) return;
    addStep(kind, { at: flow.screenToFlowPosition(quickAdd.client), anchor: "left", from: quickAdd.from });
    setQuickAdd(null);
  }

  function organize() {
    const positions = autoLayout(variant);
    editVariant((v) => ({ ...v, nodes: v.nodes.map((n) => (positions[n.id] ? { ...n, ...positions[n.id] } : n)) }));
    void flow.fitView(FIT);
  }

  function applyTemplate(key: string) {
    const price = products.find((p) => p.id === doc.productId)?.price ?? 0;
    const built = templateByKey(key).build({ value: price > 0 ? price : undefined });
    editVariant((v) => ({
      ...v,
      goalId: built.goalId,
      nodes: [...v.nodes.filter((n) => n.kind === "note"), ...built.nodes],
      edges: built.edges,
    }));
    setSelection(EMPTY_SELECTION);
    void flow.fitView(FIT);
  }

  /* ----- Painel de detalhes ----- */
  const onNode = useCallback(
    (nodeId: string, patch: Partial<FunnelNode>) =>
      editVariant((v) => ({ ...v, nodes: v.nodes.map((n) => (n.id === nodeId ? { ...n, ...patch } : n)) }), false),
    [editVariant],
  );
  const onEdge = useCallback(
    (edgeId: string, patch: Partial<FunnelEdge>) =>
      editVariant((v) => ({ ...v, edges: v.edges.map((e) => (e.id === edgeId ? { ...e, ...patch } : e)) }), false),
    [editVariant],
  );
  const onGoal = useCallback((nodeId: string | null) => editVariant((v) => ({ ...v, goalId: nodeId }), false), [editVariant]);
  const onVariantName = useCallback((name: string) => editVariant((v) => ({ ...v, name }), false), [editVariant]);

  function onDocPatch(patch: Partial<FunnelDoc>) {
    editDoc((d) => ({ ...d, ...patch }), false);
    // Produto escolhido: a etapa de conversão sem valor passa a valer o preço dele
    if (patch.productId) {
      const price = products.find((p) => p.id === patch.productId)?.price ?? 0;
      const goal = sim.goalId ? variant.nodes.find((n) => n.id === sim.goalId) : undefined;
      if (price > 0 && goal && goal.value === 0) {
        onNode(goal.id, { value: price });
        toast.success(`“${goal.name}” passou a valer ${formatMoney(price)} por pessoa.`);
      }
    }
  }

  function focusSelection(next: Selection) {
    setSelection(next);
    const node = next.nodes.length === 1 ? variant.nodes.find((n) => n.id === next.nodes[0]) : undefined;
    if (node) reveal({ x: node.x, y: node.y }, measured[node.id]?.height ?? NODE_SIZE.height, "center");
  }

  /* ----- Variantes ----- */
  function focusVariantName() {
    if (!window.matchMedia("(min-width: 1024px)").matches) return;
    window.requestAnimationFrame(() => {
      const input = document.getElementById(variantNameId);
      if (input instanceof HTMLInputElement) {
        input.focus();
        input.select();
      }
    });
  }

  /** Menus de variante: se o nome da variante ganhou o foco (criar, renomear), o menu não o devolve ao botão. */
  function keepNameFocus(event: Event) {
    if (document.activeElement?.id === variantNameId) event.preventDefault();
  }

  function selectVariant(variantId: string) {
    if (variantId === variant.id) return;
    apply((s) => ({ ...s, variantId }), false);
    setSelection(EMPTY_SELECTION);
    setQuickAdd(null);
    void flow.fitView(FIT);
  }

  function addVariant(mode: "copy" | "blank", sourceId: string = variant.id) {
    if (doc.variants.length >= FUNNEL_LIMITS.variants) {
      toast.error(`Cada funil comporta até ${FUNNEL_LIMITS.variants} variantes.`);
      return;
    }
    const newId = uid("v");
    const base = mode === "blank" ? emptyVariant() : null;
    apply((s) => {
      const source = s.doc.variants.find((v) => v.id === sourceId) ?? s.doc.variants[0];
      const name = `Variante ${variantLetter(s.doc.variants.length)}`;
      // A cópia mantém os ids das etapas (dá para comparar etapa a etapa), mas não o resultado real
      const fresh: FunnelVariant = base
        ? { ...base, id: newId, name }
        : {
            id: newId,
            name,
            goalId: source.goalId,
            nodes: source.nodes.map((n) => ({ ...n, actual: null })),
            edges: source.edges.map((e) => ({ ...e })),
          };
      return { doc: { ...s.doc, variants: [...s.doc.variants, fresh] }, variantId: newId };
    }, true);
    setSelection(EMPTY_SELECTION);
    setQuickAdd(null);
    void flow.fitView(FIT);
    focusVariantName();
  }

  function removeVariant(variantId: string) {
    if (doc.variants.length <= 1) return;
    const removed = doc.variants.find((v) => v.id === variantId);
    apply((s) => {
      const index = s.doc.variants.findIndex((v) => v.id === variantId);
      const variants = s.doc.variants.filter((v) => v.id !== variantId);
      return {
        doc: { ...s.doc, variants, winnerId: s.doc.winnerId === variantId ? null : s.doc.winnerId },
        variantId: s.variantId === variantId ? variants[Math.max(0, index - 1)].id : s.variantId,
      };
    }, true);
    setSelection(EMPTY_SELECTION);
    void flow.fitView(FIT);
    toast(`Variante “${removed?.name ?? ""}” excluída`, { action: { label: "Desfazer", onClick: undo } });
  }

  function setWinner(variantId: string | null) {
    editDoc((d) => ({ ...d, winnerId: variantId }));
    const chosen = doc.variants.find((v) => v.id === variantId);
    if (chosen) toast.success(`“${chosen.name}” marcada como vencedora`);
  }

  /* ----- Salvamento automático ----- */
  const [save, setSave] = useState<SaveState>(() => ({ saved: start.doc, failed: null, status: "idle", error: null }));
  const [conflictOpen, setConflictOpen] = useState(false);
  const docRef = useRef(doc);
  const savedRef = useRef(start.doc);
  /** Versão do banco sobre a qual estamos editando; salvar só grava se ela ainda for a atual. */
  const versionRef = useRef(start.version);
  const inFlightRef = useRef<Promise<boolean> | null>(null);
  const errorShownRef = useRef(false);
  /** O funil foi excluído ou a página vai recarregar: não tenta salvar mais nada. */
  const closedRef = useRef(false);

  useLayoutEffect(() => {
    docRef.current = doc;
  }, [doc]);

  /** Salva o documento atual. `overwrite` grava mesmo que o banco tenha uma versão mais nova. */
  const persist = useCallback(
    async (mode: "normal" | "overwrite" = "normal"): Promise<boolean> => {
      // Um salvamento por vez; o seguinte sempre leva a versão mais recente
      while (inFlightRef.current) await inFlightRef.current;
      const target = docRef.current;
      const overwrite = mode === "overwrite";
      if (closedRef.current || (target === savedRef.current && !overwrite)) return true;
      const task = (async () => {
        setSave((s) => (s.status === "saving" ? s : { ...s, status: "saving" }));
        let result: SaveFunnelResult;
        try {
          result = await saveFunnel(id, target, overwrite ? null : versionRef.current);
        } catch {
          result = { ok: false, error: "Sem conexão com o servidor. As alterações continuam aqui; tente de novo." };
        }
        if (result.ok) {
          savedRef.current = target;
          versionRef.current = result.version;
          savedFunnels.set(id, { doc: target, version: result.version });
          errorShownRef.current = false;
          setSave({ saved: target, failed: null, status: "idle", error: null });
          return true;
        }
        const message = result.error;
        if (result.conflict) {
          setSave((s) => ({ ...s, failed: target, status: "conflict", error: message }));
          setConflictOpen(true);
          return false;
        }
        if (!errorShownRef.current) {
          errorShownRef.current = true;
          toast.error(message);
        }
        setSave((s) => ({ ...s, failed: target, status: "error", error: message }));
        return false;
      })();
      inFlightRef.current = task;
      try {
        return await task;
      } finally {
        if (inFlightRef.current === task) inFlightRef.current = null;
      }
    },
    [id, setConflictOpen],
  );

  /** Conflito: descarta o que está aqui e abre a versão do banco. */
  function loadSaved() {
    closedRef.current = true;
    savedFunnels.delete(id);
    window.location.reload();
  }

  /** Conflito: grava esta versão por cima da que está no banco. */
  function keepMine() {
    setConflictOpen(false);
    void persist("overwrite");
  }

  const dirty = doc !== save.saved;
  useEffect(() => {
    // Depois de uma falha, só tenta de novo quando algo mudar (ou pelo botão).
    // Com conflito, espera a decisão de quem está editando.
    if (!dirty || doc === save.failed || save.status === "conflict") return;
    const timer = window.setTimeout(() => void persist(), 700);
    return () => window.clearTimeout(timer);
  }, [doc, dirty, save, persist]);

  // Ao sair da página (ou ela ficar oculta pela navegação), salva o que faltar
  useLayoutEffect(
    () => () => {
      void persist();
    },
    [persist],
  );

  const busy = dirty || save.status === "saving";
  useEffect(() => {
    if (!busy) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!closedRef.current) event.preventDefault();
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [busy]);

  /* ----- Atalhos ----- */
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const mod = event.ctrlKey || event.metaKey;
      const key = event.key.toLowerCase();
      if (mod && key === "s") {
        event.preventDefault();
        void persist();
        return;
      }
      if (isTyping(event.target)) return;
      if (mod && key === "z") {
        event.preventDefault();
        if (event.shiftKey) redo();
        else undo();
      } else if (mod && key === "y") {
        event.preventDefault();
        redo();
      } else if (key === "escape") {
        setSelection(EMPTY_SELECTION);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [persist, undo, redo]);

  /* ----- Ações do funil ----- */
  function duplicate() {
    other.run(async () => {
      const ok = await persist();
      if (!ok) return { ok: false, error: "Não foi possível salvar as últimas alterações. Tente de novo antes de duplicar." };
      return duplicateFunnel(id);
    });
  }

  async function remove() {
    closedRef.current = true;
    const result = await deleteFunnel(id);
    // Sucesso redireciona para a lista; se voltou aqui, deu erro
    closedRef.current = false;
    return result;
  }

  /* ----- Render ----- */
  const empty = !variant.nodes.some((n) => n.kind !== "note");
  const chainNode =
    selection.nodes.length === 1 && selection.edges.length === 0
      ? variant.nodes.find((n) => n.id === selection.nodes[0] && n.kind !== "note")
      : undefined;
  const status = FUNNEL_STATUSES[doc.status];
  const quickFrom = quickAdd ? variant.nodes.find((n) => n.id === quickAdd.from) : undefined;

  return (
    <CanvasContext value={canvasState}>
      <div className="flex min-h-0 flex-1 flex-col">
        {/* Cabeçalho: nome, salvamento, status */}
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-line bg-panel px-3 sm:px-6 lg:rounded-t-xl">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <Link
              href="/funis"
              aria-label="Voltar para Funis"
              className="grid size-7 shrink-0 place-items-center rounded-lg text-ink-2 hover:bg-hover sm:hidden"
            >
              <ChevronLeft className="size-4" />
            </Link>
            <span className="hidden size-7 shrink-0 place-items-center rounded-lg border border-line bg-subtle text-ink-2 sm:grid [&_svg]:size-4">
              <Workflow />
            </span>
            <Link href="/funis" className="hidden shrink-0 text-[14px] text-ink-3 hover:text-ink sm:inline">
              Funis
            </Link>
            <ChevronRight className="hidden size-3.5 shrink-0 text-ink-4 sm:block" aria-hidden />
            <input
              aria-label="Nome do funil"
              value={doc.name}
              maxLength={120}
              onFocus={commit}
              onChange={(event) => editDoc((d) => ({ ...d, name: event.target.value }), false)}
              onBlur={(event) => {
                if (!event.target.value.trim()) editDoc((d) => ({ ...d, name: "Funil sem nome" }), false);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") event.currentTarget.blur();
              }}
              className="h-8 w-full max-w-md min-w-0 truncate rounded-md bg-transparent px-1.5 text-[14.5px] font-semibold tracking-tight text-ink outline-none hover:bg-hover focus:bg-panel focus:ring-2 focus:ring-accent/30"
            />
          </div>
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <SaveIndicator
              status={save.status}
              pending={busy}
              error={save.error}
              onRetry={() => void persist()}
              onResolve={() => setConflictOpen(true)}
            />
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" size="sm" aria-label={`Status: ${status.label}`}>
                  <span className={cn("size-1.5 rounded-full", status.dot)} aria-hidden />
                  <span className="hidden sm:inline">{status.label}</span>
                  <ChevronDown className="size-3.5 text-ink-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64">
                <DropdownMenuLabel>Status do funil</DropdownMenuLabel>
                {FUNNEL_STATUS_ORDER.map((key) => (
                  <DropdownMenuItem key={key} onSelect={() => editDoc((d) => ({ ...d, status: key }))}>
                    <span className={cn("size-2 shrink-0 rounded-full", FUNNEL_STATUSES[key].dot)} aria-hidden />
                    <span className="min-w-0 flex-1">
                      <span className="block">{FUNNEL_STATUSES[key].label}</span>
                      <span className="block text-[11.5px] text-ink-4">{FUNNEL_STATUSES[key].hint}</span>
                    </span>
                    {doc.status === key ? <Check className="text-accent!" aria-label="Atual" /> : null}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" size="icon" aria-label="Mais ações" title="Mais ações">
                  <MoreHorizontal />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-52">
                <DropdownMenuItem disabled={other.pending} onSelect={duplicate}>
                  <Copy />
                  Duplicar funil
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem destructive onSelect={() => setDeleteOpen(true)}>
                  <Trash2 />
                  Excluir funil
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Variantes e visão */}
        <div className="flex h-11 shrink-0 items-center gap-2 border-b border-line bg-panel px-2 sm:px-4">
          <div className="no-scrollbar flex min-w-0 flex-1 items-center gap-1 overflow-x-auto" role="tablist" aria-label="Variantes">
            {doc.variants.map((v, index) => (
              <VariantTab
                key={v.id}
                variant={v}
                letter={variantLetter(index)}
                sim={sims[index]}
                active={v.id === variant.id}
                winner={doc.winnerId === v.id}
                single={doc.variants.length === 1}
                onSelect={() => selectVariant(v.id)}
                onRename={() => {
                  setSelection(EMPTY_SELECTION);
                  focusVariantName();
                }}
                onDuplicate={() => addVariant("copy", v.id)}
                onWinner={() => setWinner(doc.winnerId === v.id ? null : v.id)}
                onRemove={() => removeVariant(v.id)}
                onMenuCloseAutoFocus={keepNameFocus}
              />
            ))}
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="shrink-0 text-ink-3"
                  disabled={doc.variants.length >= FUNNEL_LIMITS.variants}
                  title="Nova variante: outra abordagem para comparar"
                >
                  <Plus />
                  <span className={doc.variants.length > 1 ? "hidden xl:inline" : "hidden sm:inline"}>Nova variante</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-64" onCloseAutoFocus={keepNameFocus}>
                <DropdownMenuLabel>Testar outra abordagem</DropdownMenuLabel>
                <DropdownMenuItem onSelect={() => addVariant("copy")}>
                  <Copy />
                  <span className="min-w-0 flex-1">
                    <span className="block">Copiar “{variant.name}”</span>
                    <span className="block text-[11.5px] text-ink-4">Mude uma etapa e compare</span>
                  </span>
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => addVariant("blank")}>
                  <Plus />
                  <span className="min-w-0 flex-1">
                    <span className="block">Em branco</span>
                    <span className="block text-[11.5px] text-ink-4">Um caminho totalmente diferente</span>
                  </span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <div className="inline-flex rounded-lg border border-line bg-subtle p-0.5" role="group" aria-label="Números do quadro">
              {(["plan", "real"] as const).map((key) => (
                <button
                  key={key}
                  type="button"
                  aria-pressed={view === key}
                  onClick={() => setView(key)}
                  title={key === "plan" ? "Números previstos pelas taxas" : "Resultados reais anotados em cada etapa"}
                  className={cn(
                    "inline-flex h-6.5 cursor-pointer items-center rounded-md px-2 text-[12.5px]",
                    view === key ? "bg-panel font-medium text-ink shadow-xs" : "text-ink-3 hover:text-ink",
                  )}
                >
                  {key === "plan" ? "Previsto" : "Real"}
                </button>
              ))}
            </div>
            {doc.variants.length > 1 ? (
              <Button variant="secondary" size="sm" onClick={() => setCompareOpen(true)}>
                <Columns3 />
                <span className="hidden sm:inline">Comparar</span>
              </Button>
            ) : null}
          </div>
        </div>

        {/* Etapas · quadro · detalhes */}
        <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
          <Palette
            onAdd={(kind) => addStep(kind, { from: chainNode?.id })}
            chainFrom={chainNode?.name ?? null}
            className="border-b lg:border-b-0"
          />

          <div
            ref={wrapperRef}
            className="relative h-[60dvh] min-h-[400px] shrink-0 border-b border-line bg-subtle lg:h-auto lg:min-h-0 lg:flex-1 lg:shrink lg:border-b-0"
            onDragOver={onDragOver}
            onDrop={onDrop}
          >
            <div className="absolute inset-0">
              <ReactFlow<CanvasNode, CanvasEdge>
                className="lyro-flow"
                nodes={nodes}
                edges={edges}
                nodeTypes={NODE_TYPES}
                edgeTypes={EDGE_TYPES}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onConnectEnd={onConnectEnd}
                isValidConnection={isValidConnection}
                onDelete={({ nodes: gone, edges: cut }) => removeItems(gone.map((n) => n.id), cut.map((e) => e.id))}
                onNodeDragStart={commit}
                onSelectionDragStart={commit}
                onPaneClick={() => setQuickAdd(null)}
                deleteKeyCode={["Backspace", "Delete"]}
                snapToGrid
                snapGrid={[GRID, GRID]}
                fitView
                fitViewOptions={{ padding: 0.25, maxZoom: 1 }}
                minZoom={0.2}
                maxZoom={1.75}
                connectionRadius={28}
                connectionLineStyle={{ stroke: "var(--accent)", strokeWidth: 2 }}
                elevateEdgesOnSelect
                ariaLabelConfig={ARIA_LABELS}
              >
                <Background variant={BackgroundVariant.Dots} gap={GRID} size={1.25} color="var(--line-strong)" />
                {empty ? null : (
                  <Panel position="top-left" style={{ margin: 12 }}>
                    <CanvasSummary sim={sim} view={view} />
                  </Panel>
                )}
                <Panel position="bottom-left" style={{ margin: 12 }}>
                  <div className="flex items-center gap-0.5 rounded-lg border border-line bg-panel p-0.5 shadow-card">
                    <ToolButton label="Desfazer" shortcut="Ctrl+Z" onClick={undo} disabled={history.past.length === 0}>
                      <Undo2 />
                    </ToolButton>
                    <ToolButton label="Refazer" shortcut="Ctrl+Shift+Z" onClick={redo} disabled={history.future.length === 0}>
                      <Redo2 />
                    </ToolButton>
                    <span className="mx-0.5 h-5 w-px bg-line" aria-hidden />
                    <ToolButton label="Diminuir zoom" onClick={() => void flow.zoomOut({ duration: 150 })}>
                      <Minus />
                    </ToolButton>
                    <ToolButton label="Aumentar zoom" onClick={() => void flow.zoomIn({ duration: 150 })}>
                      <Plus />
                    </ToolButton>
                    <ToolButton label="Enquadrar tudo" onClick={() => void flow.fitView(FIT)}>
                      <Maximize />
                    </ToolButton>
                    <span className="mx-0.5 h-5 w-px bg-line" aria-hidden />
                    <ToolButton label="Organizar em colunas" onClick={organize} disabled={empty}>
                      <WandSparkles />
                    </ToolButton>
                  </div>
                </Panel>
              </ReactFlow>
            </div>

            {empty ? <EmptyCanvas onTemplate={applyTemplate} /> : null}

            {/* Ligação solta no vazio: escolher a próxima etapa ali mesmo */}
            <DropdownMenu
              open={quickAdd != null}
              onOpenChange={(open) => {
                if (!open) setQuickAdd(null);
              }}
              modal={false}
            >
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  tabIndex={-1}
                  aria-hidden
                  className="pointer-events-none absolute size-px opacity-0"
                  style={{ left: quickAdd?.local.x ?? 0, top: quickAdd?.local.y ?? 0 }}
                />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                side="right"
                sideOffset={6}
                className="max-h-[min(400px,70dvh)] w-60 overflow-y-auto"
                onCloseAutoFocus={(event) => event.preventDefault()}
              >
                <DropdownMenuLabel>
                  Próxima etapa depois de <span className="font-medium text-ink-2">{quickFrom?.name ?? "…"}</span>
                </DropdownMenuLabel>
                {STEP_GROUP_ORDER.filter((group) => group !== "source").map((group) => (
                  <DropdownMenuGroup key={group}>
                    <DropdownMenuLabel className="pt-2 pb-1 text-[10.5px] font-medium tracking-wide text-ink-4 uppercase">
                      {STEP_GROUPS[group].label}
                    </DropdownMenuLabel>
                    {STEP_KIND_ORDER.filter((kind) => kind !== "note" && STEP_KINDS[kind].group === group).map((kind) => {
                      const Icon = STEP_KINDS[kind].icon;
                      return (
                        <DropdownMenuItem key={kind} onSelect={() => pickQuick(kind)}>
                          <span className={cn("grid size-6 shrink-0 place-items-center rounded-md", STEP_GROUPS[group].tile)}>
                            <Icon className="size-3.5! text-inherit!" aria-hidden />
                          </span>
                          {STEP_KINDS[kind].label}
                        </DropdownMenuItem>
                      );
                    })}
                  </DropdownMenuGroup>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <Inspector
            className="lg:w-80 lg:shrink-0"
            variantNameId={variantNameId}
            doc={doc}
            variant={variant}
            letter={letter}
            sim={sim}
            selection={selection}
            products={products}
            onCommit={commit}
            onNode={onNode}
            onEdge={onEdge}
            onRemove={removeItems}
            onGoal={onGoal}
            onVariantName={onVariantName}
            onDoc={onDocPatch}
            onSelect={focusSelection}
          />
        </div>
      </div>

      <CompareDialog
        open={compareOpen}
        onOpenChange={setCompareOpen}
        variants={doc.variants}
        sims={sims}
        activeId={variant.id}
        winnerId={doc.winnerId}
        onWinner={setWinner}
        onOpen={(variantId) => {
          setCompareOpen(false);
          selectVariant(variantId);
        }}
      />

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Excluir funil?"
        description={`“${doc.name}” e ${doc.variants.length === 1 ? "o desenho dele" : `as ${doc.variants.length} variantes`} serão excluídos. Não dá para desfazer.`}
        confirmLabel="Excluir funil"
        action={remove}
      />

      <Dialog open={conflictOpen} onOpenChange={setConflictOpen}>
        <DialogContent title="Este funil mudou em outro lugar" size="sm">
          <DialogBody>
            <p className="text-[13px] text-ink-2">
              Uma versão mais nova foi salva (em outra aba ou por outra pessoa) enquanto você editava. Suas últimas
              alterações ainda não foram salvas. Qual versão fica?
            </p>
          </DialogBody>
          <DialogFooter>
            <Button variant="secondary" onClick={loadSaved}>
              Abrir a versão salva
            </Button>
            <Button variant="primary" onClick={keepMine}>
              Manter a minha
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </CanvasContext>
  );
}

/* ---------- Peças da tela ---------- */

function SaveIndicator({
  status,
  pending,
  error,
  onRetry,
  onResolve,
}: {
  status: SaveState["status"];
  pending: boolean;
  error: string | null;
  onRetry: () => void;
  onResolve: () => void;
}) {
  if (status === "conflict") {
    return (
      <button
        type="button"
        onClick={onResolve}
        title={error ?? undefined}
        className="inline-flex cursor-pointer items-center gap-1.5 rounded-md px-1.5 py-1 text-[12px] font-medium text-warning hover:bg-amber-50"
      >
        <TriangleAlert className="size-3.5" aria-hidden />
        <span className="hidden sm:inline">Versão mais nova no servidor · resolver</span>
        <span className="sm:hidden">Resolver</span>
      </button>
    );
  }
  if (status === "error") {
    return (
      <button
        type="button"
        onClick={onRetry}
        title={error ?? undefined}
        className="inline-flex cursor-pointer items-center gap-1.5 rounded-md px-1.5 py-1 text-[12px] font-medium text-danger hover:bg-red-50"
      >
        <CloudOff className="size-3.5" aria-hidden />
        <span className="hidden sm:inline">Não salvo · tentar de novo</span>
        <span className="sm:hidden">Tentar de novo</span>
      </button>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-1 text-[12px] text-ink-4" role="status">
      {pending ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : <Check className="size-3.5" aria-hidden />}
      <span className="hidden md:inline">{pending ? "Salvando…" : "Salvo"}</span>
      <span className="sr-only md:hidden">{pending ? "Salvando" : "Salvo"}</span>
    </span>
  );
}

function VariantTab({
  variant,
  letter,
  sim,
  active,
  winner,
  single,
  onSelect,
  onRename,
  onDuplicate,
  onWinner,
  onRemove,
  onMenuCloseAutoFocus,
}: {
  variant: FunnelVariant;
  letter: string;
  sim: FunnelSim;
  active: boolean;
  winner: boolean;
  single: boolean;
  onSelect: () => void;
  onRename: () => void;
  onDuplicate: () => void;
  onWinner: () => void;
  onRemove: () => void;
  onMenuCloseAutoFocus: (event: Event) => void;
}) {
  return (
    <div
      className={cn(
        "flex h-8 shrink-0 items-center rounded-lg border text-[12.5px] transition-colors",
        active ? "border-line bg-panel shadow-xs" : "border-transparent hover:bg-hover",
      )}
    >
      <button
        type="button"
        role="tab"
        aria-selected={active}
        onClick={onSelect}
        className="flex h-full cursor-pointer items-center gap-2 pr-2.5 pl-1.5"
        title={`Conversão prevista: ${sim.entries > 0 ? formatShare(sim.rate) : "—"}`}
      >
        <span
          className={cn(
            "grid size-5 place-items-center rounded-md text-[10.5px] font-semibold",
            active ? "bg-ink text-white" : "bg-hover text-ink-3",
          )}
        >
          {letter}
        </span>
        <span className={cn("max-w-36 truncate", active ? "font-medium text-ink" : "text-ink-2")}>{variant.name}</span>
        {winner ? <Trophy className="size-3.5 shrink-0 text-amber-600" aria-label="Vencedora" /> : null}
        {single ? null : (
          <span className="text-[11px] text-ink-4 tabular-nums">{sim.entries > 0 ? formatShare(sim.rate) : "—"}</span>
        )}
      </button>
      {active ? (
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label={`Opções da variante ${variant.name}`}
              className="mr-1 grid size-6 cursor-pointer place-items-center rounded-md text-ink-3 hover:bg-hover hover:text-ink"
            >
              <ChevronDown className="size-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56" onCloseAutoFocus={onMenuCloseAutoFocus}>
            <DropdownMenuItem onSelect={onRename}>
              <Pencil />
              Renomear
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={onDuplicate}>
              <Copy />
              Duplicar variante
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={onWinner} disabled={single && !winner}>
              <Trophy />
              {winner ? "Desmarcar vencedora" : "Marcar como vencedora"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem destructive disabled={single} onSelect={onRemove}>
              <Trash2 />
              Excluir variante
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}
    </div>
  );
}

function ToolButton({
  label,
  shortcut,
  onClick,
  disabled,
  children,
}: {
  label: string;
  shortcut?: string;
  onClick: () => void;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={onClick}
          disabled={disabled}
          aria-label={label}
          className="grid size-8 cursor-pointer place-items-center rounded-md text-ink-2 transition-colors hover:bg-hover hover:text-ink disabled:cursor-default disabled:opacity-35 disabled:hover:bg-transparent [&_svg]:size-4"
        >
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent side="top">
        {label}
        {shortcut ? <span className="ml-1.5 text-white/60">{shortcut}</span> : null}
      </TooltipContent>
    </Tooltip>
  );
}

/** Faixa de números sobre o quadro: o resultado do funil enquanto você mexe nas etapas. */
function CanvasSummary({ sim, view }: { sim: FunnelSim; view: CanvasView }) {
  if (view === "real" && sim.real.filled === 0) {
    return (
      <p className="max-w-xs rounded-lg border border-line bg-panel/95 px-3 py-2 text-[12px] leading-snug text-ink-3 shadow-card backdrop-blur-sm">
        Selecione uma etapa e anote em <span className="font-medium text-ink-2">Resultado real</span> quantas pessoas chegaram nela.
      </p>
    );
  }
  const items =
    view === "real"
      ? [
          { label: "Entradas reais", value: sim.real.entries == null ? "—" : formatPeople(sim.real.entries) },
          { label: "Conversões reais", value: sim.real.conversions == null ? "—" : formatPeople(sim.real.conversions) },
          { label: "Taxa real", value: sim.real.rate == null ? "—" : formatShare(sim.real.rate) },
          { label: "Receita real", value: sim.real.revenue == null ? "—" : formatMoney(sim.real.revenue, "compact"), wide: true },
        ]
      : [
          { label: "Entradas", value: formatPeople(sim.entries) },
          { label: "Conversões", value: formatPeople(sim.conversions) },
          { label: "Conversão", value: sim.entries > 0 ? formatShare(sim.rate) : "—" },
          { label: "Receita/mês", value: formatMoney(sim.revenue, "compact"), wide: true },
          { label: "ROI", value: sim.roi == null ? "—" : formatMultiple(sim.roi), wide: true },
        ];
  return (
    <dl className="flex items-stretch divide-x divide-line overflow-hidden rounded-lg border border-line bg-panel/95 shadow-card backdrop-blur-sm">
      {items.map((item) => (
        <div key={item.label} className={cn("flex-col px-3 py-1.5", item.wide ? "hidden sm:flex" : "flex")}>
          <dt className="text-[10.5px] whitespace-nowrap text-ink-4">{item.label}</dt>
          <dd className="text-[13px] leading-5 font-semibold whitespace-nowrap text-ink tabular-nums">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function EmptyCanvas({ onTemplate }: { onTemplate: (key: string) => void }) {
  return (
    <div className="pointer-events-none absolute inset-0 z-10 grid place-items-center p-4">
      <div className="pointer-events-auto w-full max-w-md rounded-xl border border-line bg-panel p-5 shadow-pop">
        <DotGlyph name="funnels" className="size-9" />
        <h2 className="mt-3 text-[15px] font-semibold tracking-tight text-ink">Desenhe o caminho até a venda</h2>
        <p className="mt-1 text-[13px] leading-snug text-ink-3">
          Arraste etapas da lateral e ligue uma na outra, puxando a bolinha da direita do card. Ou comece por um modelo:
        </p>
        <div className="mt-4 flex flex-col gap-2">
          {FUNNEL_TEMPLATES.filter((t) => t.key !== "blank").map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => onTemplate(t.key)}
              className="group flex cursor-pointer items-center gap-3 rounded-lg border border-line px-3 py-2.5 text-left transition-colors hover:border-line-strong hover:bg-subtle"
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-medium text-ink group-hover:text-accent">{t.name}</span>
                <TemplateChain kinds={t.preview} className="mt-1.5" />
              </span>
              <ChevronRight className="size-4 shrink-0 text-ink-4" aria-hidden />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
