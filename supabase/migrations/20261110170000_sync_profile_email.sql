-- Troca de e-mail confirmada no Supabase Auth → atualiza o e-mail do perfil,
-- que aparece na lista do time, nos convites e como contato nas propostas.
-- (O app não pode gravar profiles.email: a coluna fica fora dos grants de update.)
create or replace function private.handle_user_email_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles set email = new.email where id = new.id;
  return new;
end;
$$;

create trigger on_auth_user_email_changed
  after update of email on auth.users
  for each row
  when (old.email is distinct from new.email)
  execute function private.handle_user_email_change();
