# Plan de Refactorización por Fases (sin cambio funcional)

## Objetivo
Reducir `index.html` y separar responsabilidades en módulos con nombres funcionales, preservando comportamiento actual y compatibilidad con GitHub Pages.

## Fase 0 — Diagnóstico (completada en este commit)
- Generar mapa de dependencias.
- Identificar globales, listeners, inline handlers, queries Supabase y catálogos.
- Definir estrategia de extracción por riesgo.

## Fase 1 — Extracción de CSS embebido
- Crear `assets/css/main.css`, `layout.css`, `forms.css`, `tables.css`, `dashboard.css`.
- Mover reglas desde `<style>` sin alterar selectores.
- Mantener orden de carga para evitar regressions visuales.
- Validar visualmente y con búsqueda estática de estilos inline restantes.

## Fase 2 — Bootstrap JS y utilidades base
- Crear `js/app.js` como punto de entrada no invasivo.
- Crear `js/utils/string-utils.js`, `js/utils/date-utils.js`, `js/utils/constants.js`.
- Mover funciones puras primero (bajo riesgo).
- Mantener compatibilidad exponiendo temporalmente wrappers en `window` solo cuando sea requerido por HTML inline.

## Fase 3 — Cliente Supabase y auth
- Crear `js/supabase-client.js` (única creación de cliente).
- Crear `js/auth/auth-service.js`, `js/auth/session-service.js`, `js/auth/permission-service.js`.
- Reemplazar llamadas directas dispersas por servicios sin cambiar tablas/columnas.

## Fase 4 — Servicios de dominio
- Crear `js/services/report-service.js`, `fauna-report-service.js`, `catalog-service.js`, `user-service.js`.
- Encapsular `from/select/insert/update` en funciones pequeñas testeables.
- Eliminar queries directas desde handlers UI.

## Fase 5 — UI y render
- Crear `js/ui/dom-helpers.js`, `notifications.js`, `modal-manager.js`, `table-renderer.js`, `form-renderer.js`.
- Extraer render de tablas/listados/previews.
- Mantener mismos IDs, clases y flujo de eventos.

## Fase 6 — Páginas/módulos por pantalla
- Crear `js/pages/dashboard-page.js`, `capture-page.js`, `query-page.js`, `admin-page.js`.
- Orquestar init por sección, sin framework.
- Reducir scripts inline del `index.html` a mínimo de bootstrapping.

## Fase 7 — Catálogos
- Mover hardcodes a `js/utils/constants.js` cuando no exista tabla catálogo.
- Si hay tablas catálogo existentes, consumir desde `catalog-service.js`.
- Producir `database/proposed-catalogs.sql` solo como propuesta (sin ejecutar).

## Fase 8 — Limpieza final de index
- Dejar `index.html` como estructura + referencias CSS/JS.
- Quitar bloques extensos de lógica y estilos embebidos.
- Mantener inline handlers solo si siguen siendo necesarios por compatibilidad temporal, documentados en `docs/migration-notes.md`.

## Fase 9 — Documentación final
- Actualizar `README.md` con arquitectura final e inicialización.
- Crear/actualizar `docs/migration-notes.md` con matriz "origen → destino".
- Documentar deuda técnica residual y pasos post-migración.

## Matriz de riesgo y mitigación
- **Riesgo alto:** duplicación dinámica de ítems. **Mitigación:** pruebas manuales guiadas y migración tardía.
- **Riesgo alto:** flujo PDF/mapa/fotos. **Mitigación:** snapshot funcional previo/post con checklist.
- **Riesgo medio:** permisos/roles. **Mitigación:** encapsular sin reescribir reglas.
- **Riesgo medio:** inconsistencias `fauna-reports`/`fauna_reports`. **Mitigación:** auditar esquema y centralizar alias en servicio.

## Validaciones por fase
- `git status --short`
- `rg -n "<script|<style|onclick=|addEventListener|function |const .*\[|select\(|from\(" .`
- `rg -n "inline-script|legacy|window\.|supabase" .`
- `find . -type f | sort`
- Si aplica por `package.json`: `npm run check`, `npm run lint`, `npm run build`, `npm test`.

## Criterio de avance
No avanzar a extracción masiva de lógica (Fase 2+) hasta cerrar revisión del mapa de dependencias y validar alcance/riesgos.
