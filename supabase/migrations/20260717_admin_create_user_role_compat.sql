-- RPC requerida por admin-usuarios.html para altas desde el panel MHR.
-- Se mantiene como función JSONB para conservar el contrato actual del front.
create or replace function public.admin_create_user_role(
  p_user_id uuid,
  p_role text,
  p_dir_id uuid default null,
  p_subdir_id uuid default null,
  p_ger_id uuid default null,
  p_allowed_sections text[] default null
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_permissions jsonb;
  v_mhr_app uuid;
begin
  if not public.mhr_is_admin() then
    return jsonb_build_object('ok', false, 'error', 'No autorizado');
  end if;

  v_permissions := jsonb_build_object('estado', 'ACTIVO');
  if p_dir_id is not null then
    v_permissions := v_permissions || jsonb_build_object('dir_id', p_dir_id);
  end if;
  if p_subdir_id is not null then
    v_permissions := v_permissions || jsonb_build_object('subdir_id', p_subdir_id);
  end if;
  if p_ger_id is not null then
    v_permissions := v_permissions || jsonb_build_object('ger_id', p_ger_id);
  end if;
  if p_allowed_sections is not null then
    v_permissions := v_permissions || jsonb_build_object('allowed_sections', to_jsonb(p_allowed_sections));
  end if;

  select id into v_mhr_app from public.aplicaciones where clave = 'MHR' and activo = true;
  if v_mhr_app is null then
    return jsonb_build_object('ok', false, 'error', 'Aplicativo MHR no configurado');
  end if;

  -- El rol de MHR vive exclusivamente aquí. No insertar en user_roles:
  -- esa tabla es compartida con AIFA/Operaciones y otorgaría acceso allí.
  insert into public.usuarios_aplicaciones (usuario_id, aplicacion_id, rol, permisos, estado)
  values (p_user_id, v_mhr_app, p_role, v_permissions, 'ACTIVO')
  on conflict (usuario_id, aplicacion_id) do update
    set rol = excluded.rol,
        permisos = excluded.permisos,
        estado = 'ACTIVO',
        updated_at = now();

  return jsonb_build_object('ok', true);
exception when others then
  return jsonb_build_object('ok', false, 'error', sqlerrm);
end;
$$;

revoke all on function public.admin_create_user_role(uuid, text, uuid, uuid, uuid, text[]) from public;
grant execute on function public.admin_create_user_role(uuid, text, uuid, uuid, uuid, text[]) to authenticated;
