import { NextResponse, type NextRequest } from "next/server";
import { flowDestination, parseFlow, safeNext } from "@/lib/auth-flows";
import { createClient } from "@/lib/supabase/server";

/**
 * Volta dos links de e-mail (PKCE): troca o código por sessão e leva cada fluxo para
 * a tela certa — confirmação de cadastro, recuperação de senha ou troca de e-mail.
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const params = url.searchParams;
  const code = params.get("code");
  const flow = parseFlow(params.get("flow"));
  const failed = params.has("error") || params.has("error_code");
  const go = (path: string) => NextResponse.redirect(new URL(path, url.origin));

  const supabase = await createClient();
  const exchanged = Boolean(code) && !failed && !(await supabase.auth.exchangeCodeForSession(code!)).error;

  if (flow === "email_change") {
    // Na troca com confirmação dupla, o primeiro link só devolve um aviso e o segundo traz o código.
    // O código só existe depois da troca feita: vale como confirmada mesmo se este navegador não tiver o verificador.
    const outcome = code && !failed ? "done" : params.has("message") && !failed ? "partial" : "failed";
    return go(flowDestination(flow, outcome, true));
  }

  if (flow === "recovery") {
    if (exchanged) return go(flowDestination(flow, "done", true));
    const { data } = await supabase.auth.getClaims();
    return go(flowDestination(flow, "failed", Boolean(data?.claims?.sub)));
  }

  if (exchanged) return go(safeNext(params.get("next")));
  if (failed) return go("/login?message=link_invalid");
  // Cadastro confirmado em outro navegador (sem o verificador PKCE): o e-mail já está confirmado.
  return go("/login?message=confirmed");
}
