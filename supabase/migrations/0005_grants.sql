-- =====================================================================
-- Permissões de tabela para a API do Supabase.
-- Projetos novos do Supabase podem não conceder acesso automático às
-- tabelas criadas por SQL. As políticas RLS continuam valendo: estes
-- GRANTs só permitem que as regras RLS sejam avaliadas.
-- =====================================================================

grant usage on schema public to anon, authenticated, service_role;

-- visitantes: apenas leitura do conteúdo público (filtrado por RLS)
grant select on public.wedding_settings, public.photos, public.gifts, public.messages to anon;

-- usuários logados: acesso controlado por RLS (somente admins passam em is_admin())
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;

-- servidor (service_role): acesso total, usado só pelas ações validadas
grant all on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to service_role;
