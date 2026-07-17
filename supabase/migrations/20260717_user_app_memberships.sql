-- Separación de acceso por aplicativo sin duplicar identidades.
-- La tabla user_roles se conserva para no romper versiones anteriores de MHR.

create table if not exists public.aplicaciones (
  id uuid primary key default gen_random_uuid(),
  clave text not null unique,
  nombre text not null,
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

insert into public.aplicaciones (clave, nombre)
values ('MHR', 'Maintenance Host Report'), ('OPERACIONES', 'Operaciones')
on conflict (clave) do update set nombre = excluded.nombre;

create table if not exists public.usuarios_aplicaciones (
  -- user_roles.user_id corresponde al usuario autenticado de Supabase.
  usuario_id uuid not null references auth.users(id) on delete cascade,
  aplicacion_id uuid not null references public.aplicaciones(id) on delete cascade,
  rol text,
  permisos jsonb not null default '{}'::jsonb,
  estado text not null default 'ACTIVO' check (estado in ('ACTIVO','INACTIVO')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (usuario_id, aplicacion_id)
);

create index if not exists usuarios_aplicaciones_app_idx
  on public.usuarios_aplicaciones (aplicacion_id, estado);

-- Compatibilidad: todo usuario que ya tenía configuración de MHR conserva acceso.
insert into public.usuarios_aplicaciones (usuario_id, aplicacion_id, rol, permisos)
select ur.user_id, a.id, ur.role, coalesce(ur.permissions, '{}'::jsonb)
from public.user_roles ur
cross join public.aplicaciones a
where a.clave = 'MHR'
on conflict (usuario_id, aplicacion_id) do nothing;

alter table public.aplicaciones enable row level security;
alter table public.usuarios_aplicaciones enable row level security;

drop policy if exists aplicaciones_authenticated_read on public.aplicaciones;
create policy aplicaciones_authenticated_read on public.aplicaciones
  for select to authenticated using (activo = true);

drop policy if exists usuarios_aplicaciones_authenticated_read on public.usuarios_aplicaciones;
create policy usuarios_aplicaciones_authenticated_read on public.usuarios_aplicaciones
  for select to authenticated using (true);

drop policy if exists usuarios_aplicaciones_admin_write on public.usuarios_aplicaciones;
create policy usuarios_aplicaciones_admin_write on public.usuarios_aplicaciones
  for all to authenticated using (public.mhr_is_admin()) with check (public.mhr_is_admin());

comment on table public.usuarios_aplicaciones is
  'Membresía de una identidad en cada aplicativo; roles y permisos son independientes por aplicación.';
