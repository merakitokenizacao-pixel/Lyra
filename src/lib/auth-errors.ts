import { PASSWORD_MIN } from "./password";

type AuthErrorLike = { message: string; code?: string | null; reasons?: readonly string[] };

/**
 * Erros do Supabase Auth em português. Usa o código do erro quando ele existe e,
 * se não houver código, reconhece o texto em inglês.
 */
export function authErrorMessage(error: AuthErrorLike): string {
  const message = error.message ?? "";
  const m = message.toLowerCase();

  // "For security purposes, you can only request this after 42 seconds."
  const wait = m.match(/after (\d+) seconds?/);
  if (wait) return `Por segurança, aguarde ${wait[1]} segundos antes de pedir de novo.`;

  switch (error.code) {
    case "invalid_credentials":
      return "E-mail ou senha incorretos.";
    case "email_not_confirmed":
      return "Confirme seu e-mail antes de entrar — enviamos um link para sua caixa de entrada.";
    case "user_already_exists":
      return "Já existe uma conta com este e-mail. Faça login.";
    case "email_exists":
      return "Este e-mail já é usado por outra conta do Lyra.";
    case "same_password":
      return "Essa já é a sua senha atual. Escolha uma diferente.";
    case "weak_password":
      return weakPasswordMessage(error);
    case "over_email_send_rate_limit":
      return "Muitos e-mails enviados em pouco tempo. Aguarde alguns minutos e tente de novo.";
    case "over_request_rate_limit":
      return "Muitas tentativas. Aguarde alguns minutos e tente novamente.";
    case "email_address_invalid":
      return "Informe um e-mail válido.";
    case "email_address_not_authorized":
      return "O Supabase ainda não envia e-mails para este endereço. Configure um SMTP próprio em Authentication → Emails no painel do Supabase.";
    case "signup_disabled":
      return "Novos cadastros estão desativados neste projeto.";
    case "reauthentication_needed":
    case "reauth_nonce_missing":
      return "Por segurança, saia e entre de novo antes de trocar a senha.";
    case "session_not_found":
    case "session_expired":
      return "Sua sessão expirou. Entre de novo para continuar.";
    case "otp_expired":
    case "flow_state_expired":
    case "flow_state_not_found":
    case "bad_code_verifier":
      return "O link expirou ou já foi usado. Peça um novo.";
  }

  if (m.includes("invalid login credentials")) return "E-mail ou senha incorretos.";
  if (m.includes("email not confirmed")) return "Confirme seu e-mail antes de entrar — enviamos um link para sua caixa de entrada.";
  if (m.includes("already registered")) return "Já existe uma conta com este e-mail. Faça login.";
  if (m.includes("password should") || m.includes("password cannot be longer")) return weakPasswordMessage(error);
  if (m.includes("rate limit") || m.includes("too many")) return "Muitas tentativas. Aguarde alguns minutos e tente novamente.";
  if (m.includes("signups not allowed")) return "Novos cadastros estão desativados neste projeto.";
  if (m.includes("invalid email") || m.includes("unable to validate email")) return "Informe um e-mail válido.";
  if (m.includes("error sending")) return "Não foi possível enviar o e-mail. Verifique as configurações de e-mail do Supabase.";
  return message || "Algo deu errado. Tente novamente.";
}

/** Explica a regra de senha que o Supabase recusou: tamanho, tipos de caractere ou senha vazada. */
function weakPasswordMessage({ message, reasons }: AuthErrorLike) {
  if (reasons?.includes("pwned")) return "Essa senha já apareceu em vazamentos de dados. Escolha outra.";
  if (/longer than/i.test(message)) return "A senha está longa demais. Use até 72 caracteres.";

  // "Password should contain at least one character of each: abcdefghijklmnopqrstuvwxyz, ABCDEFGHIJKLMNOPQRSTUVWXYZ, 0123456789"
  const kinds = [
    message.includes("abcdefghijklmnopqrstuvwxyz") && "letras minúsculas",
    message.includes("ABCDEFGHIJKLMNOPQRSTUVWXYZ") && "letras maiúsculas",
    message.includes("0123456789") && "números",
    /[!@#$%^&*]{3}/.test(message) && "símbolos",
  ].filter((kind): kind is string => Boolean(kind));
  if (reasons?.includes("characters") || kinds.length > 0) {
    if (kinds.length === 0) return "A senha precisa misturar tipos diferentes de caracteres.";
    const list = kinds.length > 1 ? `${kinds.slice(0, -1).join(", ")} e ${kinds.at(-1)}` : kinds[0];
    return `A senha precisa ter ${list}.`;
  }

  const min = message.match(/at least (\d+) characters/i)?.[1];
  return `A senha precisa ter pelo menos ${min ?? PASSWORD_MIN} caracteres.`;
}
