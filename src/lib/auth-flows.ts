import "server-only";
import type { AMREntry, JwtPayload } from "@supabase/supabase-js";

/** Endereço público do app: é para cá que apontam os links que o Supabase manda por e-mail. */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/** Aceita só caminhos deste app ("/x"); nunca "//outro-site" nem "/\outro-site". */
export function safeNext(value: unknown, fallback = "/") {
  return typeof value === "string" && value.startsWith("/") && !value.startsWith("//") && !value.startsWith("/\\")
    ? value
    : fallback;
}

/** Fluxos que voltam por link de e-mail e têm uma tela própria no fim. */
export type AuthFlow = "recovery" | "email_change";

export function parseFlow(value: string | null): AuthFlow | null {
  return value === "recovery" || value === "email_change" ? value : null;
}

/** Endereço de volta dos links de e-mail. O /auth/callback troca o código por sessão. */
export function authCallbackUrl({ flow, next }: { flow?: AuthFlow; next?: string } = {}) {
  const url = new URL("/auth/callback", SITE_URL);
  if (flow) url.searchParams.set("flow", flow);
  if (next) url.searchParams.set("next", next);
  return url.toString();
}

/**
 * done: o link funcionou. partial: falta abrir o segundo link (troca de e-mail
 * com confirmação dupla). failed: link expirado, já usado ou aberto em outro navegador.
 */
export type LinkOutcome = "done" | "partial" | "failed";

/** Tela de destino de cada fluxo depois que a pessoa abre o link do e-mail. */
export function flowDestination(flow: AuthFlow, outcome: LinkOutcome, signedIn: boolean) {
  if (flow === "recovery") {
    // Com sessão, /nova-senha decide se ainda dá para criar a senha ou se precisa de outro link
    return outcome === "done" || signedIn ? "/nova-senha" : "/recuperar-senha?erro=link";
  }
  const status = outcome === "done" ? "confirmado" : outcome === "partial" ? "parcial" : "erro";
  return `/configuracoes/conta?email=${status}`;
}

/** Entradas que provam acesso ao e-mail. São as mesmas que o Supabase Auth trata como recuperação. */
const EMAIL_PROOF_METHODS = new Set(["recovery", "otp", "magiclink"]);
/** Depois de abrir o link de recuperação, a pessoa tem este tempo para criar a senha nova. */
const RECOVERY_WINDOW_SECONDS = 30 * 60;

/**
 * Sessão aberta há pouco por um link de recuperação: pode definir uma senha nova
 * sem informar a atual. Qualquer outra sessão precisa da senha atual (Minha conta).
 */
export function canResetPasswordWithoutCurrent(claims: JwtPayload | null | undefined) {
  const amr: readonly (AMREntry | string)[] = claims?.amr ?? [];
  const now = Date.now() / 1000;
  return amr.some(
    (entry) =>
      typeof entry === "object" &&
      EMAIL_PROOF_METHODS.has(entry.method) &&
      now - entry.timestamp < RECOVERY_WINDOW_SECONDS,
  );
}
