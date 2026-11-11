import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { flowDestination, safeNext } from "@/lib/auth-flows";
import { createClient } from "@/lib/supabase/server";

/**
 * Confirmação via token_hash, para templates de e-mail personalizados no Supabase.
 * Ao contrário do /auth/callback, funciona mesmo se o link for aberto em outro navegador.
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;
  const go = (path: string) => NextResponse.redirect(new URL(path, url.origin));

  const supabase = await createClient();
  const result = tokenHash && type ? await supabase.auth.verifyOtp({ type, token_hash: tokenHash }) : null;
  const verified = Boolean(result && !result.error);

  if (type === "email_change") {
    // Com confirmação dupla, o primeiro link é aceito sem abrir sessão: falta o segundo
    const outcome = !verified ? "failed" : result?.data.session ? "done" : "partial";
    return go(flowDestination("email_change", outcome, true));
  }

  if (type === "recovery") {
    if (verified) return go(flowDestination("recovery", "done", true));
    const { data } = await supabase.auth.getClaims();
    return go(flowDestination("recovery", "failed", Boolean(data?.claims?.sub)));
  }

  if (verified) return go(safeNext(url.searchParams.get("next")));
  return go("/login?message=link_invalid");
}
