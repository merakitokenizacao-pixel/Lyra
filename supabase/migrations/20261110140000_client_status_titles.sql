-- Linha do tempo do cliente: o registro de mudança de status passa a dizer para qual status foi
-- ("Status alterado para Ativo"), no mesmo padrão de "Etapa alterada para …" dos leads.

create or replace function private.client_status_label(p_status public.client_status)
returns text
language sql
immutable
set search_path = ''
as $$
  select case p_status
    when 'onboarding' then 'Onboarding'
    when 'active' then 'Ativo'
    when 'at_risk' then 'Em risco'
    when 'paused' then 'Pausado'
    when 'churned' then 'Cancelado'
  end;
$$;

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
      new.organization_id, new.id, 'status_change',
      'Status alterado para ' || private.client_status_label(new.status),
      jsonb_build_object('from', old.status, 'to', new.status), auth.uid()
    );
  end if;
  return null;
end;
$$;

-- Atualiza os registros já existentes
update public.activities
set title = 'Status alterado para ' || private.client_status_label((meta ->> 'to')::public.client_status)
where type = 'status_change'
  and title = 'Status do cliente alterado'
  and meta ? 'to';
