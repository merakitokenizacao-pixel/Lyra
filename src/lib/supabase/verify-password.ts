import "server-only";

import { createClient } from "@supabase/supabase-js";
import { authErrorMessage } from "@/lib/auth-errors";
import type { Database } from "./database.types";

/**
 * Confere a senha atual sem mexer na sessão do navegador: entra por um cliente
 * descartável (sem cookies) e encerra essa sessão logo em seguida.
 * Devolve a mensagem de erro, ou null quando a senha confere.
 */
export async function verifyPassword(email: string, password: string): Promise<string | null> {
  const client = createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });

  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) {
    const wrong = error.code === "invalid_credentials" || /invalid login credentials/i.test(error.message);
    return wrong ? "Senha atual incorreta." : authErrorMessage(error);
  }
  if (data.session) await client.auth.signOut({ scope: "local" });
  return null;
}
