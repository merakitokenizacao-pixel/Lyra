import { formatDistanceToNowStrict } from "date-fns";
import { ptBR } from "date-fns/locale";

export const TIME_ZONE = "America/Sao_Paulo";

const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const moneyRound = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});
const moneyCompact = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  notation: "compact",
  maximumFractionDigits: 1,
});
const integer = new Intl.NumberFormat("pt-BR");

export function formatMoney(value: number | null | undefined, mode: "full" | "round" | "compact" = "full") {
  const n = Number(value ?? 0);
  if (mode === "compact") return n >= 10000 ? moneyCompact.format(n) : moneyRound.format(n);
  if (mode === "round") return moneyRound.format(n);
  return money.format(n);
}

export function formatNumber(value: number | null | undefined) {
  return integer.format(Number(value ?? 0));
}

export function formatPercent(value: number, digits = 0) {
  return `${(value * 100).toFixed(digits).replace(".", ",")}%`;
}

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

function toDate(value: string | Date): Date {
  if (value instanceof Date) return value;
  if (DATE_ONLY.test(value)) {
    const [y, m, d] = value.split("-").map(Number);
    // Meio-dia UTC evita "voltar um dia" ao converter para o fuso de São Paulo
    return new Date(Date.UTC(y, m - 1, d, 12));
  }
  return new Date(value);
}

export function formatDate(value: string | Date | null | undefined, style: "short" | "medium" | "long" = "medium") {
  if (!value) return "—";
  const date = toDate(value);
  if (style === "short") {
    return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: TIME_ZONE }).format(date);
  }
  if (style === "long") {
    return new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "long", year: "numeric", timeZone: TIME_ZONE }).format(date);
  }
  return new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "short", year: "numeric", timeZone: TIME_ZONE })
    .format(date)
    .replace(" de ", " ")
    .replace(" de ", " ");
}

export function formatDateTime(value: string | Date | null | undefined) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TIME_ZONE,
  })
    .format(toDate(value))
    .replace(" de ", " ");
}

export function formatTime(value: string | Date) {
  return new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: TIME_ZONE }).format(toDate(value));
}

export function formatRelative(value: string | Date | null | undefined) {
  if (!value) return "—";
  return formatDistanceToNowStrict(toDate(value), { addSuffix: true, locale: ptBR });
}

export function daysSince(value: string | Date | null | undefined) {
  if (!value) return 0;
  return Math.max(0, Math.floor((Date.now() - toDate(value).getTime()) / 86_400_000));
}

/** "Hoje", "Ontem" ou "Há N dias", para tiles e resumos. */
export function daysAgoLabel(value: string | Date) {
  const days = daysSince(value);
  if (days === 0) return "Hoje";
  if (days === 1) return "Ontem";
  return `Há ${days} dias`;
}

/** Data de hoje (YYYY-MM-DD) no fuso de São Paulo. */
export function todayISO(offsetDays = 0) {
  const date = new Date(Date.now() + offsetDays * 86_400_000);
  return new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE }).format(date);
}

/** Instante de N dias atrás, em ISO (janelas de relatórios). */
export function isoDaysAgo(days: number) {
  return new Date(Date.now() - days * 86_400_000).toISOString();
}

/** Prazo (data e hora) que já passou. */
export function isOverdue(value: string | null | undefined) {
  return Boolean(value) && toDate(value!).getTime() < Date.now();
}

export function isPastDate(value: string | null | undefined) {
  if (!value) return false;
  return value < todayISO();
}

export function initials(name: string | null | undefined) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function firstName(name: string | null | undefined) {
  return name?.trim().split(/\s+/)[0] ?? "";
}

export function greeting() {
  const hour = Number(
    new Intl.DateTimeFormat("en-US", { hour: "numeric", hour12: false, timeZone: TIME_ZONE }).format(new Date()),
  );
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

/**
 * Como o Lyra chama a pessoa: o nome preferido ou o primeiro nome.
 * Null enquanto ela não informou um nome de verdade (só o começo do e-mail).
 */
export function callName(profile: { full_name: string; preferred_name: string | null; name_missing: boolean }) {
  const preferred = profile.preferred_name?.trim();
  if (preferred) return preferred;
  return profile.name_missing ? null : firstName(profile.full_name) || null;
}
