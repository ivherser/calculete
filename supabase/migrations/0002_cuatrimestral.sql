-- calculete: añade la periodicidad «cuatrimestral» (cada 4 meses).
-- Ejecutar en el SQL Editor de Supabase si ya habías ejecutado 0001_init.sql.
alter table public.entries drop constraint if exists entries_periodicity_check;
alter table public.entries add constraint entries_periodicity_check
  check (periodicity in ('mensual', 'bimensual', 'trimestral', 'cuatrimestral', 'semestral', 'anual', 'puntual'));
