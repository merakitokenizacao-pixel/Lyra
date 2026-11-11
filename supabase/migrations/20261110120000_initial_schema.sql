-- =============================================================
-- Lyra CRM · Schema inicial
-- Organizações (multi-empresa), leads, pipelines, clientes,
-- contatos, atividades, catálogo de produtos e propostas.
-- =============================================================

create schema if not exists private;

-- ---------------------------------------------------------------
-- Tipos
-- ---------------------------------------------------------------
create type public.member_role as enum ('owner', 'admin', 'member');
create type public.stage_category as enum ('open', 'won', 'lost');
create type public.lead_temperature as enum ('cold', 'warm', 'hot');
create type public.client_status as enum ('onboarding', 'active', 'at_risk', 'paused', 'churned');
create type public.proposal_status as enum ('draft', 'sent', 'viewed', 'accepted', 'rejected', 'expired');
create type public.activity_type as enum (
  'note', 'call', 'email', 'meeting', 'whatsapp', 'task',
  'stage_change', 'status_change', 'proposal', 'system'
);
create type public.billing_cycle as enum ('one_time', 'monthly');

-- ---------------------------------------------------------------
-- Perfis e organizações
-- ---------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  email text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  proposal_counter integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.organization_members (
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role public.member_role not null default 'member',
  created_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);
create index organization_members_user_id_idx on public.organization_members (user_id);

create table public.organization_invites (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  email text not null check (email = lower(email) and position('@' in email) > 1),
  role public.member_role not null default 'member' check (role <> 'owner'),
  invited_by uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  accepted_at timestamptz,
  unique (organization_id, email)
);
create index organization_invites_email_idx on public.organization_invites (email);
create index organization_invites_invited_by_idx on public.organization_invites (invited_by);

-- ---------------------------------------------------------------
-- Pipelines de qualificação
-- ---------------------------------------------------------------
create table public.pipelines (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  position integer not null default 0,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index pipelines_organization_id_idx on public.pipelines (organization_id, position);

create table public.pipeline_stages (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  pipeline_id uuid not null references public.pipelines (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  color text not null default 'stone'
    check (color in ('stone', 'blue', 'violet', 'orange', 'amber', 'green', 'red', 'teal', 'pink')),
  category public.stage_category not null default 'open',
  position integer not null default 0,
  created_at timestamptz not null default now()
);
create index pipeline_stages_pipeline_id_idx on public.pipeline_stages (pipeline_id, position);
create index pipeline_stages_organization_id_idx on public.pipeline_stages (organization_id);

-- ---------------------------------------------------------------
-- Leads
-- ---------------------------------------------------------------
create table public.leads (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  pipeline_id uuid not null references public.pipelines (id),
  stage_id uuid not null references public.pipeline_stages (id),
  position double precision not null default 0,
  name text not null check (char_length(name) between 1 and 160),
  company text,
  job_title text,
  email text,
  phone text,
  source text,
  estimated_value numeric(14, 2) not null default 0 check (estimated_value >= 0),
  temperature public.lead_temperature not null default 'warm',
  qual_budget boolean not null default false,
  qual_authority boolean not null default false,
  qual_need boolean not null default false,
  qual_timing boolean not null default false,
  expected_close_date date,
  lost_reason text,
  notes text,
  tags text[] not null default '{}',
  owner_id uuid default auth.uid() references public.profiles (id) on delete set null,
  converted_client_id uuid,
  converted_at timestamptz,
  stage_changed_at timestamptz not null default now(),
  created_by uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index leads_organization_id_idx on public.leads (organization_id, created_at desc);
create index leads_stage_id_idx on public.leads (stage_id, position);
create index leads_pipeline_id_idx on public.leads (pipeline_id);
create index leads_owner_id_idx on public.leads (owner_id);
create index leads_created_by_idx on public.leads (created_by);
create index leads_converted_client_id_idx on public.leads (converted_client_id);

-- ---------------------------------------------------------------
-- Clientes e contatos
-- ---------------------------------------------------------------
create table public.clients (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 160),
  legal_name text,
  kind text not null default 'company' check (kind in ('company', 'person')),
  document text,
  email text,
  phone text,
  website text,
  industry text,
  city text,
  state text,
  status public.client_status not null default 'onboarding',
  status_changed_at timestamptz not null default now(),
  position double precision not null default 0,
  monthly_value numeric(14, 2) not null default 0 check (monthly_value >= 0),
  customer_since date default current_date,
  notes text,
  tags text[] not null default '{}',
  owner_id uuid default auth.uid() references public.profiles (id) on delete set null,
  lead_id uuid references public.leads (id) on delete set null,
  created_by uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index clients_organization_id_idx on public.clients (organization_id, created_at desc);
create index clients_status_idx on public.clients (organization_id, status, position);
create index clients_owner_id_idx on public.clients (owner_id);
create index clients_created_by_idx on public.clients (created_by);
create index clients_lead_id_idx on public.clients (lead_id);

alter table public.leads
  add constraint leads_converted_client_id_fkey
  foreign key (converted_client_id) references public.clients (id) on delete set null;

create table public.contacts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  client_id uuid not null references public.clients (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 160),
  job_title text,
  email text,
  phone text,
  is_primary boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index contacts_client_id_idx on public.contacts (client_id);
create index contacts_organization_id_idx on public.contacts (organization_id);

-- ---------------------------------------------------------------
-- Catálogo de produtos/serviços
-- ---------------------------------------------------------------
create table public.products (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 160),
  description text,
  unit_price numeric(14, 2) not null default 0 check (unit_price >= 0),
  unit text not null default 'un',
  billing public.billing_cycle not null default 'one_time',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index products_organization_id_idx on public.products (organization_id);

-- ---------------------------------------------------------------
-- Propostas
-- ---------------------------------------------------------------
create table public.proposals (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  number integer not null default 0,
  title text not null check (char_length(title) between 1 and 200),
  client_id uuid references public.clients (id) on delete set null,
  lead_id uuid references public.leads (id) on delete set null,
  status public.proposal_status not null default 'draft',
  valid_until date,
  intro text,
  sections jsonb not null default '[]'::jsonb check (jsonb_typeof(sections) = 'array'),
  terms text,
  total_one_time numeric(14, 2) not null default 0,
  total_monthly numeric(14, 2) not null default 0,
  public_token uuid not null default gen_random_uuid() unique,
  sent_at timestamptz,
  viewed_at timestamptz,
  responded_at timestamptz,
  response_name text,
  response_comment text,
  owner_id uuid default auth.uid() references public.profiles (id) on delete set null,
  created_by uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, number)
);
create index proposals_organization_id_idx on public.proposals (organization_id, created_at desc);
create index proposals_client_id_idx on public.proposals (client_id);
create index proposals_lead_id_idx on public.proposals (lead_id);
create index proposals_owner_id_idx on public.proposals (owner_id);
create index proposals_created_by_idx on public.proposals (created_by);

create table public.proposal_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  proposal_id uuid not null references public.proposals (id) on delete cascade,
  product_id uuid references public.products (id) on delete set null,
  name text not null check (char_length(name) between 1 and 200),
  description text,
  quantity numeric(12, 2) not null default 1 check (quantity > 0),
  unit_price numeric(14, 2) not null default 0 check (unit_price >= 0),
  discount_pct numeric(5, 2) not null default 0 check (discount_pct >= 0 and discount_pct <= 100),
  billing public.billing_cycle not null default 'one_time',
  position integer not null default 0,
  total numeric(14, 2) generated always as (round(quantity * unit_price * (1 - discount_pct / 100), 2)) stored,
  created_at timestamptz not null default now()
);
create index proposal_items_proposal_id_idx on public.proposal_items (proposal_id, position);
create index proposal_items_organization_id_idx on public.proposal_items (organization_id);
create index proposal_items_product_id_idx on public.proposal_items (product_id);

-- ---------------------------------------------------------------
-- Atividades (timeline, notas, tarefas, histórico)
-- ---------------------------------------------------------------
create table public.activities (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  lead_id uuid references public.leads (id) on delete cascade,
  client_id uuid references public.clients (id) on delete cascade,
  proposal_id uuid references public.proposals (id) on delete set null,
  type public.activity_type not null default 'note',
  title text,
  body text,
  due_at timestamptz,
  completed_at timestamptz,
  meta jsonb not null default '{}'::jsonb,
  created_by uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint activities_subject_check check (lead_id is not null or client_id is not null)
);
create index activities_organization_id_idx on public.activities (organization_id, created_at desc);
create index activities_open_tasks_idx on public.activities (organization_id, due_at)
  where type = 'task' and completed_at is null;
create index activities_lead_id_idx on public.activities (lead_id, created_at desc);
create index activities_client_id_idx on public.activities (client_id, created_at desc);
create index activities_proposal_id_idx on public.activities (proposal_id);
create index activities_created_by_idx on public.activities (created_by);

-- ---------------------------------------------------------------
-- Funções auxiliares de acesso (schema privado, fora da API)
-- ---------------------------------------------------------------
create or replace function private.my_org_ids()
returns setof uuid
language sql
stable
security definer
set search_path = ''
as $$
  select m.organization_id
  from public.organization_members m
  where m.user_id = (select auth.uid());
$$;

create or replace function private.my_admin_org_ids()
returns setof uuid
language sql
stable
security definer
set search_path = ''
as $$
  select m.organization_id
  from public.organization_members m
  where m.user_id = (select auth.uid())
    and m.role in ('owner', 'admin');
$$;

create or replace function private.my_coworker_ids()
returns setof uuid
language sql
stable
security definer
set search_path = ''
as $$
  select distinct other.user_id
  from public.organization_members me
  join public.organization_members other on other.organization_id = me.organization_id
  where me.user_id = (select auth.uid());
$$;

-- ---------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------
create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_updated_at before update on public.profiles
  for each row execute function private.set_updated_at();
create trigger organizations_updated_at before update on public.organizations
  for each row execute function private.set_updated_at();
create trigger pipelines_updated_at before update on public.pipelines
  for each row execute function private.set_updated_at();
create trigger leads_updated_at before update on public.leads
  for each row execute function private.set_updated_at();
create trigger clients_updated_at before update on public.clients
  for each row execute function private.set_updated_at();
create trigger contacts_updated_at before update on public.contacts
  for each row execute function private.set_updated_at();
create trigger products_updated_at before update on public.products
  for each row execute function private.set_updated_at();
create trigger proposals_updated_at before update on public.proposals
  for each row execute function private.set_updated_at();

-- Novo usuário → perfil
create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), split_part(new.email, '@', 1)),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

-- Lead: valida a etapa, deriva o pipeline e marca a data de mudança de etapa
create or replace function private.leads_before_write()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_pipeline uuid;
  v_org uuid;
begin
  select s.pipeline_id, s.organization_id into v_pipeline, v_org
  from public.pipeline_stages s
  where s.id = new.stage_id;

  if v_pipeline is null or v_org is distinct from new.organization_id then
    raise exception 'Etapa inválida para esta organização';
  end if;

  new.pipeline_id := v_pipeline;

  if tg_op = 'UPDATE' and new.stage_id is distinct from old.stage_id then
    new.stage_changed_at := now();
  end if;
  return new;
end;
$$;

create trigger leads_before_write
  before insert or update on public.leads
  for each row execute function private.leads_before_write();

-- Lead: registra criação e mudanças de etapa na timeline
create or replace function private.leads_after_write()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_from text;
  v_to text;
begin
  if tg_op = 'INSERT' then
    insert into public.activities (organization_id, lead_id, type, title, created_by, created_at)
    values (new.organization_id, new.id, 'system', 'Lead criado', coalesce(auth.uid(), new.created_by), new.created_at);
  elsif new.stage_id is distinct from old.stage_id then
    select name into v_from from public.pipeline_stages where id = old.stage_id;
    select name into v_to from public.pipeline_stages where id = new.stage_id;
    insert into public.activities (organization_id, lead_id, type, title, meta, created_by)
    values (
      new.organization_id, new.id, 'stage_change',
      'Etapa alterada para ' || coalesce(v_to, '—'),
      jsonb_build_object('from_stage_id', old.stage_id, 'to_stage_id', new.stage_id, 'from', v_from, 'to', v_to),
      auth.uid()
    );
  end if;
  return null;
end;
$$;

create trigger leads_after_write
  after insert or update on public.leads
  for each row execute function private.leads_after_write();

-- Cliente: data de mudança de status
create or replace function private.clients_before_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status is distinct from old.status then
    new.status_changed_at := now();
  end if;
  return new;
end;
$$;

create trigger clients_before_update
  before update on public.clients
  for each row execute function private.clients_before_update();

-- Cliente: registra cadastro e mudanças de status na timeline
create or replace function private.clients_after_write()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.activities (organization_id, client_id, type, title, meta, created_by, created_at)
    values (
      new.organization_id, new.id, 'system', 'Cliente cadastrado',
      jsonb_build_object('status', new.status), coalesce(auth.uid(), new.created_by), new.created_at
    );
  elsif new.status is distinct from old.status then
    insert into public.activities (organization_id, client_id, type, title, meta, created_by)
    values (
      new.organization_id, new.id, 'status_change', 'Status do cliente alterado',
      jsonb_build_object('from', old.status, 'to', new.status), auth.uid()
    );
  end if;
  return null;
end;
$$;

create trigger clients_after_write
  after insert or update on public.clients
  for each row execute function private.clients_after_write();

-- Proposta: numeração sequencial por organização
create or replace function private.proposals_assign_number()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.organizations
  set proposal_counter = proposal_counter + 1
  where id = new.organization_id
  returning proposal_counter into new.number;

  if new.number is null then
    raise exception 'Organização inválida';
  end if;
  return new;
end;
$$;

create trigger proposals_assign_number
  before insert on public.proposals
  for each row execute function private.proposals_assign_number();

-- Proposta: registra criação e mudanças de status na timeline do cliente/lead
create or replace function private.proposals_after_write()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_title text;
begin
  if new.client_id is null and new.lead_id is null then
    return null;
  end if;

  if tg_op = 'INSERT' then
    v_title := 'Proposta #' || new.number || ' criada';
  elsif new.status is distinct from old.status then
    v_title := 'Proposta #' || new.number || ' ' || case new.status
      when 'sent' then 'enviada'
      when 'viewed' then 'visualizada pelo cliente'
      when 'accepted' then 'aceita'
      when 'rejected' then 'recusada'
      when 'expired' then 'expirada'
      else 'voltou para rascunho'
    end;
  else
    return null;
  end if;

  insert into public.activities (organization_id, client_id, lead_id, proposal_id, type, title, body, meta, created_by, created_at)
  values (
    new.organization_id, new.client_id, new.lead_id, new.id, 'proposal', v_title,
    case when tg_op = 'UPDATE' and new.status in ('accepted', 'rejected') then new.response_comment end,
    jsonb_build_object('status', new.status, 'number', new.number, 'response_name', new.response_name),
    coalesce(auth.uid(), case when tg_op = 'INSERT' then new.created_by end),
    case when tg_op = 'INSERT' then new.created_at else now() end
  );
  return null;
end;
$$;

create trigger proposals_after_write
  after insert or update on public.proposals
  for each row execute function private.proposals_after_write();

-- Itens: recalcula os totais da proposta
create or replace function private.proposal_items_recalc()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_proposal uuid := coalesce(new.proposal_id, old.proposal_id);
begin
  update public.proposals p
  set total_one_time = coalesce((
        select sum(i.total) from public.proposal_items i
        where i.proposal_id = v_proposal and i.billing = 'one_time'), 0),
      total_monthly = coalesce((
        select sum(i.total) from public.proposal_items i
        where i.proposal_id = v_proposal and i.billing = 'monthly'), 0)
  where p.id = v_proposal;
  return null;
end;
$$;

create trigger proposal_items_recalc
  after insert or update or delete on public.proposal_items
  for each row execute function private.proposal_items_recalc();

-- ---------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.organization_invites enable row level security;
alter table public.pipelines enable row level security;
alter table public.pipeline_stages enable row level security;
alter table public.leads enable row level security;
alter table public.clients enable row level security;
alter table public.contacts enable row level security;
alter table public.products enable row level security;
alter table public.proposals enable row level security;
alter table public.proposal_items enable row level security;
alter table public.activities enable row level security;

-- Perfis: o próprio usuário e colegas de organização
create policy "profiles_select" on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or id in (select private.my_coworker_ids()));
create policy "profiles_update_self" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- Organizações: membros leem, admins editam (criação via RPC)
create policy "organizations_select" on public.organizations
  for select to authenticated
  using (id in (select private.my_org_ids()));
create policy "organizations_update" on public.organizations
  for update to authenticated
  using (id in (select private.my_admin_org_ids()))
  with check (id in (select private.my_admin_org_ids()));

-- Membros: todos leem; admins alteram/removem quem não é owner
create policy "members_select" on public.organization_members
  for select to authenticated
  using (organization_id in (select private.my_org_ids()));
create policy "members_update" on public.organization_members
  for update to authenticated
  using (organization_id in (select private.my_admin_org_ids()) and role <> 'owner')
  with check (organization_id in (select private.my_admin_org_ids()) and role <> 'owner');
create policy "members_delete" on public.organization_members
  for delete to authenticated
  using (organization_id in (select private.my_admin_org_ids()) and role <> 'owner');

-- Convites: apenas admins
create policy "invites_admin" on public.organization_invites
  for all to authenticated
  using (organization_id in (select private.my_admin_org_ids()))
  with check (organization_id in (select private.my_admin_org_ids()));

-- Dados do CRM: acesso total para membros da organização
create policy "pipelines_members" on public.pipelines
  for all to authenticated
  using (organization_id in (select private.my_org_ids()))
  with check (organization_id in (select private.my_org_ids()));
create policy "pipeline_stages_members" on public.pipeline_stages
  for all to authenticated
  using (organization_id in (select private.my_org_ids()))
  with check (organization_id in (select private.my_org_ids()));
create policy "leads_members" on public.leads
  for all to authenticated
  using (organization_id in (select private.my_org_ids()))
  with check (organization_id in (select private.my_org_ids()));
create policy "clients_members" on public.clients
  for all to authenticated
  using (organization_id in (select private.my_org_ids()))
  with check (organization_id in (select private.my_org_ids()));
create policy "contacts_members" on public.contacts
  for all to authenticated
  using (organization_id in (select private.my_org_ids()))
  with check (organization_id in (select private.my_org_ids()));
create policy "products_members" on public.products
  for all to authenticated
  using (organization_id in (select private.my_org_ids()))
  with check (organization_id in (select private.my_org_ids()));
create policy "proposals_members" on public.proposals
  for all to authenticated
  using (organization_id in (select private.my_org_ids()))
  with check (organization_id in (select private.my_org_ids()));
create policy "proposal_items_members" on public.proposal_items
  for all to authenticated
  using (organization_id in (select private.my_org_ids()))
  with check (organization_id in (select private.my_org_ids()));
create policy "activities_members" on public.activities
  for all to authenticated
  using (organization_id in (select private.my_org_ids()))
  with check (organization_id in (select private.my_org_ids()));

-- ---------------------------------------------------------------
-- RPCs (API)
-- ---------------------------------------------------------------

-- Cria a organização do usuário com o pipeline padrão
create or replace function public.create_organization(p_name text, p_with_demo boolean default false)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_org uuid;
  v_pipeline uuid;
begin
  if v_user is null then
    raise exception 'Não autenticado';
  end if;
  if coalesce(trim(p_name), '') = '' then
    raise exception 'Informe o nome da empresa';
  end if;

  insert into public.profiles (id, email, full_name)
  select u.id, u.email, coalesce(nullif(trim(u.raw_user_meta_data ->> 'full_name'), ''), split_part(u.email, '@', 1))
  from auth.users u
  where u.id = v_user
  on conflict (id) do nothing;

  insert into public.organizations (name) values (left(trim(p_name), 120)) returning id into v_org;
  insert into public.organization_members (organization_id, user_id, role) values (v_org, v_user, 'owner');

  insert into public.pipelines (organization_id, name, position, is_default)
  values (v_org, 'Qualificação de leads', 0, true)
  returning id into v_pipeline;

  insert into public.pipeline_stages (organization_id, pipeline_id, name, color, category, position) values
    (v_org, v_pipeline, 'Novo', 'stone', 'open', 0),
    (v_org, v_pipeline, 'Em contato', 'blue', 'open', 1),
    (v_org, v_pipeline, 'Qualificado', 'violet', 'open', 2),
    (v_org, v_pipeline, 'Proposta enviada', 'orange', 'open', 3),
    (v_org, v_pipeline, 'Negociação', 'amber', 'open', 4),
    (v_org, v_pipeline, 'Ganho', 'green', 'won', 5),
    (v_org, v_pipeline, 'Perdido', 'red', 'lost', 6);

  if p_with_demo then
    perform private.seed_demo_data(v_org, v_user);
  end if;

  return v_org;
end;
$$;

-- Aceita convites pendentes do e-mail (confirmado) do usuário atual
create or replace function public.accept_pending_invites()
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_email text;
  v_org uuid;
begin
  if v_user is null then
    return null;
  end if;

  select lower(u.email) into v_email
  from auth.users u
  where u.id = v_user and u.email_confirmed_at is not null;

  if v_email is null then
    return null;
  end if;

  insert into public.profiles (id, email, full_name)
  select u.id, u.email, coalesce(nullif(trim(u.raw_user_meta_data ->> 'full_name'), ''), split_part(u.email, '@', 1))
  from auth.users u
  where u.id = v_user
  on conflict (id) do nothing;

  with accepted as (
    update public.organization_invites i
    set accepted_at = now()
    where i.email = v_email and i.accepted_at is null
    returning i.organization_id, i.role
  ), inserted as (
    insert into public.organization_members (organization_id, user_id, role)
    select a.organization_id, v_user, a.role from accepted a
    on conflict do nothing
    returning organization_id
  )
  select organization_id into v_org from inserted limit 1;

  return v_org;
end;
$$;

-- Converte um lead em cliente (respeita RLS)
create or replace function public.convert_lead_to_client(p_lead_id uuid)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_lead public.leads;
  v_client uuid;
  v_won_stage uuid;
  v_company text;
begin
  select * into v_lead from public.leads where id = p_lead_id;
  if not found then
    raise exception 'Lead não encontrado';
  end if;
  if v_lead.converted_client_id is not null then
    return v_lead.converted_client_id;
  end if;

  v_company := nullif(trim(coalesce(v_lead.company, '')), '');

  insert into public.clients (organization_id, name, kind, email, phone, status, owner_id, lead_id, tags, notes)
  values (
    v_lead.organization_id,
    coalesce(v_company, v_lead.name),
    case when v_company is null then 'person' else 'company' end,
    v_lead.email, v_lead.phone, 'onboarding', v_lead.owner_id, v_lead.id, v_lead.tags, v_lead.notes
  )
  returning id into v_client;

  if v_company is not null then
    insert into public.contacts (organization_id, client_id, name, job_title, email, phone, is_primary)
    values (v_lead.organization_id, v_client, v_lead.name, v_lead.job_title, v_lead.email, v_lead.phone, true);
  end if;

  select s.id into v_won_stage
  from public.pipeline_stages s
  where s.pipeline_id = v_lead.pipeline_id and s.category = 'won'
  order by s.position
  limit 1;

  update public.leads l
  set converted_client_id = v_client,
      converted_at = now(),
      stage_id = case
        when exists (select 1 from public.pipeline_stages cs where cs.id = l.stage_id and cs.category = 'won')
          then l.stage_id
        else coalesce(v_won_stage, l.stage_id)
      end
  where l.id = v_lead.id;

  update public.proposals
  set client_id = v_client
  where lead_id = v_lead.id and client_id is null;

  insert into public.activities (organization_id, client_id, lead_id, type, title)
  values (v_lead.organization_id, v_client, v_lead.id, 'system', 'Lead convertido em cliente');

  return v_client;
end;
$$;

-- Salva a proposta e substitui os itens numa única transação (respeita RLS)
create or replace function public.save_proposal(p_id uuid, p_data jsonb)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_org uuid;
begin
  select organization_id into v_org from public.proposals where id = p_id;
  if v_org is null then
    raise exception 'Proposta não encontrada';
  end if;

  update public.proposals
  set title = coalesce(nullif(trim(p_data ->> 'title'), ''), title),
      client_id = case when p_data ? 'client_id' then nullif(p_data ->> 'client_id', '')::uuid else client_id end,
      lead_id = case when p_data ? 'lead_id' then nullif(p_data ->> 'lead_id', '')::uuid else lead_id end,
      valid_until = case when p_data ? 'valid_until' then nullif(p_data ->> 'valid_until', '')::date else valid_until end,
      intro = case when p_data ? 'intro' then nullif(p_data ->> 'intro', '') else intro end,
      sections = case when jsonb_typeof(p_data -> 'sections') = 'array' then p_data -> 'sections' else sections end,
      terms = case when p_data ? 'terms' then nullif(p_data ->> 'terms', '') else terms end
  where id = p_id;

  if jsonb_typeof(p_data -> 'items') is distinct from 'array' then
    return;
  end if;

  delete from public.proposal_items where proposal_id = p_id;

  insert into public.proposal_items (
    organization_id, proposal_id, product_id, name, description,
    quantity, unit_price, discount_pct, billing, position
  )
  select
    v_org,
    p_id,
    nullif(x ->> 'product_id', '')::uuid,
    left(coalesce(nullif(trim(x ->> 'name'), ''), 'Item'), 200),
    nullif(x ->> 'description', ''),
    greatest(coalesce((x ->> 'quantity')::numeric, 1), 0.01),
    greatest(coalesce((x ->> 'unit_price')::numeric, 0), 0),
    least(greatest(coalesce((x ->> 'discount_pct')::numeric, 0), 0), 100),
    coalesce(nullif(x ->> 'billing', '')::public.billing_cycle, 'one_time'),
    (t.ord - 1)::integer
  from jsonb_array_elements(coalesce(p_data -> 'items', '[]'::jsonb)) with ordinality as t (x, ord);
end;
$$;

-- Página pública da proposta (link enviado ao cliente)
create or replace function public.get_public_proposal(p_token uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'id', p.id,
    'number', p.number,
    'title', p.title,
    'status', p.status,
    'valid_until', p.valid_until,
    'intro', p.intro,
    'sections', p.sections,
    'terms', p.terms,
    'total_one_time', p.total_one_time,
    'total_monthly', p.total_monthly,
    'sent_at', p.sent_at,
    'responded_at', p.responded_at,
    'response_name', p.response_name,
    'created_at', p.created_at,
    'organization', jsonb_build_object('name', o.name),
    'client', case when c.id is null then null else jsonb_build_object('name', c.name, 'legal_name', c.legal_name) end,
    'lead', case when l.id is null then null else jsonb_build_object('name', l.name, 'company', l.company) end,
    'owner', case when pr.id is null then null else jsonb_build_object('full_name', pr.full_name, 'email', pr.email) end,
    'items', coalesce((
      select jsonb_agg(jsonb_build_object(
        'name', i.name,
        'description', i.description,
        'quantity', i.quantity,
        'unit_price', i.unit_price,
        'discount_pct', i.discount_pct,
        'billing', i.billing,
        'total', i.total
      ) order by i.position)
      from public.proposal_items i
      where i.proposal_id = p.id
    ), '[]'::jsonb)
  )
  from public.proposals p
  join public.organizations o on o.id = p.organization_id
  left join public.clients c on c.id = p.client_id
  left join public.leads l on l.id = p.lead_id
  left join public.profiles pr on pr.id = p.owner_id
  where p.public_token = p_token
    and p.status <> 'draft';
$$;

-- Marca a proposta como visualizada pelo cliente
create or replace function public.mark_proposal_viewed(p_token uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.proposals
  set viewed_at = coalesce(viewed_at, now()),
      status = case when status = 'sent' then 'viewed'::public.proposal_status else status end
  where public_token = p_token
    and status in ('sent', 'viewed');
$$;

-- Cliente aceita ou recusa a proposta pelo link público
create or replace function public.respond_proposal(p_token uuid, p_accept boolean, p_name text, p_comment text default null)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
  v_status public.proposal_status;
  v_valid date;
  v_new public.proposal_status;
begin
  select id, status, valid_until into v_id, v_status, v_valid
  from public.proposals
  where public_token = p_token
  for update;

  if v_id is null or v_status = 'draft' then
    raise exception 'Proposta não encontrada';
  end if;
  if v_status in ('accepted', 'rejected') then
    raise exception 'Esta proposta já foi respondida';
  end if;
  if v_status = 'expired' or (v_valid is not null and v_valid < current_date) then
    raise exception 'Esta proposta expirou';
  end if;
  if coalesce(trim(p_name), '') = '' then
    raise exception 'Informe seu nome';
  end if;

  v_new := case when p_accept then 'accepted'::public.proposal_status else 'rejected'::public.proposal_status end;

  update public.proposals
  set status = v_new,
      responded_at = now(),
      viewed_at = coalesce(viewed_at, now()),
      response_name = left(trim(p_name), 160),
      response_comment = nullif(left(trim(coalesce(p_comment, '')), 2000), '')
  where id = v_id;

  return v_new::text;
end;
$$;

-- ---------------------------------------------------------------
-- Privilégios
-- ---------------------------------------------------------------
grant usage on schema private to authenticated;
revoke all on function private.my_org_ids() from public;
revoke all on function private.my_admin_org_ids() from public;
revoke all on function private.my_coworker_ids() from public;
grant execute on function private.my_org_ids() to authenticated;
grant execute on function private.my_admin_org_ids() to authenticated;
grant execute on function private.my_coworker_ids() to authenticated;

revoke all on all tables in schema public from anon;
grant select, insert, update, delete on all tables in schema public to authenticated;

revoke all on function public.create_organization(text, boolean) from public, anon;
revoke all on function public.accept_pending_invites() from public, anon;
revoke all on function public.convert_lead_to_client(uuid) from public, anon;
revoke all on function public.save_proposal(uuid, jsonb) from public, anon;
revoke all on function public.get_public_proposal(uuid) from public;
revoke all on function public.mark_proposal_viewed(uuid) from public;
revoke all on function public.respond_proposal(uuid, boolean, text, text) from public;

grant execute on function public.create_organization(text, boolean) to authenticated;
grant execute on function public.accept_pending_invites() to authenticated;
grant execute on function public.convert_lead_to_client(uuid) to authenticated;
grant execute on function public.save_proposal(uuid, jsonb) to authenticated;
grant execute on function public.get_public_proposal(uuid) to anon, authenticated;
grant execute on function public.mark_proposal_viewed(uuid) to anon, authenticated;
grant execute on function public.respond_proposal(uuid, boolean, text, text) to anon, authenticated;
