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
- Persisten funciones legacy de alto acoplamiento DOM que se migrarán en R2/R3.
