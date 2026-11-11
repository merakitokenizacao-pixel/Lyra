import type { FunnelDoc } from "@/lib/funnels";

/**
 * Última versão salva de cada funil nesta aba. Se o editor montar de novo com dados antigos
 * (voltar pelo histórico, cache do roteador), ele parte daqui em vez de desfazer o que já foi salvo.
 * Fica num módulo próprio, sem dependências, para sobreviver ao recarregamento do editor no dev.
 */
export const savedFunnels = new Map<string, { doc: FunnelDoc; version: string }>();
