-- Ajustes apontados pelos advisors do Supabase.

-- 1) rls_auto_enable() é a função do event trigger `ensure_rls` (criada pelo template do Supabase,
--    liga RLS em tabelas novas). Ela não precisa ser chamável pela API; o trigger continua funcionando.
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;

-- 2) respond_proposal: a validade passa a ser comparada no fuso de São Paulo (antes era UTC,
--    então após as 21h uma proposta válida "até hoje" era tratada como expirada).
--    get_public_proposal / mark_proposal_viewed / respond_proposal seguem acessíveis ao anon de
--    propósito: o link público da proposta é protegido pelo token (UUID aleatório).
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
  if v_status = 'expired' or (v_valid is not null and v_valid < (now() at time zone 'America/Sao_Paulo')::date) then
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
