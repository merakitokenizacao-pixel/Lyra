import {
  ArrowRightLeft,
  CalendarDays,
  CheckSquare,
  FileText,
  Flame,
  Mail,
  MessageCircle,
  Phone,
  RefreshCw,
  Snowflake,
  Sparkles,
  StickyNote,
  Thermometer,
  type LucideIcon,
} from "lucide-react";
import type { Enums } from "@/lib/supabase/database.types";

export type StageColor = "stone" | "blue" | "violet" | "orange" | "amber" | "green" | "red" | "teal" | "pink";
export type StageCategory = Enums<"stage_category">;
export type LeadTemperature = Enums<"lead_temperature">;
export type ClientStatus = Enums<"client_status">;
export type ProposalStatus = Enums<"proposal_status">;
export type ActivityType = Enums<"activity_type">;
export type BillingCycle = Enums<"billing_cycle">;
export type MemberRole = Enums<"member_role">;

/** Classes completas por cor de etapa (o Tailwind só gera classes escritas por extenso). */
export const STAGE_COLORS: Record<StageColor, { label: string; dot: string; soft: string; bar: string; hex: string }> = {
  stone: { label: "Cinza", dot: "bg-stone-400", soft: "bg-stone-100", bar: "bg-stone-400", hex: "#a6a09b" },
  blue: { label: "Azul", dot: "bg-blue-500", soft: "bg-blue-50", bar: "bg-blue-500", hex: "#3b82f6" },
  violet: { label: "Violeta", dot: "bg-violet-500", soft: "bg-violet-50", bar: "bg-violet-500", hex: "#8b5cf6" },
  orange: { label: "Laranja", dot: "bg-orange-500", soft: "bg-orange-50", bar: "bg-orange-500", hex: "#f97316" },
  amber: { label: "Âmbar", dot: "bg-amber-500", soft: "bg-amber-50", bar: "bg-amber-500", hex: "#f59e0b" },
  green: { label: "Verde", dot: "bg-emerald-500", soft: "bg-emerald-50", bar: "bg-emerald-500", hex: "#10b981" },
  red: { label: "Vermelho", dot: "bg-red-500", soft: "bg-red-50", bar: "bg-red-500", hex: "#ef4444" },
  teal: { label: "Turquesa", dot: "bg-teal-500", soft: "bg-teal-50", bar: "bg-teal-500", hex: "#14b8a6" },
  pink: { label: "Rosa", dot: "bg-pink-500", soft: "bg-pink-50", bar: "bg-pink-500", hex: "#ec4899" },
};

export function stageColor(color: string | null | undefined) {
  return STAGE_COLORS[(color as StageColor) in STAGE_COLORS ? (color as StageColor) : "stone"];
}

export const STAGE_CATEGORY_LABEL: Record<StageCategory, string> = {
  open: "Em andamento",
  won: "Ganho",
  lost: "Perdido",
};

/** Etapas do modelo padrão de vendas. São as mesmas que toda empresa nova recebe (create_organization no banco). */
export const DEFAULT_PIPELINE_STAGES: { name: string; color: StageColor; category: StageCategory }[] = [
  { name: "Novo", color: "stone", category: "open" },
  { name: "Em contato", color: "blue", category: "open" },
  { name: "Qualificado", color: "violet", category: "open" },
  { name: "Proposta enviada", color: "orange", category: "open" },
  { name: "Negociação", color: "amber", category: "open" },
  { name: "Ganho", color: "green", category: "won" },
  { name: "Perdido", color: "red", category: "lost" },
];

export const TEMPERATURES: Record<LeadTemperature, { label: string; icon: LucideIcon; className: string }> = {
  cold: { label: "Frio", icon: Snowflake, className: "text-sky-600" },
  warm: { label: "Morno", icon: Thermometer, className: "text-amber-600" },
  hot: { label: "Quente", icon: Flame, className: "text-orange-600" },
};
export const TEMPERATURE_ORDER: LeadTemperature[] = ["cold", "warm", "hot"];

export const LEAD_SOURCES: Record<string, string> = {
  site: "Site",
  indicacao: "Indicação",
  linkedin: "LinkedIn",
  instagram: "Instagram",
  google_ads: "Google Ads",
  evento: "Evento",
  outbound: "Prospecção ativa",
  whatsapp: "WhatsApp",
  outro: "Outro",
};

export function sourceLabel(source: string | null | undefined) {
  if (!source) return "—";
  return LEAD_SOURCES[source] ?? source;
}

/**
 * Status do cliente. As cores formam uma paleta categórica validada
 * (separação para daltonismo ΔE ≥ 9) na ordem abaixo — mantenha a ordem.
 */
export const CLIENT_STATUSES: Record<
  ClientStatus,
  { label: string; color: string; onColor: "#ffffff" | "#1c1917"; description: string }
> = {
  // onColor: cor do texto impresso dentro do bloco colorido (maior contraste pela luminância)
  onboarding: { label: "Onboarding", color: "#2a78d6", onColor: "#ffffff", description: "Implantação em andamento" },
  active: { label: "Ativo", color: "#1baf7a", onColor: "#1c1917", description: "Cliente saudável e engajado" },
  at_risk: { label: "Em risco", color: "#eb6834", onColor: "#1c1917", description: "Sinais de insatisfação ou baixo uso" },
  paused: { label: "Pausado", color: "#6250d6", onColor: "#ffffff", description: "Contrato suspenso temporariamente" },
  churned: { label: "Cancelado", color: "#e34948", onColor: "#1c1917", description: "Deixou de ser cliente" },
};
export const CLIENT_STATUS_ORDER: ClientStatus[] = ["onboarding", "active", "at_risk", "paused", "churned"];

export const PROPOSAL_STATUSES: Record<ProposalStatus, { label: string; dot: string }> = {
  draft: { label: "Rascunho", dot: "bg-stone-400" },
  sent: { label: "Enviada", dot: "bg-blue-500" },
  viewed: { label: "Visualizada", dot: "bg-violet-500" },
  accepted: { label: "Aceita", dot: "bg-emerald-500" },
  rejected: { label: "Recusada", dot: "bg-red-500" },
  expired: { label: "Expirada", dot: "bg-amber-500" },
};
export const PROPOSAL_STATUS_ORDER: ProposalStatus[] = ["draft", "sent", "viewed", "accepted", "rejected", "expired"];

export const ACTIVITY_TYPES: Record<ActivityType, { label: string; icon: LucideIcon; composer: boolean }> = {
  note: { label: "Nota", icon: StickyNote, composer: true },
  call: { label: "Ligação", icon: Phone, composer: true },
  email: { label: "E-mail", icon: Mail, composer: true },
  meeting: { label: "Reunião", icon: CalendarDays, composer: true },
  whatsapp: { label: "WhatsApp", icon: MessageCircle, composer: true },
  task: { label: "Tarefa", icon: CheckSquare, composer: true },
  stage_change: { label: "Etapa", icon: ArrowRightLeft, composer: false },
  status_change: { label: "Status", icon: RefreshCw, composer: false },
  proposal: { label: "Proposta", icon: FileText, composer: false },
  system: { label: "Sistema", icon: Sparkles, composer: false },
};
export const COMPOSER_TYPES = (Object.keys(ACTIVITY_TYPES) as ActivityType[]).filter((t) => ACTIVITY_TYPES[t].composer);

export const BILLING_LABEL: Record<BillingCycle, string> = {
  one_time: "Pagamento único",
  monthly: "Mensal",
};

export const BANT = [
  { key: "qual_budget", label: "Orçamento", hint: "Tem verba aprovada ou prevista" },
  { key: "qual_authority", label: "Decisor", hint: "Falamos com quem decide" },
  { key: "qual_need", label: "Necessidade", hint: "Dor clara que resolvemos" },
  { key: "qual_timing", label: "Momento", hint: "Prazo definido para decidir" },
] as const;
export type BantKey = (typeof BANT)[number]["key"];

export const ROLE_LABEL: Record<MemberRole, string> = {
  owner: "Proprietário",
  admin: "Administrador",
  member: "Membro",
};

export type ProposalSection = { id: string; title: string; body: string };
