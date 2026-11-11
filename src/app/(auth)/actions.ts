"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ORG_COOKIE, ORG_COOKIE_OPTIONS } from "@/lib/auth";
import { authErrorMessage } from "@/lib/auth-errors";
import { authCallbackUrl, canResetPasswordWithoutCurrent, safeNext } from "@/lib/auth-flows";
import { newPasswordProblem, PASSWORD_MIN } from "@/lib/password";
import { createClient } from "@/lib/supabase/server";
import { str, type ActionResult } from "@/lib/utils";

export type AuthState = { error?: string; sent?: boolean; email?: string } | null;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function signIn(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = str(formData, "email")?.toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Informe e-mail e senha.", email };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: authErrorMessage(error), email };

  // Convite pendente para este e-mail: a pessoa entra no time já neste login e cai direto nele
  const { data: joinedOrg } = await supabase.rpc("accept_pending_invites");
  if (joinedOrg) {
    (await cookies()).set(ORG_COOKIE, joinedOrg, ORG_COOKIE_OPTIONS);
    redirect("/");
  }

  redirect(safeNext(formData.get("next")));
}

export async function signUp(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const fullName = str(formData, "full_name");
  const email = str(formData, "email")?.toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!fullName) return { error: "Informe seu nome.", email };
  if (!email) return { error: "Informe seu e-mail.", email };
  if (password.length < PASSWORD_MIN) return { error: `A senha precisa ter pelo menos ${PASSWORD_MIN} caracteres.`, email };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      // A tela inicial aceita convites pendentes; sem convite, segue para o onboarding
      emailRedirectTo: authCallbackUrl({ next: "/" }),
    },
  });
  if (error) return { error: authErrorMessage(error), email };

  // Com confirmação de e-mail ativa, um e-mail já cadastrado volta sem identidades
  if (data.user && data.user.identities?.length === 0) {
    return { error: "Já existe uma conta com este e-mail. Faça login.", email };
  }

  if (data.session) redirect("/");
  return { sent: true, email };
}

/**
 * "Esqueci minha senha": manda o link para criar uma senha nova. A tela responde
 * igual exista ou não uma conta com o e-mail, para não revelar quem usa o Lyro.
 */
export async function requestPasswordReset(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = str(formData, "email")?.toLowerCase();
  if (!email || !EMAIL.test(email)) return { error: "Informe um e-mail válido.", email };

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: authCallbackUrl({ flow: "recovery" }) });
  if (error) return { error: authErrorMessage(error), email };
  return { sent: true, email };
}

/** Mesmo link de recuperação, para quem está conectado mas não lembra a senha atual. */
export async function sendMyPasswordResetLink(): Promise<ActionResult> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const email = data.user?.email;
  if (!email) return { ok: false, error: "Sua sessão expirou. Entre de novo para continuar." };

  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: authCallbackUrl({ flow: "recovery" }) });
  if (error) return { ok: false, error: authErrorMessage(error) };
  return { ok: true, message: `Link enviado para ${email}. Abra o e-mail neste navegador.` };
}

/** Cria a senha nova depois do link de recuperação, sem pedir a atual. */
export async function setNewPassword(formData: FormData): Promise<ActionResult> {
  const password = String(formData.get("password") ?? "");
  const problem = newPasswordProblem(password, String(formData.get("confirm_password") ?? ""));
  if (problem) return { ok: false, error: problem };

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims?.sub) return { ok: false, error: "Sua sessão expirou. Peça um novo link de recuperação." };
  if (!canResetPasswordWithoutCurrent(data.claims)) {
    return { ok: false, error: "Este link de recuperação expirou. Peça um novo." };
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { ok: false, error: authErrorMessage(error) };
  // O Supabase encerra as sessões dos outros aparelhos quando a senha muda
  return { ok: true, message: "Senha nova salva. Por segurança, seus outros aparelhos vão pedir para entrar de novo." };
}
