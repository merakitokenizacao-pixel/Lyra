# Lyro

CRM para gestão comercial: leads, pipeline de qualificação, clientes, propostas personalizadas e acompanhamento do estado de cada cliente. Multiempresa (cada organização vê só os próprios dados) e em português.

## O que já existe

| Módulo | O que faz |
| --- | --- |
| **Início** | Pulso da operação: pipeline em aberto, novos leads (30 dias), conversão, receita recorrente, leads por etapa, clientes por status, próximas tarefas, propostas e atividade recente. |
| **Pipeline** | Quadro kanban com arrastar e soltar entre etapas. Ao mover para *Ganho*, oferece converter em cliente; para *Perdido*, pede o motivo. |
| **Leads** | Lista com busca e filtros (etapa, temperatura, origem). Ficha com etapas, qualificação BANT, temperatura, linha do tempo (notas, ligações, e-mails, reuniões, WhatsApp, tarefas com prazo). |
| **Clientes** | Lista por status ou quadro (Onboarding, Ativo, Em risco, Pausado, Cancelado), contatos, linha do tempo (inclui o histórico do lead de origem) e propostas. |
| **Propostas** | Editor com seções, itens do catálogo ou personalizados (pagamento único ou mensal, desconto), condições e validade. Gera um link público em que o cliente lê, imprime/salva em PDF e aceita ou recusa. Cada etapa (enviada, visualizada, aceita) entra na linha do tempo. |
| **Produtos e serviços** | Catálogo usado nas propostas. |
| **Configurações** | *Empresa e time* (nome, membros, papéis e convites por link), *Etapas do pipeline* e *Minha conta* (perfil, e-mail de acesso, senha e sessão). |

## Stack

- Next.js 16 (App Router, Turbopack, `cacheComponents`), React 19, TypeScript
- Tailwind CSS 4, Radix UI, dnd-kit, lucide-react, sonner
- Supabase: Postgres com RLS por organização, Auth e RPCs

## Rodando localmente

1. Instale as dependências:

   ```bash
   npm install
   ```

2. Copie `.env.example` para `.env.local` e preencha com os dados do projeto Supabase (Project Settings → API):

   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxx
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   ```

3. Suba o servidor de desenvolvimento e abra http://localhost:3000:

   ```bash
   npm run dev
   ```

## Banco de dados (Supabase)

As migrações ficam em `supabase/migrations` e devem ser aplicadas em ordem (pelo SQL Editor do Supabase ou com a CLI, `npx supabase db push`):

| Arquivo | Conteúdo |
| --- | --- |
| `20261110120000_initial_schema.sql` | Tabelas, enums, RLS, triggers da linha do tempo e RPCs (`create_organization`, `save_proposal`, link público…) |
| `20261110120100_demo_seed.sql` | Dados de exemplo opcionais (marcados no onboarding) |
| `20261110140000_client_status_titles.sql` | Linha do tempo do cliente diz para qual status mudou |
| `20261110150000_advisor_fixes.sql` | Ajustes dos advisors (permissões e fuso da validade das propostas) |
| `20261110160000_profile_details_and_column_grants.sql` | Apelido e cargo no perfil; o app só altera as colunas liberadas |
| `20261110170000_sync_profile_email.sql` | Troca de e-mail confirmada no Auth atualiza o e-mail do perfil |

Depois de alterar o schema, regenere os tipos:

```bash
npx supabase gen types typescript --project-id <project-ref> > src/lib/supabase/database.types.ts
```

### Configurações de Auth no painel

- **Authentication → URL Configuration**: em *Site URL*, coloque a URL do app. Em *Redirect URLs*, inclua `http://localhost:3000/auth/callback` e `http://localhost:3000/auth/confirm` (e os equivalentes do domínio de produção).
- **Confirmação de e-mail** (*Authentication → Sign In / Providers → Email → Confirm email*): ligada, o usuário confirma pelo link antes de entrar. Para uso interno, dá para desligar e entrar direto após o cadastro.
- **E-mails (SMTP)**: recuperação de senha e troca de e-mail dependem de e-mail. O SMTP padrão do Supabase só entrega para endereços do time da organização no Supabase e tem limite baixo por hora; para uso real, configure um SMTP próprio em *Authentication → Emails → SMTP*. Os links usam PKCE e precisam ser abertos no mesmo navegador do pedido (com templates no formato `token_hash`, o `/auth/confirm` aceita links abertos em qualquer aparelho).
- **Proteção contra senhas vazadas**: recomendado ativar (o advisor de segurança aponta). Veja [Password security](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).

### Modelo de segurança

- Toda tabela tem `organization_id` e políticas RLS que só liberam linhas das organizações de que o usuário é membro. Papéis: `owner`, `admin`, `member` (configurações e equipe exigem admin).
- O link público da proposta (`/p/<token>`) usa três RPCs `SECURITY DEFINER` liberadas ao `anon` de propósito: `get_public_proposal`, `mark_proposal_viewed` e `respond_proposal`. Elas só funcionam com o token (UUID aleatório), nunca expõem rascunhos e validam status e validade.
- Convites: o Lyro não envia e-mail; o convite é um link. Quem é convidado entra na organização automaticamente ao entrar ou criar a conta com o e-mail do convite.
- Senha: trocar em *Minha conta* exige a senha atual. Sem ela, só pelo link de recuperação, e por até 30 minutos depois de aberto.

## Estrutura

```
src/
  app/
    (app)/            telas autenticadas (início, pipeline, leads, clientes, propostas, produtos, configurações)
    (auth)/           login, cadastro e recuperação de senha
    auth/             callback, confirmação de e-mail e saída
    onboarding/       criação da empresa
    p/[token]/        proposta pública
  components/         UI (botões, diálogos, kanban, documento da proposta, linha do tempo)
  lib/
    auth.ts           sessão e organização ativa (getContext)
    queries.ts        consultas compartilhadas (pipelines, membros…)
    format.ts         moeda, datas e fuso (America/Sao_Paulo)
    supabase/         clientes Supabase (servidor, navegador, proxy) e tipos
  proxy.ts            renova a sessão do Supabase a cada requisição
supabase/migrations/  schema, seed e ajustes
```

## Notas de Next.js 16

- Com `cacheComponents`, tudo que lê cookies ou dados por requisição fica dentro de `<Suspense>`.
- `createClient()` (em `src/lib/supabase/server.ts`) chama `io()` antes de criar o cliente: o Supabase compara a expiração do token com o relógio, e isso precisa rodar a cada requisição, fora do prerender.
- `proxy.ts` substitui o antigo `middleware.ts`.
