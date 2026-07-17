-- Acciones administrativas sobre reportes desde el historial.
do $$
begin
    if to_regclass('public.reports') is not null then
        execute 'drop policy if exists "mhr_reports_admin_update" on public.reports';
        execute 'drop policy if exists "mhr_reports_admin_delete" on public.reports';
        execute 'create policy "mhr_reports_admin_update" on public.reports for update to authenticated using (public.mhr_is_admin()) with check (public.mhr_is_admin())';
        execute 'create policy "mhr_reports_admin_delete" on public.reports for delete to authenticated using (public.mhr_is_admin())';
    end if;
end $$;
