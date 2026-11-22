-- =====================================================================
-- Funções, regras de negócio e políticas RLS
-- =====================================================================

-- ---------------------------------------------------------------------
-- Autorização
-- ---------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (select 1 from public.admin_users where user_id = auth.uid());
$$;

-- ---------------------------------------------------------------------
-- Antispam: retorna true se a ação é permitida e registra a tentativa
-- ---------------------------------------------------------------------
create or replace function public.hit_rate_limit(p_key text, p_action text, p_max int, p_window interval)
returns boolean
language plpgsql security definer
set search_path = public
as $$
declare
  v_count int;
begin
  delete from public.rate_limits where created_at < now() - interval '1 day';
  select count(*) into v_count
    from public.rate_limits
   where key_hash = p_key and action = p_action and created_at > now() - p_window;
  if v_count >= p_max then
    return false;
  end if;
  insert into public.rate_limits (key_hash, action) values (p_key, p_action);
  return true;
end $$;

-- ---------------------------------------------------------------------
-- Leitura pública de seções (sem rascunho; conteúdo protegido omitido)
-- ---------------------------------------------------------------------
create or replace function public.public_site_sections()
returns table (key text, "position" int, enabled boolean, show_in_nav boolean,
               nav_label text, is_protected boolean, content jsonb)
language sql stable security definer
set search_path = public
as $$
  select s.key, s.position, s.enabled, s.show_in_nav, s.nav_label, s.is_protected,
         case when s.is_protected then '{}'::jsonb else s.content end
    from public.wedding_sections s
   where s.enabled
   order by s.position;
$$;

create or replace function public.public_theme()
returns jsonb
language sql stable security definer
set search_path = public
as $$
  select t.tokens
    from public.wedding_settings ws
    join public.wedding_themes t on t.id = ws.active_theme_id
   where ws.id = 1;
$$;

-- ---------------------------------------------------------------------
-- Estoque dos presentes (sem expor dados dos convidados)
-- status: AVAILABLE | PENDING | PAID
-- ---------------------------------------------------------------------
create or replace function public.public_gift_stock()
returns table (gift_id uuid, pending int, paid int, remaining int, status text)
language sql stable security definer
set search_path = public
as $$
  with c as (
    select g.id, g.mode, g.quantity,
           count(o.id) filter (where o.status = 'PENDING')::int as pending,
           count(o.id) filter (where o.status = 'PAID')::int    as paid
      from public.gifts g
      left join public.gift_orders o on o.gift_id = g.id
     where g.active
     group by g.id
  )
  select c.id, c.pending, c.paid,
         case when c.mode = 'unlimited' then null
              else greatest(c.quantity - c.pending - c.paid, 0) end,
         case when c.mode = 'unlimited' or c.quantity - c.pending - c.paid > 0 then 'AVAILABLE'
              when c.pending > 0 then 'PENDING'
              else 'PAID' end
    from c;
$$;

-- ---------------------------------------------------------------------
-- Criação de solicitação de presente (chamada somente pelo servidor).
-- Trava a linha do presente para impedir reservas simultâneas da última
-- unidade. O valor é sempre o cadastrado — nunca o enviado pelo navegador.
-- ---------------------------------------------------------------------
create or replace function public.create_gift_order(p_gift_id uuid, p_guest_name text, p_guest_email text)
returns table (order_id uuid, txid text, amount numeric, gift_name text)
language plpgsql security definer
set search_path = public
as $$
declare
  v_gift  public.gifts%rowtype;
  v_taken int;
  v_txid  text;
  v_id    uuid;
begin
  select * into v_gift from public.gifts where id = p_gift_id for update;
  if not found or not v_gift.active then
    raise exception 'GIFT_NOT_FOUND' using errcode = 'P0001';
  end if;

  if v_gift.mode <> 'unlimited' then
    select count(*) into v_taken
      from public.gift_orders o
     where o.gift_id = p_gift_id and o.status in ('PENDING', 'PAID');
    if v_taken >= v_gift.quantity then
      raise exception 'GIFT_UNAVAILABLE' using errcode = 'P0001';
    end if;
  end if;

  v_txid := 'PRES' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 16));

  insert into public.gift_orders (gift_id, guest_name, guest_email, amount, txid)
  values (p_gift_id, btrim(p_guest_name), nullif(btrim(coalesce(p_guest_email, '')), ''), v_gift.price, v_txid)
  returning id into v_id;

  insert into public.gift_order_events (order_id, from_status, to_status, note)
  values (v_id, null, 'PENDING', 'Solicitação criada pelo convidado');

  return query select v_id, v_txid, v_gift.price, v_gift.name;
end $$;

-- ---------------------------------------------------------------------
-- Alteração manual de status pelos noivos (com histórico)
--   PENDING   -> PAID       confirmar pagamento
--   PENDING   -> CANCELLED  cancelar solicitação
--   PAID      -> PENDING    desfazer confirmação
--   PAID      -> CANCELLED  liberar presente novamente
--   CANCELLED -> PENDING    reativar (se houver disponibilidade)
-- ---------------------------------------------------------------------
create or replace function public.admin_set_order_status(p_order_id uuid, p_status public.gift_order_status, p_note text default '')
returns void
language plpgsql security definer
set search_path = public
as $$
declare
  v_order public.gift_orders%rowtype;
  v_gift  public.gifts%rowtype;
  v_taken int;
begin
  if not public.is_admin() then
    raise exception 'NOT_ALLOWED' using errcode = '42501';
  end if;

  select * into v_order from public.gift_orders where id = p_order_id for update;
  if not found then
    raise exception 'ORDER_NOT_FOUND' using errcode = 'P0001';
  end if;

  if not (
    (v_order.status = 'PENDING'   and p_status in ('PAID', 'CANCELLED')) or
    (v_order.status = 'PAID'      and p_status in ('PENDING', 'CANCELLED')) or
    (v_order.status = 'CANCELLED' and p_status = 'PENDING')
  ) then
    raise exception 'INVALID_TRANSITION' using errcode = 'P0001';
  end if;

  if v_order.status = 'CANCELLED' then
    select * into v_gift from public.gifts where id = v_order.gift_id for update;
    if v_gift.mode <> 'unlimited' then
      select count(*) into v_taken from public.gift_orders o
       where o.gift_id = v_gift.id and o.status in ('PENDING', 'PAID');
      if v_taken >= v_gift.quantity then
        raise exception 'GIFT_UNAVAILABLE' using errcode = 'P0001';
      end if;
    end if;
  end if;

  update public.gift_orders
     set status       = p_status,
         paid_at      = case when p_status = 'PAID' then now() else null end,
         cancelled_at = case when p_status = 'CANCELLED' then now() else null end
   where id = p_order_id;

  insert into public.gift_order_events (order_id, from_status, to_status, note, actor_id)
  values (p_order_id, v_order.status, p_status, left(coalesce(p_note, ''), 500), auth.uid());
end $$;

-- ---------------------------------------------------------------------
-- RSVP — busca do convite (modo fechado). Chamada somente pelo servidor.
-- Por código da família ou nome completo exato (sem acentos/maiúsculas).
-- ---------------------------------------------------------------------
create or replace function public.rsvp_lookup(p_code text, p_name text)
returns jsonb
language plpgsql stable security definer
set search_path = public, extensions
as $$
declare
  v_family uuid;
  v_guest  uuid;
begin
  if coalesce(btrim(p_code), '') <> '' then
    select id into v_family from public.guest_groups
     where type = 'family' and invite_code = upper(btrim(p_code));
    if v_family is null then
      return null;
    end if;
  elsif coalesce(btrim(p_name), '') <> '' then
    select g.id, g.family_id into v_guest, v_family
      from public.guests g
     where lower(extensions.unaccent(regexp_replace(btrim(g.name), '\s+', ' ', 'g')))
         = lower(extensions.unaccent(regexp_replace(btrim(p_name), '\s+', ' ', 'g')))
     limit 1;
    if v_guest is null then
      return null;
    end if;
  else
    return null;
  end if;

  return (
    select jsonb_build_object(
      'family', (select name from public.guest_groups where id = v_family),
      'guests', coalesce(jsonb_agg(jsonb_build_object(
          'id', g.id,
          'name', g.name,
          'max_companions', g.max_companions,
          'response', case when r.id is null then null else jsonb_build_object(
              'attending', r.attending, 'companions', r.companions,
              'dietary', r.dietary, 'notes', r.notes, 'responded_at', r.responded_at) end
        ) order by g.name), '[]'::jsonb)
    )
    from public.guests g
    left join public.rsvp_responses r on r.guest_id = g.id
    where (v_family is not null and g.family_id = v_family)
       or (v_family is null and g.id = v_guest)
  );
end $$;

-- ---------------------------------------------------------------------
-- RSVP — gravação da resposta com validação das regras dos noivos.
-- ---------------------------------------------------------------------
create or replace function public.submit_rsvp(
  p_guest_id uuid, p_name text, p_attending boolean,
  p_companions jsonb, p_dietary text, p_notes text)
returns uuid
language plpgsql security definer
set search_path = public
as $$
declare
  v_settings public.wedding_settings%rowtype;
  v_guest    public.guests%rowtype;
  v_existing public.rsvp_responses%rowtype;
  v_max      int;
  v_count    int;
  v_id       uuid;
begin
  select * into v_settings from public.wedding_settings where id = 1;

  if v_settings.rsvp_deadline is not null and now() > v_settings.rsvp_deadline then
    raise exception 'RSVP_CLOSED' using errcode = 'P0001';
  end if;

  if jsonb_typeof(coalesce(p_companions, '[]'::jsonb)) <> 'array' then
    raise exception 'INVALID_COMPANIONS' using errcode = 'P0001';
  end if;
  v_count := case when p_attending then jsonb_array_length(coalesce(p_companions, '[]'::jsonb)) else 0 end;

  if p_guest_id is null then
    if v_settings.rsvp_mode = 'closed' then
      raise exception 'GUEST_REQUIRED' using errcode = 'P0001';
    end if;
    v_max := v_settings.open_rsvp_max_companions;
  else
    select * into v_guest from public.guests where id = p_guest_id;
    if not found then
      raise exception 'GUEST_NOT_FOUND' using errcode = 'P0001';
    end if;
    v_max := v_guest.max_companions;
  end if;

  if v_count > v_max then
    raise exception 'TOO_MANY_COMPANIONS' using errcode = 'P0001';
  end if;

  if p_guest_id is not null then
    select * into v_existing from public.rsvp_responses where guest_id = p_guest_id for update;
    if found then
      if not v_settings.rsvp_allow_edit then
        raise exception 'RSVP_LOCKED' using errcode = 'P0001';
      end if;
      update public.rsvp_responses
         set attending = p_attending,
             companions = case when p_attending then coalesce(p_companions, '[]'::jsonb) else '[]'::jsonb end,
             dietary = coalesce(p_dietary, ''), notes = coalesce(p_notes, ''),
             responded_at = now()
       where id = v_existing.id;
      return v_existing.id;
    end if;
  end if;

  insert into public.rsvp_responses (guest_id, name, attending, companions, dietary, notes)
  values (p_guest_id, coalesce(v_guest.name, btrim(p_name)), p_attending,
          case when p_attending then coalesce(p_companions, '[]'::jsonb) else '[]'::jsonb end,
          coalesce(p_dietary, ''), coalesce(p_notes, ''))
  returning id into v_id;
  return v_id;
end $$;

-- ---------------------------------------------------------------------
-- Publicação: aplica rascunhos de seções e tema numa única transação.
-- ---------------------------------------------------------------------
create or replace function public.admin_publish_site()
returns void
language plpgsql security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'NOT_ALLOWED' using errcode = '42501';
  end if;

  update public.wedding_sections s
     set position     = coalesce((s.draft ->> 'position')::int, s.position),
         enabled      = coalesce((s.draft ->> 'enabled')::boolean, s.enabled),
         show_in_nav  = coalesce((s.draft ->> 'show_in_nav')::boolean, s.show_in_nav),
         nav_label    = coalesce(s.draft ->> 'nav_label', s.nav_label),
         is_protected = coalesce((s.draft ->> 'is_protected')::boolean, s.is_protected),
         content      = coalesce(s.draft -> 'content', s.content),
         draft        = null
   where s.draft is not null;

  update public.wedding_themes t
     set tokens = t.draft_tokens, draft_tokens = null
   where t.draft_tokens is not null;
end $$;

-- ---------------------------------------------------------------------
-- Permissões de execução
-- ---------------------------------------------------------------------
revoke execute on all functions in schema public from public, anon, authenticated;

grant execute on function public.is_admin()               to anon, authenticated;
grant execute on function public.public_site_sections()   to anon, authenticated;
grant execute on function public.public_theme()           to anon, authenticated;
grant execute on function public.public_gift_stock()      to anon, authenticated;
grant execute on function public.admin_set_order_status(uuid, public.gift_order_status, text) to authenticated;
grant execute on function public.admin_publish_site()     to authenticated;
-- somente o servidor (service_role) cria pedidos, RSVPs e controla o antispam
grant execute on function public.create_gift_order(uuid, text, text)                     to service_role;
grant execute on function public.rsvp_lookup(text, text)                                 to service_role;
grant execute on function public.submit_rsvp(uuid, text, boolean, jsonb, text, text)     to service_role;
grant execute on function public.hit_rate_limit(text, text, int, interval)               to service_role;
grant execute on function public.touch_updated_at()                                      to anon, authenticated, service_role;

-- ---------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------
alter table public.admin_users        enable row level security;
alter table public.photos             enable row level security;
alter table public.wedding_themes     enable row level security;
alter table public.wedding_settings   enable row level security;
alter table public.wedding_private    enable row level security;
alter table public.wedding_sections   enable row level security;
alter table public.guest_groups       enable row level security;
alter table public.guests             enable row level security;
alter table public.rsvp_responses     enable row level security;
alter table public.gifts              enable row level security;
alter table public.gift_orders        enable row level security;
alter table public.gift_order_events  enable row level security;
alter table public.messages           enable row level security;
alter table public.rate_limits        enable row level security;

-- leitura própria do registro de admin
drop policy if exists admin_users_self on public.admin_users;
create policy admin_users_self on public.admin_users
  for select to authenticated using (user_id = auth.uid());

-- conteúdo público (somente leitura)
drop policy if exists photos_public_read on public.photos;
create policy photos_public_read on public.photos for select to anon, authenticated using (true);

drop policy if exists settings_public_read on public.wedding_settings;
create policy settings_public_read on public.wedding_settings for select to anon, authenticated using (true);

drop policy if exists gifts_public_read on public.gifts;
create policy gifts_public_read on public.gifts for select to anon, authenticated using (active or public.is_admin());

drop policy if exists messages_public_read on public.messages;
create policy messages_public_read on public.messages for select to anon, authenticated
  using (status = 'approved' or public.is_admin());

-- administração completa para os noivos
do $$
declare t text;
begin
  foreach t in array array['photos', 'wedding_themes', 'wedding_settings', 'wedding_private',
                           'wedding_sections', 'guest_groups', 'guests', 'rsvp_responses',
                           'gifts', 'messages']
  loop
    execute format('drop policy if exists %I on public.%I', t || '_admin_all', t);
    execute format('create policy %I on public.%I for all to authenticated using (public.is_admin()) with check (public.is_admin())',
                   t || '_admin_all', t);
  end loop;
end $$;

-- pedidos: status só muda via admin_set_order_status (com histórico)
drop policy if exists gift_orders_admin_read on public.gift_orders;
create policy gift_orders_admin_read on public.gift_orders for select to authenticated using (public.is_admin());
drop policy if exists gift_orders_admin_delete on public.gift_orders;
create policy gift_orders_admin_delete on public.gift_orders for delete to authenticated using (public.is_admin());
drop policy if exists gift_order_events_admin_read on public.gift_order_events;
create policy gift_order_events_admin_read on public.gift_order_events for select to authenticated using (public.is_admin());

-- rate_limits: sem políticas (acesso apenas via service_role)
