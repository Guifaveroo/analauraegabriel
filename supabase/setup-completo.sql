-- SETUP COMPLETO: cole tudo no SQL Editor do Supabase e clique em Run (uma vez só).

-- ===== supabase/migrations/0001_schema.sql =====
-- =====================================================================
-- Site de casamento — schema principal
-- Execute no SQL Editor do Supabase na ordem dos arquivos (0001, 0002…).
-- =====================================================================

create schema if not exists extensions;
create extension if not exists unaccent with schema extensions;

-- ---------------------------------------------------------------------
-- Tipos
-- ---------------------------------------------------------------------
do $$ begin
  create type public.gift_order_status as enum ('PENDING', 'PAID', 'CANCELLED');
  create type public.gift_mode as enum ('single', 'limited', 'unlimited');
  create type public.guest_group_type as enum ('family', 'category');
  create type public.message_status as enum ('pending', 'approved', 'rejected');
  create type public.rsvp_mode as enum ('open', 'closed');
  create type public.pix_key_type as enum ('cpf', 'cnpj', 'email', 'phone', 'random');
exception when duplicate_object then null; end $$;

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- ---------------------------------------------------------------------
-- Administradores (noivos)
-- ---------------------------------------------------------------------
create table if not exists public.admin_users (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  email      text not null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Fotografias (biblioteca de imagens — arquivos no Supabase Storage)
-- ---------------------------------------------------------------------
create table if not exists public.photos (
  id           uuid primary key default gen_random_uuid(),
  storage_path text not null unique,          -- versão grande (webp)
  thumb_path   text not null,                 -- miniatura (webp)
  width        int  not null check (width > 0),
  height       int  not null check (height > 0),
  caption      text not null default '' check (char_length(caption) <= 300),
  album        text not null default 'library'
               check (album in ('library', 'cover', 'gallery', 'story', 'godparents', 'dresscode', 'gifts')),
  position     int  not null default 0,
  is_featured  boolean not null default false,
  created_at   timestamptz not null default now()
);
create index if not exists photos_album_position_idx on public.photos (album, position);

-- ---------------------------------------------------------------------
-- Tema visual (cores e tipografia). Tokens publicados + rascunho.
-- ---------------------------------------------------------------------
create table if not exists public.wedding_themes (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  base_preset  text not null default 'classic',
  tokens       jsonb not null,
  draft_tokens jsonb,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
drop trigger if exists wedding_themes_touch on public.wedding_themes;
create trigger wedding_themes_touch before update on public.wedding_themes
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------
-- Configurações gerais (linha única)
-- ---------------------------------------------------------------------
create table if not exists public.wedding_settings (
  id                       int primary key default 1 check (id = 1),
  partner1_name            text not null default 'Ana',
  partner2_name            text not null default 'Laura',
  wedding_at               timestamptz not null default (now() + interval '180 days'),
  timezone                 text not null default 'America/Sao_Paulo',

  ceremony_name            text not null default '',
  ceremony_address         text not null default '',
  ceremony_time            text not null default '',
  ceremony_lat             double precision,
  ceremony_lng             double precision,
  reception_name           text not null default '',
  reception_address        text not null default '',
  reception_time           text not null default '',
  reception_lat            double precision,
  reception_lng            double precision,

  pix_key_type             public.pix_key_type,
  pix_key                  text not null default '',
  pix_beneficiary          text not null default '',
  pix_city                 text not null default '',

  rsvp_mode                public.rsvp_mode not null default 'closed',
  rsvp_allow_edit          boolean not null default true,
  rsvp_deadline            timestamptz,
  open_rsvp_max_companions int not null default 2 check (open_rsvp_max_companions between 0 and 20),

  site_title               text not null default '',
  site_description         text not null default '',
  og_photo_id              uuid references public.photos (id) on delete set null,
  allow_indexing           boolean not null default false,

  active_theme_id          uuid references public.wedding_themes (id) on delete set null,
  updated_at               timestamptz not null default now()
);
drop trigger if exists wedding_settings_touch on public.wedding_settings;
create trigger wedding_settings_touch before update on public.wedding_settings
  for each row execute function public.touch_updated_at();

-- Dados sensíveis das configurações ficam numa tabela só do admin.
create table if not exists public.wedding_private (
  id                       int primary key default 1 check (id = 1),
  godparents_password_hash text,
  updated_at               timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Seções do site (conteúdo publicado + rascunho)
-- ---------------------------------------------------------------------
create table if not exists public.wedding_sections (
  key          text primary key
               check (key in ('hero', 'story', 'countdown', 'details', 'location', 'gallery',
                              'godparents', 'dresscode', 'gifts', 'rsvp', 'messages', 'faq')),
  position     int not null default 0,
  enabled      boolean not null default true,
  show_in_nav  boolean not null default true,
  nav_label    text not null default '' check (char_length(nav_label) <= 40),
  is_protected boolean not null default false,
  content      jsonb not null default '{}'::jsonb,
  draft        jsonb,                              -- snapshot pendente de publicação
  updated_at   timestamptz not null default now()
);
drop trigger if exists wedding_sections_touch on public.wedding_sections;
create trigger wedding_sections_touch before update on public.wedding_sections
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------
-- Convidados
-- ---------------------------------------------------------------------
create table if not exists public.guest_groups (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(name) between 1 and 120),
  type        public.guest_group_type not null,
  invite_code text unique,                      -- só para famílias
  created_at  timestamptz not null default now(),
  constraint invite_code_only_family check (type = 'family' or invite_code is null)
);

create table if not exists public.guests (
  id             uuid primary key default gen_random_uuid(),
  name           text not null check (char_length(name) between 1 and 120),
  phone          text not null default '',
  email          text not null default '',
  family_id      uuid references public.guest_groups (id) on delete set null,
  category_id    uuid references public.guest_groups (id) on delete set null,
  max_companions int not null default 0 check (max_companions between 0 and 20),
  notes          text not null default '',
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index if not exists guests_family_idx on public.guests (family_id);
create index if not exists guests_category_idx on public.guests (category_id);
drop trigger if exists guests_touch on public.guests;
create trigger guests_touch before update on public.guests
  for each row execute function public.touch_updated_at();

create table if not exists public.rsvp_responses (
  id           uuid primary key default gen_random_uuid(),
  guest_id     uuid unique references public.guests (id) on delete cascade, -- nulo no modo aberto
  name         text not null check (char_length(name) between 1 and 120),
  attending    boolean not null,
  companions   jsonb not null default '[]'::jsonb check (jsonb_typeof(companions) = 'array'),
  dietary      text not null default '' check (char_length(dietary) <= 500),
  notes        text not null default '' check (char_length(notes) <= 1000),
  responded_at timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
drop trigger if exists rsvp_touch on public.rsvp_responses;
create trigger rsvp_touch before update on public.rsvp_responses
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------
-- Presentes e solicitações
-- ---------------------------------------------------------------------
create table if not exists public.gifts (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(name) between 1 and 120),
  description text not null default '' check (char_length(description) <= 1000),
  category    text not null default '' check (char_length(category) <= 60),
  price       numeric(10, 2) not null check (price > 0 and price <= 100000),
  mode        public.gift_mode not null default 'single',
  quantity    int check (quantity is null or quantity >= 1),
  photo_id    uuid references public.photos (id) on delete set null,
  active      boolean not null default true,
  position    int not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint gift_quantity_matches_mode check (
    (mode = 'single' and quantity = 1) or
    (mode = 'limited' and quantity >= 1) or
    (mode = 'unlimited' and quantity is null)
  )
);
drop trigger if exists gifts_touch on public.gifts;
create trigger gifts_touch before update on public.gifts
  for each row execute function public.touch_updated_at();

create table if not exists public.gift_orders (
  id           uuid primary key default gen_random_uuid(),
  gift_id      uuid not null references public.gifts (id) on delete restrict,
  guest_name   text not null check (char_length(guest_name) between 1 and 120),
  guest_email  text check (guest_email is null or char_length(guest_email) <= 200),
  amount       numeric(10, 2) not null check (amount > 0),
  status       public.gift_order_status not null default 'PENDING',
  txid         text not null unique check (txid ~ '^[A-Za-z0-9]{1,25}$'),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  paid_at      timestamptz,
  cancelled_at timestamptz
);
create index if not exists gift_orders_gift_status_idx on public.gift_orders (gift_id, status);
create index if not exists gift_orders_status_created_idx on public.gift_orders (status, created_at desc);
drop trigger if exists gift_orders_touch on public.gift_orders;
create trigger gift_orders_touch before update on public.gift_orders
  for each row execute function public.touch_updated_at();

create table if not exists public.gift_order_events (
  id          bigint generated always as identity primary key,
  order_id    uuid not null references public.gift_orders (id) on delete cascade,
  from_status public.gift_order_status,
  to_status   public.gift_order_status not null,
  note        text not null default '',
  actor_id    uuid references auth.users (id) on delete set null,
  created_at  timestamptz not null default now()
);
create index if not exists gift_order_events_order_idx on public.gift_order_events (order_id, created_at);

-- ---------------------------------------------------------------------
-- Mural de mensagens
-- ---------------------------------------------------------------------
create table if not exists public.messages (
  id         uuid primary key default gen_random_uuid(),
  name       text not null check (char_length(name) between 1 and 80),
  message    text not null check (char_length(message) between 1 and 1000),
  status     public.message_status not null default 'pending',
  created_at timestamptz not null default now()
);
create index if not exists messages_status_created_idx on public.messages (status, created_at desc);

-- ---------------------------------------------------------------------
-- Antispam: limite de envios por IP (hash) e ação
-- ---------------------------------------------------------------------
create table if not exists public.rate_limits (
  id         bigint generated always as identity primary key,
  key_hash   text not null,
  action     text not null,
  created_at timestamptz not null default now()
);
create index if not exists rate_limits_lookup_idx on public.rate_limits (key_hash, action, created_at);

-- ===== supabase/migrations/0002_security_functions.sql =====
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

-- ===== supabase/migrations/0003_storage.sql =====
-- =====================================================================
-- Supabase Storage: bucket público (somente leitura) para as fotografias.
-- Limite de 5 MB e apenas WebP/JPEG/PNG. Upload/exclusão só para admin.
-- =====================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('photos', 'photos', true, 5242880, array['image/webp', 'image/jpeg', 'image/png'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists photos_admin_insert on storage.objects;
create policy photos_admin_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'photos' and public.is_admin());

drop policy if exists photos_admin_update on storage.objects;
create policy photos_admin_update on storage.objects
  for update to authenticated
  using (bucket_id = 'photos' and public.is_admin())
  with check (bucket_id = 'photos' and public.is_admin());

drop policy if exists photos_admin_delete on storage.objects;
create policy photos_admin_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'photos' and public.is_admin());

-- ===== supabase/migrations/0004_seed.sql =====
-- =====================================================================
-- Dados iniciais (gerado por scripts/generate-seed.mts — não editar à mão).
-- Pode ser executado mais de uma vez: só insere o que ainda não existe.
-- =====================================================================

insert into public.wedding_settings (id, wedding_at, ceremony_name, ceremony_address, ceremony_time,
  reception_name, reception_address, reception_time)
values (1, '2027-05-15 16:00:00-03', 'Igreja Nossa Senhora do Carmo', 'Rua Exemplo, 100 - Centro, São Paulo - SP', '16h00',
  'Espaço Jardim das Flores', 'Avenida Exemplo, 2000 - Jardins, São Paulo - SP', '18h00')
on conflict (id) do nothing;

insert into public.wedding_private (id) values (1) on conflict (id) do nothing;

do $$
declare v_theme uuid;
begin
  if (select active_theme_id from public.wedding_settings where id = 1) is null then
    insert into public.wedding_themes (name, base_preset, tokens) values ('Tema do site', 'classic', '{"primary":"#8a6d3b","secondary":"#c9b48a","background":"#fbf8f2","surface":"#ffffff","text":"#2f2a24","button":"#8a6d3b","buttonText":"#ffffff","headingFont":"cormorant","bodyFont":"montserrat","buttonStyle":"square","decoration":"minimal"}'::jsonb)
    returning id into v_theme;
    update public.wedding_settings set active_theme_id = v_theme where id = 1;
  end if;
end $$;

insert into public.wedding_sections (key, position, nav_label, show_in_nav, content) values ('hero', 0, 'Início', true, '{"tagline":"Com a bênção de Deus e de nossas famílias, convidamos você para celebrar o nosso amor.","photoId":null,"focalX":50,"focalY":40,"overlay":35,"ctaLabel":"Conheça nossa história","showCountdown":true}'::jsonb) on conflict (key) do nothing;
insert into public.wedding_sections (key, position, nav_label, show_in_nav, content) values ('story', 1, 'Nossa história', true, '{"title":"Nossa história","subtitle":"Cada capítulo nos trouxe até aqui","intro":"Entre encontros inesperados, conversas que atravessaram madrugadas e muitos planos em comum, descobrimos que queríamos dividir a vida inteira. Aqui estão alguns dos momentos que marcaram o nosso caminho.","events":[{"id":"ev1","date":"2018","title":"Como nos conhecemos","text":"Um encontro despretensioso que mudou tudo.","photoId":null},{"id":"ev2","date":"2018","title":"Primeiro encontro","text":"Um café que durou a tarde inteira.","photoId":null},{"id":"ev3","date":"2019","title":"Pedido de namoro","text":"O sim mais fácil das nossas vidas.","photoId":null},{"id":"ev4","date":"2024","title":"Noivado","text":"Um pedido emocionante, cercado de quem amamos.","photoId":null},{"id":"ev5","date":"2026","title":"Preparativos","text":"Agora contamos os dias para celebrar com você.","photoId":null}]}'::jsonb) on conflict (key) do nothing;
insert into public.wedding_sections (key, position, nav_label, show_in_nav, content) values ('countdown', 2, 'Contagem', false, '{"title":"Falta pouco para o grande dia","afterMessage":"Obrigado por fazer parte do dia mais feliz das nossas vidas!"}'::jsonb) on conflict (key) do nothing;
insert into public.wedding_sections (key, position, nav_label, show_in_nav, content) values ('details', 3, 'O casamento', true, '{"title":"O casamento","subtitle":"Esperamos por você","extraInfo":"Pedimos a gentileza de chegar com 30 minutos de antecedência."}'::jsonb) on conflict (key) do nothing;
insert into public.wedding_sections (key, position, nav_label, show_in_nav, content) values ('location', 4, 'Localização', false, '{"title":"Como chegar","subtitle":"Toque no botão para abrir o trajeto no seu aplicativo favorito","parking":"O local conta com estacionamento gratuito com manobrista.","access":"Acesso pela entrada principal. Local com acessibilidade.","showReceptionMap":true}'::jsonb) on conflict (key) do nothing;
insert into public.wedding_sections (key, position, nav_label, show_in_nav, content) values ('godparents', 5, 'Padrinhos', true, '{"title":"Manual dos padrinhos","welcome":"Queridos padrinhos e madrinhas, vocês foram escolhidos por fazerem parte da nossa história. Preparamos este manual com todo carinho para que vocês aproveitem cada momento.","ceremony":"A entrada será feita em pares, ao som da música escolhida. Ensaiaremos tudo juntos na véspera.","schedule":[{"id":"s1","time":"15:00","label":"Chegada dos padrinhos para fotos"},{"id":"s2","time":"16:00","label":"Início da cerimônia"},{"id":"s3","time":"18:00","label":"Recepção"}],"dressCode":"Traje passeio completo.","palette":["#9bab8f","#c9b48a","#b56576"],"groomsmen":"Terno em tons escuros, gravata na cor indicada pela paleta.","bridesmaids":"Vestido longo em uma das cores da paleta. Evitar branco, off-white e estampas.","beauty":"Indicamos profissionais parceiros para cabelo e maquiagem. Fale conosco para agendar.","photoIds":[]}'::jsonb) on conflict (key) do nothing;
insert into public.wedding_sections (key, position, nav_label, show_in_nav, content) values ('dresscode', 6, 'Dress code', false, '{"title":"Dress code","formality":"Traje passeio completo","guidelines":"Sugerimos tecidos leves e calçados confortáveis — parte da festa será ao ar livre.","suggestedColors":["#9bab8f","#c9b48a","#7d8fa6"],"avoidColors":["#ffffff","#f5f0e6"],"photoIds":[]}'::jsonb) on conflict (key) do nothing;
insert into public.wedding_sections (key, position, nav_label, show_in_nav, content) values ('gallery', 7, 'Galeria', true, '{"title":"Galeria","subtitle":"Momentos que guardamos no coração","layout":"grid"}'::jsonb) on conflict (key) do nothing;
insert into public.wedding_sections (key, position, nav_label, show_in_nav, content) values ('gifts', 8, 'Presentes', true, '{"title":"Lista de presentes","subtitle":"Sua presença é o nosso maior presente","intro":"Se desejar nos presentear, escolha uma das experiências abaixo. O valor é enviado diretamente para nós via PIX.","thankYou":"Muito obrigado pelo carinho! Assim que recebermos o PIX, confirmaremos o seu presente."}'::jsonb) on conflict (key) do nothing;
insert into public.wedding_sections (key, position, nav_label, show_in_nav, content) values ('rsvp', 9, 'RSVP', true, '{"title":"Confirme sua presença","subtitle":"Sua resposta nos ajuda a preparar tudo com carinho","thankYou":"Resposta registrada! Obrigado por nos avisar."}'::jsonb) on conflict (key) do nothing;
insert into public.wedding_sections (key, position, nav_label, show_in_nav, content) values ('messages', 10, 'Recados', false, '{"title":"Mural de recados","subtitle":"Deixe uma mensagem para os noivos"}'::jsonb) on conflict (key) do nothing;
insert into public.wedding_sections (key, position, nav_label, show_in_nav, content) values ('faq', 11, 'Informações', true, '{"title":"Perguntas frequentes","items":[{"id":"f1","question":"Crianças podem participar?","answer":"Sim! As crianças são muito bem-vindas."},{"id":"f2","question":"Existe estacionamento?","answer":"Sim, o local possui estacionamento gratuito."},{"id":"f3","question":"Qual o horário de chegada?","answer":"Recomendamos chegar 30 minutos antes da cerimônia."},{"id":"f4","question":"Posso levar acompanhante?","answer":"O número de acompanhantes está indicado no seu convite."},{"id":"f5","question":"Como chegar?","answer":"Veja a seção Localização com os links para Google Maps e Waze."},{"id":"f6","question":"Existe lista de presentes?","answer":"Sim, preparamos uma lista simbólica com pagamento via PIX."}]}'::jsonb) on conflict (key) do nothing;

insert into public.gifts (name, category, price, mode, quantity, description, position)
select * from (values
  ('Jantar romântico', 'Experiências', 250::numeric, 'unlimited'::public.gift_mode, null::int, 'Um jantar especial a dois durante a lua de mel.', 0),
  ('Cota da lua de mel', 'Lua de mel', 150::numeric, 'unlimited'::public.gift_mode, null::int, 'Ajude a tornar nossa viagem inesquecível.', 1),
  ('Café da manhã especial', 'Experiências', 120::numeric, 'limited'::public.gift_mode, 3::int, 'Um café da manhã caprichado no hotel.', 2),
  ('Passeio a dois', 'Experiências', 300::numeric, 'limited'::public.gift_mode, 2::int, 'Um passeio de barco ao pôr do sol.', 3),
  ('Noite em hotel', 'Lua de mel', 600::numeric, 'single'::public.gift_mode, 1::int, 'Uma noite especial em um hotel charmoso.', 4),
  ('Decoração da casa', 'Casa nova', 200::numeric, 'unlimited'::public.gift_mode, null::int, 'Para deixar nosso lar com a nossa cara.', 5),
  ('Cafeteira', 'Casa nova', 450::numeric, 'single'::public.gift_mode, 1::int, 'Para cafés fresquinhos todas as manhãs.', 6),
  ('Aula de culinária', 'Experiências', 350::numeric, 'single'::public.gift_mode, 1::int, 'Uma aula para aprendermos receitas novas juntos.', 7)
) as v where not exists (select 1 from public.gifts);
