/** Mínimo exigido pelo Supabase Auth na configuração padrão do projeto. */
export const PASSWORD_MIN = 6;
/** O Supabase Auth guarda a senha com bcrypt, que só considera os primeiros 72 bytes. */
export const PASSWORD_MAX_BYTES = 72;

/** Confere a nova senha e a confirmação. Devolve o problema em português, ou null se estiver tudo certo. */
export function newPasswordProblem(password: string, confirmation: string): string | null {
  if (password.length < PASSWORD_MIN) return `A nova senha precisa ter pelo menos ${PASSWORD_MIN} caracteres.`;
  if (new TextEncoder().encode(password).length > PASSWORD_MAX_BYTES) return "A senha está longa demais. Use até 72 caracteres.";
  if (password !== confirmation) return "A confirmação não é igual à nova senha.";
  return null;
}
