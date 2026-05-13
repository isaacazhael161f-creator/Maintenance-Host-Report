# Dependency Map (Fase 0)

## Alcance analizado
- Archivo principal: `index.html` (~9698 líneas).
- Utilidad externa local: `js/mhr-utils.js`.
- Scripts de calidad: `scripts/quality/*.js`.

## 1) Funciones existentes (inventario funcional)
> Nota: el `index.html` contiene +100 funciones. Para evitar mover a ciegas, se agrupan por dominio y se listan las más críticas y/o de alto acoplamiento.

### A. Inicialización / configuración
- `checkSession`, `showLogin`, `handleUser`, `saveCurrentUser`, `clearCurrentUser`, `getCurrentUser`.
- Inicialización de cliente Supabase en bloque de configuración (`window.supabaseClient`).

### B. Captura de reportes (no fauna)
- `collectFormState`, `saveState`, `restoreState`, `saveDebounced`.
- `setupItemControlsFor`, `duplicateItem`, `renderPreviews`, `handleFileChange`, `injectPhotoField`.
- `generatePdf`, `finalizePdf`, `finalizarConfirmLocation`, `confirmLocation`.

### C. Fauna
- `setupFaunaItemControlsFor`, `duplicateFaunaItem`, `initializeFaunaItems`.
- `loadFaunaReports`, `loadFaunaStatistics`, `loadFaunaHallazgosMapData`, `loadFaunaHallazgosYears`.
- `cargarCatalogosFauna`, `cargarCatalogoSelect`, `getCatalogoActivo`, `cargarEspeciesPorClase`.
- `updateFaunaPistaState`, `updateFaunaReporteState`, `updateFaunaFaseVueloState`.

### D. UI / estado visual
- `updatePriorityColor`, `updateCondColor`, `updateTurnoVisibility`, `updateParteVisibility`, `updateEspecieVisibility`.
- `openMapModal`, `closeMapModal`, `useMyLocation`, `updateMapInfo`, `initMap`.
- `toggleFirmas`, `toggleFirmasFauna`, `guardarFirma`, `limpiarFirma`, `obtenerFirmas`, `obtenerFirmasFauna`.

### E. Datos / sincronización
- `savePendingReport`, `getPendingReports`, `markReportSynced`, `uploadPendingReport`, `openOfflineDB`.
- `saveFormOffline` (expuesta en `window`).

### F. Helpers / utilidades
- `escapeHtml`, `normalizeText`, `normalizarTextoCatalogo`, `splitCodeAndName`, `parseCoordsFromText`, `pad`.

## 2) Ubicación de funciones (archivo/bloque)
- Casi toda la lógica vive en bloques `<script>` embebidos en `index.html`.
- Utilidades transversales parciales en `js/mhr-utils.js` (`debounce`, helpers de render y binding selectivo).
- No existe separación por módulos funcionales en carpetas `js/services`, `js/ui`, `js/pages`.

## 3) Elementos HTML usados por funciones
- Formularios principales: captura y fauna (inputs, textareas, selects, radio groups).
- Secciones colapsables de ítems (`details_*`, checkboxes por ítem, botones done/update/duplicate/clear).
- Modales de mapa y firma (`canvas`, botones guardar/limpiar firma).
- Contenedores de tablas/listados (reportes e históricos fauna).
- Selectores de filtros (año, mes, pista, clase/especie, aerolínea, etc.).

## 4) IDs/clases/data-* de los que depende el JS
- IDs críticos con patrón: `details_*`, `item_*`, `fauna_*`, `firma_*`, `map*`, `reports*`.
- Dependencias por nombre/convención de IDs (duplicación dinámica basada en `replace(origId, newId)`).
- Clases usadas para comportamiento: botones de firma, opciones de pista, contenedores de preview.
- Hay acoplamiento fuerte a estructura DOM y naming convention (alto riesgo si cambia markup).

## 5) Tablas/buckets Supabase consultados
- Tablas: `reports`, `report_items`, `item_photos`, `usuarios`, `user_roles`, `vw_app_usuarios`, `fauna_reports`, `fauna-reports` (inconsistencia de naming), `catalogo_aerolineas`, `catalogo_partes_avion`.
- Bucket storage: `photos`.

## 6) Columnas esperadas desde Supabase (observadas por uso)
- `reports`: metadatos del reporte (usuario, fecha, turno, pista, estado/sincronización, payload de formulario).
- `report_items`: ítem, condición, prioridad, observaciones, ubicación.
- `item_photos`: referencia a reporte/ítem + URL/path de foto.
- `usuarios`/`vw_app_usuarios`: identidad, rol, estado activo, datos de sesión.
- `user_roles`: relación usuario↔rol/permisos.
- `fauna_reports`: campos de evento/hallazgo/fauna, filtros temporales, pista, aerolínea, clase/especie, fotos.
- Catálogos: campos típicos `id`, `codigo`, `nombre`, `activo`, `orden` (a confirmar exactitud en esquema real).

## 7) Variables globales existentes
- `window.supabaseClient`, `window.currentUser`, `window.logoBase64`.
- `window.mhr` (API de compatibilidad para duplicación/contadores/fotos).
- `window.itemPhotos`, `window.faunaItemPhotos`, `window.faunaRescateFotos`.
- `window.firmaPads`, `window.firmaData`, `window.firmaGuardada`.
- `window.faunaCatalogosCache`.
- `window.saveFormState`, `window.restoreFormState`, `window.openMapPicker`, `window.saveFormOffline`, `window.updatePendingBadge`.

## 8) Funciones que dependen de variables globales
- Persistencia y envío: dependen de `window.supabaseClient`.
- Firma: dependen de `window.firma*`.
- Fotos por ítem: dependen de `window.itemPhotos` / `window.faunaItemPhotos`.
- Duplicación dinámica: depende de `window.mhr` y `window.mhr.counters`.
- UI mapa/geolocalización: depende de `window.openMapPicker` y librerías globales (`L`, `toGeoJSON`).

## 9) Listeners existentes y conexión
- ~110 `addEventListener` en `index.html`.
- Tipos: `DOMContentLoaded`, `click`, `change`, `input`, mouse/touch para canvas de firmas, eventos de carga de archivos.
- Varios listeners delegados sobre `document` para elementos dinámicos.

## 10) Funciones llamadas desde HTML inline
- `onclick="guardarFirma('...')"`.
- `onclick="limpiarFirma('...')"`.
- Total detectado: 10 inline handlers (principalmente firmas).

## 11) Catálogos hardcodeados (detectados)
- Opciones de algunos `select` y mapas de color/estados en JS.
- Reglas de prioridad/condición y toggles con valores literales (`Satisfactorio`, `No Satisfactorio`, `N/A`, etc.).

## 12) Catálogos aparentes de base de datos
- `catalogo_aerolineas`.
- `catalogo_partes_avion`.
- Catálogos fauna cacheados (`catalogo_clase` y relacionados por especie) vía `getCatalogoActivo`.

## 13) Funciones posiblemente duplicadas o solapadas
- Lógica repetida de lock/unlock/clear en ítems normales y fauna.
- Repetición de secuencias de subida de fotos + registro en tabla.
- Repetición de armado de logo/base URL en generación PDF.
- Repetición de validaciones de estado de pista/reporte por sección.

## 14) Bloques movibles con bajo riesgo (prioridad de extracción)
1. Utilidades puras (`normalizeText`, `escapeHtml`, `pad`, parseos): `js/utils/*`.
2. Estado de firmas/canvas: `js/ui/signature-manager.js`.
3. Helpers de DOM y notificaciones: `js/ui/dom-helpers.js`, `js/ui/notifications.js`.
4. Configuración Supabase y sesión: `js/config.js`, `js/supabase-client.js`, `js/auth/*`.

## 15) Bloques de alto riesgo (revisión manual antes de mover)
1. Duplicación dinámica de ítems por reemplazo de IDs/names.
2. Serialización/restauración de estado completo del formulario.
3. Guardado offline + sincronización + subida de fotos.
4. Flujo de generación PDF con mapa y capturas canvas.
5. Permisos/roles entre `usuarios`, `user_roles` y vista `vw_app_usuarios`.
6. Inconsistencia `fauna-reports` vs `fauna_reports` (revisar si ambas existen o es deuda técnica).

## Riesgos técnicos detectados
- Acoplamiento alto entre lógica y estructura HTML (IDs hardcoded).
- Dependencia fuerte de globales `window.*`.
- Mezcla UI + acceso datos + negocio en las mismas funciones.
- Uso combinado de múltiples estilos de naming para entidades fauna.
