# Migration Notes

## Fase 1 - Extracción y modularización inicial de CSS
- **Movido:** bloque `<style>` principal de `index.html`.
- **Origen:** `index.html` (cabecera, bloque CSS embebido).
- **Destino inicial:** `assets/css/main.css`.
- **Subfase actual:** `main.css` se convirtió en agregador con imports y se segmentó por responsabilidad:
  - `assets/css/layout.css`
  - `assets/css/forms.css`
  - `assets/css/tables.css`
  - `assets/css/dashboard.css`
- **Compatibilidad:** `index.html` mantiene `<link rel="stylesheet" href="./assets/css/main.css">` con rutas relativas para GitHub Pages.
- **No modificado intencionalmente:** lógica JavaScript, estructura de formularios, IDs, clases, atributos `data-*`, llamadas Supabase y handlers inline.
- **Pendiente siguiente fase:** extracción controlada de JavaScript por dominio funcional (sin romper `window.*` de compatibilidad temporal).

## Fase 2 - Separación controlada de JavaScript (inicio)
- **Movido:** gestor de firmas (canvas + guardar/limpiar/toggle + inicialización).
- **Origen:** bloque `<script>` inline en `index.html`.
- **Destino:** `js/ui/signature-manager.js`.
- **Compatibilidad mantenida:** se conservan funciones globales requeridas por HTML inline (`window.guardarFirma`, `window.limpiarFirma`, `window.obtenerFirmas`, `window.obtenerFirmasFauna`, `window.toggleFirmas`, `window.toggleFirmasFauna`).
- **No modificado intencionalmente:** reglas de negocio, payloads de reportes, consultas Supabase y estructura de formularios.

## Fase 3 - Centralización inicial de Supabase
- **Movido:** bootstrap de cliente Supabase y helpers de URL segura para PDF.
- **Origen:** bloque inline `Supabase Logic` en `index.html`.
- **Destino:** `js/supabase-client.js`.
- **Compatibilidad mantenida:** se conserva `window.supabaseClient`; se exponen helpers en `window.MHRSupabaseHelpers` para mantener el flujo actual sin reescribir lógica de negocio.

## Fase 4 - Separación de lógica UI de pantalla (Fauna)
- **Movido:** lógica de bloqueo/desbloqueo de `fauna_tipo_reporte_inspeccion` y botón de cambio asociado.
- **Origen:** bloque inline dentro del `DOMContentLoaded` de `index.html`.
- **Destino:** `js/pages/fauna-form-page.js` (`window.MHRFaunaPage.initTipoReporteLock`).
- **Compatibilidad mantenida:** el `DOMContentLoaded` original sigue orquestando la inicialización, ahora delegando al módulo de página.
- **Extensión Fase 4:** también se movió la lógica de visibilidad de sección `fauna_turno-section` a `window.MHRFaunaPage.initTurnoVisibility(faunaForm)` en `js/pages/fauna-form-page.js`.
- **Extensión Fase 4:** se movió además la lógica de bloqueo/cambio para `fauna_pista` a `window.MHRFaunaPage.initPistaLock(faunaForm)`.
- **Extensión Fase 4:** se movió también la lógica de bloqueo/cambio para `fauna_fase_vuelo` a `window.MHRFaunaPage.initFaseVueloLock(faunaForm)`.

## Fase 4.5 - Servicios de datos Fauna (inicio acelerado)
- **Movido:** consultas de hallazgos Fauna (años y dataset de mapa) desde lógica inline.
- **Origen:** funciones `loadFaunaHallazgosYears` y `loadFaunaHallazgosMapData` en `index.html`.
- **Destino:** `js/services/fauna-report-service.js`.
- **Compatibilidad mantenida:** las funciones de pantalla conservan su flujo; solo delegan consultas en `window.MHRFaunaReportService`.

## Fase 5 - Catálogos (inicio acelerado)
- **Movido:** consultas de catálogos de aerolíneas y partes de avión, más historial de uso de aerolíneas.
- **Origen:** funciones inline `loadAirlineSmartOptions` y `loadPartesAvion` en `index.html`.
- **Destino:** `js/services/catalog-service.js`.
- **Compatibilidad mantenida:** la UI sigue armando datalist/select en los mismos elementos; solo se delega el acceso a datos en `window.MHRCatalogService`.

## Fase 4.6 - Servicio de usuarios/autenticación (inicio)
- **Movido:** consultas a `vw_app_usuarios`, `usuarios` y `user_roles` desde el bloque inline de login/autores.
- **Origen:** funciones `loadRevisionResponsibleOptions`, `loginWithUsuariosTable` y obtención de rol post-login en `index.html`.
- **Destino:** `js/services/user-service.js`.
- **Compatibilidad mantenida:** el flujo actual de login y carga de responsables se conserva; solo se delega acceso a datos en `window.MHRUserService`.

## Fase 4.7 - Servicio de reportes (inicio)
- **Movido:** operaciones de inserción para `reports`, `report_items` e `item_photos`.
- **Origen:** flujo inline de guardado principal y sincronización offline en `index.html`.
- **Destino:** `js/services/report-service.js`.
- **Compatibilidad mantenida:** se conserva el payload actual y manejo de errores/reintentos; la UI mantiene el mismo flujo y mensajes.

## Fase R1 (de 3 restantes) - Inicio
- **Movido:** consultas base de fauna para estadísticas/listado general (`getAllFaunaReports`, `getFaunaReportsByFilters`).
- **Origen:** `loadFaunaStatistics` y `loadFaunaReports` en `index.html`.
- **Destino:** `js/services/fauna-report-service.js`.
- **R1 avance adicional:** inserciones de `fauna_reports` movidas a `MHRFaunaReportService.insertFaunaReport`, y consulta ordenada de `reports` para estadísticas movida a `MHRReportService.getReportsOrdered`.
- **R1 avance adicional:** en guardado principal de revisión se delegaron también `report_items`, carga de fotos a bucket `photos` e inserción masiva en `item_photos` hacia `MHRReportService`.
- **R1 avance adicional:** se delegó también upload de PDF bucket `reports` y upload/public URL de fotos (`photos`) en `MHRReportService`.
- **Documentación nueva:** `docs/function-file-map.md` con mapeo de funciones por archivo y responsabilidad.

## Fase R2-R3 (ejecución consolidada)
- **Servicio nuevo:** `js/services/fauna-catalog-service.js` para centralizar consultas de catálogos Fauna (`catalogo_clase`, `catalogo_especie`, `catalogo_destino`) y deduplicación/normalización de opciones.
- **Index simplificado:** se removió bloque inline de utilidades de catálogo (`getCatalogoActivo`, cache-key, normalización, wiring clase→especie) y se delegó a `window.MHRFaunaCatalogService`.
- **Compatibilidad mantenida:** se conserva `window.faunaCatalogosCache` y los mismos IDs de selects/filtros (`fauna_rescate_clase`, `fauna_rescate_especie`, `filter-fauna-clase`, `filter-fauna-especie`).
- **Resultado:** menor acoplamiento en `index.html` y centralización de acceso a datos de catálogos en servicio reutilizable.
- **Resto de migración aplicado:** se movió el bloque de inicialización de interacciones Fauna (locks, visibilidad, limpieza de ítems, colorización, wiring de mapa y control especie "Otra") a `js/pages/fauna-interactions-page.js`, dejando en `index.html` solo la llamada de arranque.

- **Cierre adicional:** también se migraron al mismo módulo `js/pages/fauna-interactions-page.js` el combo inteligente de aerolíneas y la lógica de parte de avión impactada, eliminando ese bloque inline en `index.html`.
- **Siguiente fase aplicada:** listeners de conectividad y bootstrap de sincronización offline movidos a `js/pages/offline-sync-page.js`; `index.html` conserva solo el arranque del módulo con callbacks existentes.
- **Siguiente fase aplicada:** persistencia/restauración de estado del formulario (`saveFormState`/`restoreFormState`, counters de duplicados, listeners de guardado) extraída de `index.html` a `js/pages/form-state-page.js`.
- **Siguiente fase aplicada:** limpieza manual de estado por sección (botón `clear-saved-btn`) extraída de `index.html` a `js/pages/clear-saved-page.js` con compatibilidad de `window.saveFormState`.
- **Siguiente fase aplicada:** selector de cargo (`.role-item`, reset y campo "Otro") movido de `index.html` a `js/pages/role-selector-page.js`.
- **Siguiente fase aplicada:** bloqueo/desbloqueo por ítem de revisión (botones `done_`/`update_` y campos `details_*`) extraído de `index.html` a `js/pages/revision-item-lock-page.js`.
- **Siguiente fase aplicada:** manejo de campo "Hallazgo Otro" para ítems de revisión movido de `index.html` a `js/pages/revision-hallazgo-page.js`.
- **Fase R2 avance (sesión actual):** flujo de render/preview/export de PDF de revisión extraído desde `js/pages/revision-page.js` hacia `js/ui/pdf-renderer.js`.
- **Integración:** `revision-page` conserva orquestación de submit, metadatos y persistencia en Supabase, delegando la generación del blob/preview al renderer.
- **Compatibilidad mantenida:** mismo contenedor `#report-summary`, mismos controles `#pdf-preview-*`, mismos mensajes y secuencia de guardado (upload PDF → insert de reporte/items/fotos).

- **Fase R2 avance (siguiente fase):** extracción del modal de mapa interactivo (selección de lugar + geolocalización + captura `html2canvas`) desde `index.html` a `js/ui/map-picker-modal.js`, manteniendo `window.openMapPicker` por compatibilidad.
- **Fase R2 avance (siguiente fase):** extracción de colorización de selects de prioridad/condición a `js/ui/select-colorizer.js` para eliminar listeners inline repetitivos en `index.html`.
- **Fase R2 avance (siguiente fase):** extracción del bloque inline del botón `clear-all-btn` hacia `js/pages/clear-all-page.js`, preservando limpieza por sección (revisión/fauna), reseteo de controles especiales y persistencia vía `window.saveFormState`.
- **Fase R2 avance (siguiente fase):** inicializaciones `DOMContentLoaded` de `MHRDashboardUI` y `MHRRevisionPage` extraídas de `index.html` a `js/pages/app-bootstrap-page.js` para dejar bootstrap mínimo y consistente.
- **Fase R2 avance (siguiente fase):** bloque inline de utilidades UI de revisión (visibilidad de turno, lock de responsable y toggle/limpieza de `details_tipo_*`) extraído de `index.html` a `js/pages/revision-basic-ui-page.js`.
- **Fase R2 avance (siguiente fase):** bloque inline de duplicación dinámica de ítems de revisión (`duplicateItem`, wiring `done/update/+ /clear`, exposición `window.mhr`) extraído a `js/pages/revision-duplicate-page.js` preservando compatibilidad con restauración de estado y fotos por ítem.
- **Fase R2 avance (siguiente fase):** bloque inline de evidencias fotográficas por ítem de revisión (`window.itemPhotos`, inyección de upload UI, previews, patch de `window.mhr.duplicateItem`) extraído a `js/pages/revision-item-photos-page.js` manteniendo compatibilidad del helper `window.mhr.getItemPhotos`.
- **Fase R2 avance (siguiente fase):** bloque inline de controles de ítems Fauna Impacto (`done/update/duplicate/clear` para `fauna_avistamiento` y clones) extraído a `js/pages/fauna-impact-item-controls-page.js`, preservando la regla de `avistamiento` primario siempre activo.
- **Fase R2 avance (siguiente fase):** bloque inline de composición de ítems de revisión (selector incremental `item-combo-row`, cards colapsables y staging de `item_block_*`) extraído a `js/pages/revision-item-composer-page.js` sin alterar IDs/base de inputs.
- **Fase R3 (commit 1/6):** extracción del bloque inline de autenticación/sesión (login, logout, role resolution y carga de responsables) desde `index.html` a `js/pages/auth-session-page.js`, inicializado desde `Supabase Logic` con `window.MHRAuthSessionPage.init({ supabase })`.
- **Fase R3 (commit 2/6):** extracción del bloque inline de navegación principal (tabs/sidebar/títulos y triggers de carga por pestaña) a `js/pages/main-tabs-page.js`, invocado desde `Supabase Logic` con callbacks existentes (`cargarCatalogosFauna`, `loadFaunaStatistics`, `loadFaunaReports`, `loadEstadisticas`).
- **Fase R3 (commit 3/6):** extracción del bloque inline de persistencia/sincronización offline de revisión (`IndexedDB`, `window.saveFormOffline`, `window.syncPendingReports`, `window.updatePendingBadge`) a `js/pages/offline-report-sync-page.js`, inicializado desde `Supabase Logic`.
- **Fase R3 (commit 4/6):** extracción del bloque inline de submit/generación PDF de Fauna (impacto y rescate) a `js/pages/fauna-submit-page.js`, inicializado desde `Supabase Logic` con contexto de `supabase`.
- **Fase R3 (commit 5/6):** extracción del bloque inline de dashboard Fauna (tabs impacto/rescate, carga de catálogos, estadísticas/historial, mapa de hallazgos y filtros) a `js/pages/fauna-dashboard-page.js`, invocado desde `Supabase Logic`.
- **Fase R3 (commit 6/6):** orquestación residual de `Supabase Logic` extraída a `js/pages/supabase-orchestrator-page.js`; `index.html` ahora solo invoca el orquestador para inicializar auth, tabs, fauna submit/dashboard y sync offline sin bloque inline extenso.
- **Post-R3 cleanup:** se depuraron trazas de depuración (`console.log`) en módulos de página/UI ya extraídos para reducir ruido en producción, sin alterar flujos funcionales.
