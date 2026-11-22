-- Testes das regras de negócio no banco. Falha com exceção se algo estiver errado.
\set ON_ERROR_STOP 1
begin;
insert into auth.users (id, email) values ('00000000-0000-0000-0000-00000000000a', 'noivos@example.com');
insert into public.admin_users values ('00000000-0000-0000-0000-00000000000a', 'noivos@example.com');

-- 1. presente único: segunda solicitação deve falhar
do $$
declare g uuid; o record; ok boolean := false;
begin
  select id into g from public.gifts where mode = 'single' order by position limit 1;
  select * into o from public.create_gift_order(g, 'Maria', null);
  assert o.txid ~ '^PRES[A-F0-9]{16}$', 'txid inválido';
  assert o.amount = (select price from public.gifts where id = g), 'valor deve vir do cadastro';
  begin
    perform public.create_gift_order(g, 'João', null);
  exception when others then ok := sqlerrm = 'GIFT_UNAVAILABLE'; end;
  assert ok, 'presente único aceitou duas solicitações';
  assert (select status from public.public_gift_stock() where gift_id = g) = 'PENDING';
end $$;

-- 2. fluxo manual de status e histórico (como admin)
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000a';
do $$
declare o uuid; ok boolean := false;
begin
  select id into o from public.gift_orders limit 1;
  perform public.admin_set_order_status(o, 'PAID', 'conferido no app');
  assert (select status from public.gift_orders where id = o) = 'PAID';
  assert (select paid_at from public.gift_orders where id = o) is not null;
  begin
    perform public.admin_set_order_status(o, 'PAID', '');
  exception when others then ok := sqlerrm = 'INVALID_TRANSITION'; end;
  assert ok, 'transição PAID->PAID deveria falhar';
  perform public.admin_set_order_status(o, 'CANCELLED', 'liberar');
  assert (select count(*) from public.gift_order_events where order_id = o) = 3, 'histórico incompleto';
end $$;
reset role;

-- 3. usuário anônimo não lê dados pessoais nem chama funções do servidor
set local role anon;
set local request.jwt.claim.sub = '';
do $$
declare ok boolean := false;
begin
  assert (select count(*) from public.gift_orders) = 0, 'anon leu pedidos';
  assert (select count(*) from public.guests) = 0, 'anon leu convidados';
  assert (select count(*) from public.messages where status <> 'approved') = 0;
  assert (select count(*) from public.public_site_sections()) > 0;
  begin
    perform public.create_gift_order(gen_random_uuid(), 'x', null);
  exception when insufficient_privilege then ok := true; end;
  assert ok, 'anon conseguiu criar pedido direto';
  ok := false;
  begin
    insert into public.messages (name, message) values ('spam', 'spam');
  exception when insufficient_privilege then ok := true; end;
  assert ok, 'anon conseguiu inserir mensagem direto';
end $$;
reset role;

-- 4. RSVP: limite de acompanhantes, modo fechado e edição
do $$
declare fam uuid; g uuid; ok boolean := false; r jsonb;
begin
  insert into public.guest_groups (name, type, invite_code) values ('Família Silva', 'family', 'SILVA1') returning id into fam;
  insert into public.guests (name, family_id, max_companions) values ('José da Silva', fam, 1) returning id into g;
  insert into public.guests (name, family_id) values ('Ana Silva', fam);
  r := public.rsvp_lookup('silva1', null);
  assert jsonb_array_length(r->'guests') = 2, 'lookup por código falhou';
  r := public.rsvp_lookup(null, '  jose   DA silva ');
  assert jsonb_array_length(r->'guests') = 2, 'lookup por nome falhou';
  assert public.rsvp_lookup(null, 'Desconhecido') is null;
  begin
    perform public.submit_rsvp(g, '', true, '["a","b"]', '', '');
  exception when others then ok := sqlerrm = 'TOO_MANY_COMPANIONS'; end;
  assert ok, 'aceitou acompanhantes acima do limite';
  perform public.submit_rsvp(g, '', true, '["Carla"]', 'vegetariano', '');
  perform public.submit_rsvp(g, '', false, '["Carla"]', '', '');
  assert (select companions from public.rsvp_responses where guest_id = g) = '[]'::jsonb;
  update public.wedding_settings set rsvp_allow_edit = false;
  ok := false;
  begin
    perform public.submit_rsvp(g, '', true, '[]', '', '');
  exception when others then ok := sqlerrm = 'RSVP_LOCKED'; end;
  assert ok, 'permitiu editar com edição desativada';
  ok := false;
  begin
    perform public.submit_rsvp(null, 'Fulano', true, '[]', '', '');
  exception when others then ok := sqlerrm = 'GUEST_REQUIRED'; end;
  assert ok, 'modo fechado aceitou convidado não cadastrado';
end $$;

-- 5. rate limit
do $$
begin
  assert public.hit_rate_limit('ip1', 't', 2, '1 minute');
  assert public.hit_rate_limit('ip1', 't', 2, '1 minute');
  assert not public.hit_rate_limit('ip1', 't', 2, '1 minute'), 'rate limit não bloqueou';
end $$;

-- 6. publicação de rascunho
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000a';
update public.wedding_sections set draft = jsonb_build_object('enabled', false, 'content', '{"title":"Novo"}'::jsonb) where key = 'faq';
select public.admin_publish_site();
do $$ begin
  assert (select not enabled and content->>'title' = 'Novo' and draft is null from public.wedding_sections where key = 'faq'), 'publicação falhou';
end $$;
reset role;

rollback;
\echo 'OK: regras do banco'
