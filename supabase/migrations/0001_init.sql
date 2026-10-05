-- calculete: schema inicial
-- Ejecuta este script en el SQL Editor de tu proyecto Supabase (o con `supabase db push`).

create extension if not exists pgcrypto;

-- Entradas de ingresos/gastos por usuario ------------------------------------
create table if not exists public.entries (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  kind        text not null check (kind in ('income', 'expense')),
  concept     text not null default '' check (char_length(concept) <= 120),
  amount      numeric(14, 2) not null default 0 check (amount >= 0 and amount <= 1000000000),
  periodicity text not null default 'mensual'
              check (periodicity in ('mensual', 'bimensual', 'trimestral', 'semestral', 'anual', 'puntual')),
  -- Meses activos como índices 0 (ENE) .. 11 (DIC)
  months      smallint[] not null default '{}'
              check (months <@ array[0,1,2,3,4,5,6,7,8,9,10,11]::smallint[]),
  position    integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists entries_user_id_idx on public.entries (user_id, kind, position);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists entries_set_updated_at on public.entries;
create trigger entries_set_updated_at
  before update on public.entries
  for each row execute function public.set_updated_at();

alter table public.entries enable row level security;

drop policy if exists "entries_select_own" on public.entries;
create policy "entries_select_own" on public.entries
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "entries_insert_own" on public.entries;
create policy "entries_insert_own" on public.entries
  for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "entries_update_own" on public.entries;
create policy "entries_update_own" on public.entries
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "entries_delete_own" on public.entries;
create policy "entries_delete_own" on public.entries
  for delete to authenticated using ((select auth.uid()) = user_id);

-- Administradores -------------------------------------------------------------
-- Sin políticas: solo accesible con la service role key (server-side).
create table if not exists public.admins (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admins enable row level security;

-- Para dar permisos de admin a un usuario (tras su primer login):
-- insert into public.admins (user_id)
--   select id from auth.users where email = 'tu-email@example.com';
