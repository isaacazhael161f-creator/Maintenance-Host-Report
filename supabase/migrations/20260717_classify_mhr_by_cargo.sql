-- Clasificación inicial solicitada para MHR:
-- con puesto/cargo => MHR; sin puesto => no se asigna MHR.
-- No toca auth.users, user_roles ni el acceso de Operaciones.

delete from public.usuarios_aplicaciones ua
where ua.aplicacion_id = (
    select a.id
    from public.aplicaciones a
    where a.clave = 'MHR'
  )
  and not exists (
    select 1
    from public.profiles p
    where p.id = ua.usuario_id
      and nullif(btrim(coalesce(p.cargo, '')), '') is not null
  )
  and not exists (
    select 1
    from public.user_roles ur
    where ur.user_id = ua.usuario_id
      and lower(coalesce(ur.role, '')) in ('superuser', 'superadmin')
  );
