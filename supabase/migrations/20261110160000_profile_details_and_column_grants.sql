-- Minha conta: como a pessoa prefere ser chamada (saudação da tela inicial) e o cargo (aparece para o time)
alter table public.profiles
  add column preferred_name text check (preferred_name is null or char_length(preferred_name) between 1 and 40),
  add column job_title text check (job_title is null or char_length(job_title) between 1 and 80);

-- Colunas que a API pode alterar. As políticas de RLS definem QUAIS linhas; estes grants definem QUAIS colunas.
-- O e-mail do perfil vem do Auth, o contador de propostas é das funções do banco (security definer)
-- e o vínculo de um membro (empresa/usuário) não muda — só o papel.
revoke update on public.profiles from anon, authenticated;
grant update (full_name, preferred_name, job_title, avatar_url) on public.profiles to authenticated;

revoke update on public.organizations from anon, authenticated;
grant update (name) on public.organizations to authenticated;

revoke update on public.organization_members from anon, authenticated;
grant update (role) on public.organization_members to authenticated;
