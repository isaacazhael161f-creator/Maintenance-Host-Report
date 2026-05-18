# Mapeo de funciones por archivo

## `js/supabase-client.js`
- `isSafeStoragePath(path)`: valida rutas seguras para storage.
- `resolvePdfUrl(bucketName, filePath, ttlSeconds)`: intenta resolver URL de PDF (Edge Function -> signed URL -> public URL).
- Inicializa `window.supabaseClient` y expone `window.MHRSupabaseHelpers`.

## `js/ui/signature-manager.js`
- `initFirmaPad(padId)`: inicializa canvas de firma.
- `window.limpiarFirma(padId)`: limpia canvas y estado.
- `window.guardarFirma(padId)`: serializa firma y marca guardado.
- `window.obtenerFirmas()`: retorna firmas de revisión.
- `window.obtenerFirmasFauna()`: retorna firmas de fauna.
- `window.toggleFirmas() / window.toggleFirmasFauna()`: mostrar/ocultar paneles de firmas.

## `js/pages/fauna-form-page.js`
- `window.MHRFaunaPage.initTipoReporteLock(faunaForm)`: bloqueo de selección tipo reporte fauna.
- `window.MHRFaunaPage.initTurnoVisibility(faunaForm)`: visibilidad de turno según tipo.
- `window.MHRFaunaPage.initPistaLock(faunaForm)`: bloqueo/cambio de pista.
- `window.MHRFaunaPage.initFaseVueloLock(faunaForm)`: bloqueo/cambio de fase de vuelo.

## `js/services/report-service.js`
- `getReportsOrdered(client)`: obtiene reportes ordenados por creación.
- `insertReport(client, payload)`: inserta reporte y retorna array.
- `insertReportSingle(client, payload)`: inserta reporte y retorna single.
- `insertReportItems(client, itemsPayload)`: inserta detalles de items.
- `insertItemPhoto(client, payload)`: inserta una referencia de foto.
- `insertItemPhotosBulk(client, payloads)`: inserta referencias de fotos en lote.
- `uploadToBucket(client, bucket, filename, blob, options)`: sube archivo a bucket.
- `getPublicUrl(client, bucket, filePath)`: obtiene URL pública de archivo.

## `js/services/fauna-report-service.js`
- `insertFaunaReport(client, payload)`: inserta reporte fauna.
- `getAllFaunaReports(client)`: obtiene todos los reportes fauna.
- `getFaunaReportsByFilters(client, filters)`: consulta fauna por filtros de fecha/clase/especie.
- `getHallazgosYears(client)`: años disponibles con coordenadas en rescates.
- `getHallazgosMapData(client, filters)`: dataset de hallazgos georreferenciados.

## `js/services/catalog-service.js`
- `getCatalogoAerolineas(client)`: catálogo de aerolíneas.
- `getUsoAerolineas(client)`: historial de aerolíneas usadas en fauna.
- `getPartesAvionActivas(client)`: catálogo activo de partes de avión.

## `js/services/user-service.js`
- `fetchAppUsuarios(client)`: consulta vista `vw_app_usuarios`.
- `findUsuarioByUsernameOrEmail(client, userValue)`: lookup de usuario en `usuarios`.
- `getUserRole(client, userId)`: obtiene rol desde `user_roles`.

## `index.html` (pendiente de extracción)
- Orquestación principal de páginas, listeners globales, flujos PDF, offline sync y render tabular.
- Pendiente principal: separar orquestación global de revisión/offline/PDF en módulos de página adicionales.

## `js/services/fauna-catalog-service.js`
- `getCatalogoActivo(client, tabla, filtros)`: consulta catálogos activos en Supabase con filtros opcionales.
- `cargarCatalogoSelect(client, tabla, selectElement, placeholder, filtros)`: renderiza opciones en `<select>` con deduplicación por texto normalizado.
- `cargarEspeciesPorClase(client, selectClase, selectEspecie, placeholder)`: filtra especies por clase seleccionada.
- `normalizarTextoCatalogo(valor)` / `getCatalogoCacheKey(tabla, filtros)`: helpers de normalización y cache para evitar queries repetidas.

## `js/pages/fauna-interactions-page.js`
- `window.MHRFaunaInteractionsPage.init({ cargarCatalogosFauna })`: inicializa interacciones de UI de formulario Fauna (locks de selección, limpieza de detalle, estilos de prioridad/condición, wiring de mapa, visibilidad de especie "Otra", combo inteligente de aerolíneas y parte de avión impactada).

## `js/pages/offline-sync-page.js`
- `window.MHROfflineSyncPage.init({ showOfflineBanner, hideOfflineBanner, getPendingReports })`: encapsula listeners online/offline, badge inicial y sincronización automática de pendientes al cargar.

## `js/pages/form-state-page.js`
- Gestiona guardado/restauración de estado en `localStorage` (incluye counters de ítems duplicados), y expone `window.saveFormState` + `window.restoreFormState` por compatibilidad.

## `js/pages/clear-saved-page.js`
- Maneja el botón `clear-saved-btn` para limpiar la sección activa (revisión/fauna), resetear previews de fotos fauna y persistir estado limpio vía `window.saveFormState`.

## `js/pages/role-selector-page.js`
- Maneja el comportamiento del selector de cargo con botones `.role-item`, botón reset y visibilidad del input "Otro" para mantener UX de selección actual.

## `js/pages/revision-item-lock-page.js`
- Gestiona lock/unlock por ítem de revisión para checkboxes `tipo_*`, incluyendo visualización de botones `done_`/`update_` y habilitación/deshabilitación de campos dentro de `details_*`.

## `js/pages/revision-hallazgo-page.js`
- Controla visibilidad/limpieza del campo `hallazgo_other_*` cuando el select `hallazgo_*` toma valor "Otro" en ítems de revisión.

## `js/ui/pdf-renderer.js`
- `window.MHRPdfRenderer.renderRevisionPdf(options)`: renderiza HTML a PDF con `html2pdf`, agrega página horizontal auxiliar, muestra preview/descarga y devuelve el blob vía callback para persistencia.

## `js/ui/map-picker-modal.js`
- Gestiona modal de mapa interactivo (Leaflet), geolocalización, confirmación de coordenadas y captura de miniatura de mapa; expone `window.openMapPicker` para compatibilidad legacy.

## `js/ui/select-colorizer.js`
- Inicializa listeners para colorización de `select.priority-select` y `select.condicion-select` preservando reglas visuales actuales.

## `js/pages/clear-all-page.js`
- Maneja el botón fijo `clear-all-btn`: confirma limpieza total de la sección activa, restablece controles de revisión/fauna y persiste el estado limpio.

## `js/pages/app-bootstrap-page.js`
- Inicializa en `DOMContentLoaded` los módulos de arranque (`MHRDashboardUI` y `MHRRevisionPage`) manteniendo el orden de bootstrap existente.

## `js/pages/revision-basic-ui-page.js`
- Inicializa utilidades base de UI de revisión: visibilidad de turno por tipo de inspección, lock/reset de responsable y mostrar/ocultar + limpieza de paneles `details_*` al activar/desactivar `tipo_*`.

## `js/pages/revision-duplicate-page.js`
- Gestiona controles dinámicos de ítems de revisión (done/update/duplicar/clear), clonación de bloques `details_*`, y expone compatibilidad en `window.mhr` (`duplicateItem`, `counters`, `setupItemControlsFor`).

## `js/pages/revision-item-photos-page.js`
- Gestiona evidencias fotográficas por ítem de revisión: inyección de campos de carga, previews/eliminación de miniaturas y compatibilidad con duplicación dinámica mediante `window.mhr.getItemPhotos`.

## `js/pages/fauna-impact-item-controls-page.js`
- Gestiona controles dinámicos de Fauna Impacto para `fauna_avistamiento` (done/update/duplicar/clear), clonado de bloques `fauna_details_*` e inicialización de clones en carga.
