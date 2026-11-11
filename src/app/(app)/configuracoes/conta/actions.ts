"use server";

import { refresh } from "next/cache";
import { getSupabase } from "@/lib/auth";
import { authErrorMessage } from "@/lib/auth-errors";
import { authCallbackUrl } from "@/lib/auth-flows";
import { newPasswordProblem } from "@/lib/password";
import { verifyPassword } from "@/lib/supabase/verify-password";
import { str, type ActionResult } from "@/lib/utils";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** E-mail atual direto do Supabase Auth: o do token pode estar defasado logo depois de uma troca. */
async function currentAccount() {
  const supabase = await getSupabase();
  const { data } = await supabase.auth.getUser();
  const email = data.user?.email;
  return email ? { supabase, email } : null;
}

const SESSION_EXPIRED = "Sua sessão expirou. Entre de novo para continuar.";

/** Troca de senha para quem lembra a atual. O Supabase encerra as sessões dos outros aparelhos. */
export async function changePassword(formData: FormData): Promise<ActionResult> {
  const current = String(formData.get("current_password") ?? "");
  const password = String(formData.get("password") ?? "");
  if (!current) return { ok: false, error: "Informe sua senha atual." };
  const problem = newPasswordProblem(password, String(formData.get("confirm_password") ?? ""));
  if (problem) return { ok: false, error: problem };
  if (password === current) return { ok: false, error: "A senha nova precisa ser diferente da atual." };

  const account = await currentAccount();
  if (!account) return { ok: false, error: SESSION_EXPIRED };
  const wrong = await verifyPassword(account.email, current);
  if (wrong) return { ok: false, error: wrong };

  // current_password só é exigido pelo Supabase se a opção estiver ligada no projeto; mandar não custa nada
  const { error } = await account.supabase.auth.updateUser({ password, current_password: current });
  if (error) return { ok: false, error: authErrorMessage(error) };
  refresh();
  return { ok: true, message: "Senha alterada. Seus outros aparelhos vão pedir para entrar de novo." };
}

/** Pede a troca do e-mail de acesso. Só vale depois que a pessoa abre os links de confirmação. */
export async function changeEmail(formData: FormData): Promise<ActionResult> {
  const email = str(formData, "email")?.toLowerCase();
  const current = String(formData.get("current_password") ?? "");
  if (!email || !EMAIL.test(email)) return { ok: false, error: "Informe um e-mail válido." };
  if (!current) return { ok: false, error: "Informe sua senha atual para confirmar a troca." };

  const account = await currentAccount();
  if (!account) return { ok: false, error: SESSION_EXPIRED };
  if (email === account.email.toLowerCase()) return { ok: false, error: "Esse já é o seu e-mail de acesso." };
  const wrong = await verifyPassword(account.email, current);
  if (wrong) return { ok: false, error: wrong };

  const { error } = await account.supabase.auth.updateUser(
    { email },
    { emailRedirectTo: authCallbackUrl({ flow: "email_change" }) },
  );
  if (error) return { ok: false, error: authErrorMessage(error) };
  refresh();
  return { ok: true, message: "Pedido enviado. Abra os links de confirmação para concluir a troca." };
}
