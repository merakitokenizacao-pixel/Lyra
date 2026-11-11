import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Converte "12.500,90", "12500.9" ou "R$ 1.200" em número. */
export function parseMoney(input: FormDataEntryValue | string | null | undefined): number {
  if (input == null) return 0;
  let value = String(input).replace(/[^\d,.-]/g, "").trim();
  if (!value) return 0;
  if (value.includes(",")) {
    value = value.replace(/\./g, "").replace(",", ".");
  } else if ((value.match(/\./g) ?? []).length > 1 || /\.\d{3}$/.test(value)) {
    value = value.replace(/\./g, "");
  }
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed * 100) / 100 : 0;
}

export function str(formData: FormData, key: string): string | null {
  const value = formData.get(key);
  if (value == null) return null;
  const trimmed = String(value).trim();
  return trimmed === "" ? null : trimmed;
}

export function parseTags(value: string | null): string[] {
  if (!value) return [];
  return Array.from(
    new Set(
      value
        .split(",")
        .map((tag) => tag.trim().toLowerCase())
        .filter(Boolean),
    ),
  ).slice(0, 12);
}

export type ActionResult = { ok: true; message?: string; id?: string } | { ok: false; error: string };

export function errorMessage(error: unknown, fallback = "Algo deu errado. Tente novamente."): string {
  if (error && typeof error === "object" && "message" in error && typeof error.message === "string") {
    const message = error.message;
    if (message.includes("duplicate key")) return "Já existe um registro com esses dados.";
    if (message.includes("violates foreign key")) return "Este registro está em uso e não pode ser removido.";
    if (message.includes("row-level security")) return "Você não tem permissão para esta ação.";
    return message;
  }
  return fallback;
}
