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
