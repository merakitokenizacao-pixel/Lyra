-- Funis: o desenho do caminho de cada produto (origem → etapas → conversão), com variantes
-- para testar abordagens diferentes. As etapas, conexões e números de cada variante ficam em
-- `variants` (jsonb); a aplicação valida o conteúdo e o banco garante o formato e o tamanho.

create type public.funnel_status as enum ('draft', 'testing', 'active', 'paused', 'archived');

create table public.funnels (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  description text check (description is null or char_length(description) <= 2000),
  status public.funnel_status not null default 'draft',
  product_id uuid references public.products (id) on delete set null,
  variants jsonb not null default '[]'::jsonb
    check (jsonb_typeof(variants) = 'array' and octet_length(variants::text) <= 600000),
  winner_variant text check (winner_variant is null or char_length(winner_variant) between 1 and 40),
  created_by uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index funnels_organization_id_idx on public.funnels (organization_id);
create index funnels_product_id_idx on public.funnels (product_id);
create index funnels_created_by_idx on public.funnels (created_by);

create trigger funnels_updated_at before update on public.funnels
  for each row execute function private.set_updated_at();

alter table public.funnels enable row level security;

create policy "funnels_members" on public.funnels
  for all to authenticated
  using (organization_id in (select private.my_org_ids()))
  with check (organization_id in (select private.my_org_ids()));

-- Mesmo padrão das outras tabelas: nada para o anon; o time da empresa lê e escreve.
-- Na edição, a empresa, o autor e as datas não mudam pela API.
revoke all on public.funnels from anon, authenticated;
grant select, insert, delete on public.funnels to authenticated;
grant update (name, description, status, product_id, variants, winner_variant) on public.funnels to authenticated;
