-- Permite administrar destinatarios usando el rol global de cualquiera
-- de las fuentes de usuarios compartidas por las aplicaciones.
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
          and lower(trim(coalesce(ur.role, ''))) in ('admin', 'superuser', 'superadmin')
    )
    or exists (
        select 1
        from public.usuarios u
        where u.id = auth.uid()
          and lower(trim(coalesce(u.role, ''))) in ('admin', 'superuser', 'superadmin')
    );
$$;

revoke all on function public.mhr_is_admin() from public;
grant execute on function public.mhr_is_admin() to authenticated;
