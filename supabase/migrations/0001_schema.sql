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
