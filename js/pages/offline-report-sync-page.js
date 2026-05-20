window.MHROfflineReportSyncPage = (function () {
  function init(ctx) {
        /* ── 1. IndexedDB helpers ───────────────────────────────── */
        var DB_NAME    = 'mhr-offline-db';
        var DB_VERSION = 1;
        var STORE_NAME = 'pending-reports';

        function openOfflineDB() {
            return new Promise(function (resolve, reject) {
                var req = indexedDB.open(DB_NAME, DB_VERSION);
                req.onupgradeneeded = function (e) {
                    var db = e.target.result;
                    if (!db.objectStoreNames.contains(STORE_NAME)) {
                        var store = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
                        store.createIndex('synced', 'synced', { unique: false });
                    }
                };
                req.onsuccess  = function (e) { resolve(e.target.result); };
                req.onerror    = function (e) { reject(e.target.error); };
            });
        }

        function savePendingReport(data) {
            return openOfflineDB().then(function (db) {
                return new Promise(function (resolve, reject) {
                    var tx    = db.transaction(STORE_NAME, 'readwrite');
                    var store = tx.objectStore(STORE_NAME);
                    var req   = store.add(Object.assign({ synced: false, timestamp: Date.now() }, data));
                    req.onsuccess = function () { resolve(req.result); };
                    req.onerror   = function () { reject(req.error); };
                });
            });
        }

        function getPendingReports() {
            return openOfflineDB().then(function (db) {
                return new Promise(function (resolve, reject) {
                    var tx    = db.transaction(STORE_NAME, 'readonly');
                    var store = tx.objectStore(STORE_NAME);
                    var index = store.index('synced');
                    var req   = index.getAll(false);
                    req.onsuccess = function () { resolve(req.result); };
                    req.onerror   = function () { reject(req.error); };
                });
            });
        }

        function markReportSynced(id) {
            return openOfflineDB().then(function (db) {
                return new Promise(function (resolve, reject) {
                    var tx     = db.transaction(STORE_NAME, 'readwrite');
                    var store  = tx.objectStore(STORE_NAME);
                    var getReq = store.get(id);
                    getReq.onsuccess = function () {
                        var record = getReq.result;
                        if (record) {
                            record.synced = true;
                            var putReq    = store.put(record);
                            putReq.onsuccess = function () { resolve(); };
                            putReq.onerror   = function () { reject(putReq.error); };
                        } else { resolve(); }
                    };
                    getReq.onerror = function () { reject(getReq.error); };
                });
            });
        }

        /* ── 2. Banner helpers ──────────────────────────────────── */
        function showOfflineBanner(msg, type) {
            var banner = document.getElementById('offline-banner');
            if (!banner) return;
            banner.textContent = msg;
            banner.className   = '';
            banner.classList.add(type || 'offline');
            banner.style.display = 'block';
        }

        function hideOfflineBanner() {
            var banner = document.getElementById('offline-banner');
            if (banner) banner.style.display = 'none';
        }

        window.updatePendingBadge = function () {
            getPendingReports().then(function (list) {
                var badge = document.getElementById('pending-badge');
                if (!badge) return;
                if (list && list.length > 0) {
                    badge.textContent    = list.length + ' reporte' + (list.length > 1 ? 's' : '') + ' pendiente' + (list.length > 1 ? 's' : '');
                    badge.style.display  = 'inline-block';
                } else {
                    badge.style.display  = 'none';
                }
            }).catch(function () {});
        };

        /* ── 3. Colectar estado del formulario ──────────────────── */
        function collectFormState() {
            function pad(n) { return n.toString().padStart(2, '0'); }

            var fechaEl  = document.getElementById('report-date');
            var fecha    = fechaEl ? fechaEl.textContent.replace(/\s*\(.*\)\s*$/, '').trim() : '';

            var autor = '';
            var authorSel = document.getElementById('report-authors-select');
            if (authorSel) {
                var opt = authorSel.options[authorSel.selectedIndex];
                autor   = opt ? (opt.text || opt.value) : authorSel.value;
            }

            var cargo  = '';
            var roleEl = document.getElementById('report-role');
            if (roleEl) {
                var selOpt = roleEl.options[roleEl.selectedIndex];
                cargo = selOpt ? (selOpt.text || selOpt.value) : roleEl.value;
                if (selOpt && (selOpt.value === 'Otro' || (selOpt.text || '').toLowerCase().indexOf('otro') !== -1)) {
                    var other = document.getElementById('report-role-other');
                    if (other && other.value.trim()) cargo = other.value.trim();
                }
            }

            var tipos = Array.prototype.slice.call(document.querySelectorAll('input[name="tipo_inspeccion"]'))
                .filter(function (i) { return i.checked; })
                .map(function (i) {
                    var lbl = document.querySelector('label[for="' + i.id + '"]');
                    return (lbl ? lbl.textContent.trim() : (i.value || '')).trim();
                }).filter(Boolean);
            var tiposText = tipos.length ? tipos.join(', ') : '-';

            var turnoEl   = document.querySelector('input[name="turno"]:checked');
            var turnoText = '-';
            if (turnoEl) {
                var turnoLbl = document.querySelector('label[for="' + turnoEl.id + '"]');
                turnoText    = turnoLbl ? turnoLbl.textContent.trim() : (turnoEl.value || '-');
            }

            var now        = new Date();
            var folio      = now.getUTCFullYear() + pad(now.getUTCMonth() + 1) + pad(now.getUTCDate()) +
                             '-' + pad(now.getUTCHours()) + pad(now.getUTCMinutes()) + pad(now.getUTCSeconds());
            var utcTimeStr = pad(now.getUTCHours()) + ':' + pad(now.getUTCMinutes()) + ':' + pad(now.getUTCSeconds()) + ' UTC';
            var utcDateStr = pad(now.getUTCDate()) + '/' + pad(now.getUTCMonth() + 1) + '/' + now.getUTCFullYear();

            var items  = Array.prototype.slice.call(document.querySelectorAll('input[type="checkbox"][id^="tipo_"]'));
            var filled = [];
            items.forEach(function (chk) {
                if (!chk.checked) return;
                var id   = chk.id;
                var lbl  = document.querySelector('label[for="' + id + '"]');
                var name = lbl ? lbl.textContent.trim() : id;
                var det  = document.getElementById('details_' + id);
                var fields = [];
                if (det) {
                    Array.prototype.slice.call(det.querySelectorAll('input, textarea, select')).forEach(function (el) {
                        var val = '';
                        if (el.type === 'checkbox' || el.type === 'radio') {
                            if (!el.checked) return;
                            val = el.value || 'Seleccionado';
                        } else {
                            val = (el.value || '').toString().trim();
                        }
                        if (val === '') return;
                        var parentLabel = el.closest('label');
                        var key = parentLabel ? (parentLabel.childNodes[0] ? parentLabel.childNodes[0].textContent.trim() : '') : '';
                        if (!key) key = el.name || el.id;
                        try { key = key.replace(/[:：]\s*$/, '').trim(); } catch(e) {}
                        fields.push({ key: key, value: val });
                    });
                }
                filled.push({ id: id, name: name, fields: fields });
            });
            Array.prototype.slice.call(document.querySelectorAll('.dynamic-item-card')).forEach(function (card) {
                var itemId = card.dataset.itemCatalogId;
                if (!itemId) return;
                var title = card.querySelector('.item-card-toggle');
                var name = title ? title.textContent.replace(/^[▼▶]\s*/, '').trim() : itemId;
                var fields = [];
                var lugar = card.querySelector('.dynamic-lugar');
                var hallazgo = card.querySelector('.dynamic-hallazgo');
                var hallazgoOtro = card.querySelector('.dynamic-hallazgo-otro');
                var condicion = card.querySelector('.dynamic-condicion');
                var observaciones = card.querySelector('.dynamic-observaciones');
                var prioridad = card.querySelector('.dynamic-prioridad');
                var codigo = card.querySelector('.dynamic-codigo');
                if (lugar && lugar.value.trim()) fields.push({ key: 'lugar', value: lugar.value.trim() });
                var hallazgoVal = hallazgo ? hallazgo.value : '';
                if (hallazgoVal === 'Otro' && hallazgoOtro && hallazgoOtro.value.trim()) hallazgoVal = hallazgoOtro.value.trim();
                if (hallazgoVal) fields.push({ key: 'hallazgo', value: hallazgoVal });
                if (condicion && condicion.value.trim()) fields.push({ key: 'condicion', value: condicion.value.trim() });
                if (observaciones && observaciones.value.trim()) fields.push({ key: 'observaciones', value: observaciones.value.trim() });
                if (prioridad && prioridad.value.trim()) fields.push({ key: 'prioridad', value: prioridad.value.trim() });
                if (codigo && codigo.value.trim()) fields.push({ key: 'codigo', value: codigo.value.trim() });
                filled.push({ id: itemId, name: name, fields: fields });
            });

            // Fotos: guardar como dataURL para poder re-subirlas al sincronizar
            var photos = {};
            if (window.itemPhotos) {
                Object.keys(window.itemPhotos).forEach(function (itemId) {
                    photos[itemId] = (window.itemPhotos[itemId] || []).map(function (p) {
                        return { dataURL: p.dataURL, name: p.name || ('foto_' + Date.now() + '.jpg') };
                    });
                });
            }

            return {
                folio: folio, fecha: fecha, autor: autor, cargo: cargo, areaRep: areaRep, areaRepName: areaRepName,
                tiposText: tiposText, turnoText: turnoText,
                utcDateStr: utcDateStr, utcTimeStr: utcTimeStr,
                filled: filled, photos: photos
            };
        }

        /* ── 4. Guardar offline ─────────────────────────────────── */
        window.saveFormOffline = function () {
            var data = collectFormState();
            if (!data.filled || data.filled.length === 0) {
                alert('No hay ítems seleccionados para guardar.');
                return;
            }
            savePendingReport(data).then(function () {
                window.updatePendingBadge();
                showOfflineBanner('📥 Sin conexión — reporte guardado localmente (se sincronizará al reconectarse)', 'pending');
                alert('Reporte guardado localmente.\nCuando te conectes a Internet se subirá automáticamente.');
            }).catch(function (err) {
                console.error('Error guardando offline:', err);
                alert('No se pudo guardar localmente: ' + (err && err.message ? err.message : err));
            });
        };

        /* ── 5. Subir un reporte pendiente a Supabase ───────────── */
        async function uploadPendingReport(record) {
            var sc = window.supabaseClient;
            if (!sc) throw new Error('Supabase no inicializado');

            var { data: { session } } = await sc.auth.getSession();
            if (!session) throw new Error('Sin sesión activa');
            var userId = session.user.id;

            // 5a. Insertar en tabla reports (sin PDF — generado después si se necesita)
            var reportPayload = {
                folio:           record.folio,
                fecha_local:     record.fecha,
                fecha_utc:       record.utcDateStr + ' ' + record.utcTimeStr,
                tipo_inspeccion: record.tiposText,
                turno:           record.turnoText,
                responsable:     record.autor,
                cargo:           record.cargo,
                "Area_Representante": record.areaRep,
                "Area_Representante_Nombre": record.areaRepName,
                user_id:         userId,
                pdf_url:         null
            };
            var { data: reportData, error: reportError } = await window.MHRReportService.insertReportSingle(sc, reportPayload);
            
            // Si falla porque las columnas no existen, intentar sin ellas
            if (reportError && reportError.message && (reportError.message.includes('area_representante') || reportError.message.includes('schema'))) {
                console.warn('Reintentando sin columnas area_representante en upload pendiente...', reportError);
                var reportPayloadBasic = {
                    folio:           record.folio,
                    fecha_local:     record.fecha,
                    fecha_utc:       record.utcDateStr + ' ' + record.utcTimeStr,
                    tipo_inspeccion: record.tiposText,
                    turno:           record.turnoText,
                    responsable:     record.autor,
                    cargo:           record.cargo,
                    user_id:         userId,
                    pdf_url:         null
                };
                var result = await window.MHRReportService.insertReportSingle(sc, reportPayloadBasic);
                reportData = result.data;
                reportError = result.error;
            }
            if (reportError) throw reportError;
            var reportId = reportData.id;

            // 5b. Insertar items
            var insertedItems = [];
            var insertedItemsByCatalogId = {};
            var insertedItemsByFormItemKey = {};
            if (record.filled && record.filled.length > 0) {
                var itemsPayload = record.filled.map(function (it, idx) {
                    var lugarVal = '', hallazgoVal = '', condicionVal = '', observacionesVal = '', prioridadVal = '', codigoVal = '';
                    (it.fields || []).forEach(function (ff) {
                        var k = String((ff && ff.key) || '').toLowerCase();
                        var v = ff && ff.value;
                        if (k.includes('lugar')) lugarVal = v;
                        else if (k.includes('hallazgo')) hallazgoVal = v;
                        else if (k.includes('condici')) condicionVal = v;
                        else if (k.includes('observac')) observacionesVal = v;
                        else if (k.includes('prioridad')) prioridadVal = v;
                        else if (k.includes('codigo') || k.includes('seguimiento')) codigoVal = v;
                    });
                    var parsedCatalogId = (it.id && /^[0-9a-fA-F-]{36}$/.test(String(it.id))) ? it.id : null;
                    return {
                        report_id: reportId,
                        item_catalogo_id: parsedCatalogId,
                        item_nombre: it.name || ('Item ' + (idx + 1)),
                        lugar: lugarVal || null,
                        hallazgo: hallazgoVal || null,
                        condicion: condicionVal || null,
                        observaciones: observacionesVal || null,
                        prioridad: prioridadVal || null,
                        codigo_seguimiento: codigoVal || null,
                        orden: idx
                    };
                });
                var itemsResult = await window.MHRReportService.insertReportItems(sc, itemsPayload);
                insertedItems = itemsResult.data || [];
                (record.filled || []).forEach(function (it, idx) {
                    if (insertedItems[idx]) insertedItemsByFormItemKey[String(it.id)] = insertedItems[idx];
                });
                insertedItems.forEach(function (row) {
                    if (row && row.item_catalogo_id) insertedItemsByCatalogId[String(row.item_catalogo_id)] = row;
                });
                var itemsError = itemsResult.error;
                if (itemsError) console.warn('Error insertando items offline:', itemsError);
            }

            // 5c. Subir fotos
            var photos = record.photos || {};
            for (var itemId in photos) {
                var photoList = photos[itemId];
                for (var pi = 0; pi < photoList.length; pi++) {
                    try {
                        var ph      = photoList[pi];
                        var arr     = ph.dataURL.split(',');
                        var mime    = (arr[0].match(/:(.*?);/) || [, 'image/jpeg'])[1];
                        var bstr    = atob(arr[1]);
                        var byteArr = new Uint8Array(bstr.length);
                        for (var bi = 0; bi < bstr.length; bi++) byteArr[bi] = bstr.charCodeAt(bi);
                        var blob     = new Blob([byteArr], { type: mime });
                        var ext      = (ph.name || 'foto.jpg').split('.').pop() || 'jpg';
                        var insertedItem = insertedItemsByFormItemKey[String(itemId)] || insertedItemsByCatalogId[String(itemId)] || null;
                        var itemPathSegment = insertedItem && insertedItem.id ? insertedItem.id : itemId;
                        var fileName = reportId + '/' + itemPathSegment + '_' + Date.now() + '_' + pi + '.' + ext;
                        var { error: upError } = await window.MHRReportService.uploadToBucket(sc, 'report-evidencias', fileName, blob, { upsert: false, contentType: mime });
                        if (upError) { console.warn('Error subiendo foto:', upError); continue; }
                        if (insertedItem && insertedItem.id) {
                            await window.MHRReportService.insertItemPhoto(sc, {
                                report_inspection_item_id: insertedItem.id,
                                bucket: 'report-evidencias',
                                storage_path: fileName,
                                original_filename: ph.name,
                                mime_type: mime,
                                size_bytes: blob.size
                            });
                        }
                    } catch (photoErr) {
                        console.warn('Error procesando foto offline:', photoErr);
                    }
                }
            }

            return reportId;
        }

        /* ── 6. Sincronizar todos los reportes pendientes ───────── */
        window.syncPendingReports = async function () {
            if (!navigator.onLine) return;
            var sc = window.supabaseClient;
            if (!sc) return;
            try {
                var { data: { session } } = await sc.auth.getSession();
                if (!session) return;
            } catch (e) { return; }

            var pending;
            try { pending = await getPendingReports(); } catch (e) { return; }
            if (!pending || pending.length === 0) {
                hideOfflineBanner();
                window.updatePendingBadge();
                return;
            }

            showOfflineBanner('🔄 Sincronizando ' + pending.length + ' reporte(s)…', 'syncing');

            var successCount = 0;
            for (var i = 0; i < pending.length; i++) {
                try {
                    await uploadPendingReport(pending[i]);
                    await markReportSynced(pending[i].id);
                    successCount++;
                } catch (err) {
                    console.error('Error sincronizando reporte id=' + pending[i].id, err);
                }
            }

            window.updatePendingBadge();

            if (successCount === pending.length) {
                showOfflineBanner('✅ ' + successCount + ' reporte(s) sincronizado(s) correctamente', 'synced');
                setTimeout(hideOfflineBanner, 4000);
            } else {
                var failed = pending.length - successCount;
                showOfflineBanner('⚠️ ' + successCount + ' sincronizado(s), ' + failed + ' con error', 'pending');
            }
        };


  }
  return { init: init };
})();
