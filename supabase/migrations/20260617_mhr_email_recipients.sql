-- ============================================================================
-- MHR · Destinatarios de correo automático
-- Tabla: public.mhr_email_recipients
-- Crea la lista de correos a los que se envía cada reporte al guardarse.
-- ============================================================================

create table if not exists public.mhr_email_recipients (
    id              uuid primary key default gen_random_uuid(),
    email           text not null,
    nombre          text,
    rol             text,                       -- libre: 'jefe', 'supervisor', 'auditor', etc.
    activo          boolean not null default true,
    notas           text,
    created_at      timestamptz not null default now(),
    created_by      uuid references auth.users(id) on delete set null,
    updated_at      timestamptz not null default now(),
    constraint mhr_email_recipients_email_unique unique (email)
);

create index if not exists idx_mhr_email_recipients_activo
    on public.mhr_email_recipients (activo)
    where activo = true;

-- Trigger para mantener updated_at
create or replace function public.tg_mhr_email_recipients_touch()
returns trigger language plpgsql as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

drop trigger if exists trg_mhr_email_recipients_touch on public.mhr_email_recipients;
create trigger trg_mhr_email_recipients_touch
    before update on public.mhr_email_recipients
    for each row execute function public.tg_mhr_email_recipients_touch();

-- ============================================================================
-- RLS
-- Lectura: todos los usuarios autenticados (para que el front pueda mostrar
--          la lista en el admin).  Escritura: sólo admin / superuser / ingenieria.
-- El rol se obtiene de public.user_roles.role (mismo origen que el resto de la app).
-- ============================================================================
alter table public.mhr_email_recipients enable row level security;

-- Helper: ¿el usuario actual tiene rol administrativo?
create or replace function public.mhr_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
    select exists (
        select 1
        from public.user_roles ur
        where ur.user_id = auth.uid()
          and lower(coalesce(ur.role, '')) in ('admin', 'superuser', 'superadmin', 'ingenieria')
    );
$$;

revoke all on function public.mhr_is_admin() from public;
grant execute on function public.mhr_is_admin() to authenticated;

drop policy if exists "mhr_email_recipients_select_auth" on public.mhr_email_recipients;
create policy "mhr_email_recipients_select_auth"
    on public.mhr_email_recipients for select
    to authenticated
    using (true);

drop policy if exists "mhr_email_recipients_insert_admin" on public.mhr_email_recipients;
create policy "mhr_email_recipients_insert_admin"
    on public.mhr_email_recipients for insert
    to authenticated
    with check (public.mhr_is_admin());

drop policy if exists "mhr_email_recipients_update_admin" on public.mhr_email_recipients;
create policy "mhr_email_recipients_update_admin"
    on public.mhr_email_recipients for update
    to authenticated
    using (public.mhr_is_admin())
    with check (public.mhr_is_admin());

drop policy if exists "mhr_email_recipients_delete_admin" on public.mhr_email_recipients;
create policy "mhr_email_recipients_delete_admin"
    on public.mhr_email_recipients for delete
    to authenticated
    using (public.mhr_is_admin());

-- ============================================================================
-- Bitácora opcional de envíos (útil para auditoría)
-- ============================================================================
create table if not exists public.mhr_email_log (
    id              uuid primary key default gen_random_uuid(),
    report_id       uuid references public.reports(id) on delete cascade,
    folio           text,
    destinatarios   text[] not null,
    asunto          text,
    resend_id       text,
    ok              boolean not null default true,
    error_msg       text,
    sent_at         timestamptz not null default now(),
    sent_by         uuid references auth.users(id) on delete set null
);

create index if not exists idx_mhr_email_log_report_id on public.mhr_email_log (report_id);
create index if not exists idx_mhr_email_log_sent_at   on public.mhr_email_log (sent_at desc);

alter table public.mhr_email_log enable row level security;

drop policy if exists "mhr_email_log_select_auth" on public.mhr_email_log;
create policy "mhr_email_log_select_auth"
    on public.mhr_email_log for select
    to authenticated
    using (true);

-- Sólo la service_role (usada por la Edge Function) escribe en el log.
drop policy if exists "mhr_email_log_insert_service" on public.mhr_email_log;
create policy "mhr_email_log_insert_service"
    on public.mhr_email_log for insert
    to service_role
    with check (true);

-- ============================================================================
-- Semilla opcional — descomenta y ajusta para sembrar tus primeros correos
-- ============================================================================
-- insert into public.mhr_email_recipients (email, nombre, rol, activo) values
--     ('jefe.operaciones@aifanlu.com.mx',  'Jefe de Operaciones',  'jefe', true),
--     ('supervisor.aifa@aifanlu.com.mx',   'Supervisor AIFA',      'supervisor', true)
-- on conflict (email) do nothing;
