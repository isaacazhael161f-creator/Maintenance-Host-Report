/**
 * js/pages/revision-page.js
 * Encapsula la orquestación del envío del formulario de revisión, 
 * validación, interacción con Supabase y renderizado de PDF.
 */
window.MHRRevisionPage = (function () {
    
    function init() {
        var form = document.getElementById('report-form');
        if (!form) return;

        // Bloqueo de selección de pista (una vez elegida se deshabilita hasta pulsar "Cambiar pista")
        (function () {
            var pistaRadios = Array.prototype.slice.call(form.querySelectorAll('input[name="pista"]'));
            var pistaChangeBtn = document.getElementById('pista-change-btn');

            function updatePistaState() {
                try {
                    var checked = pistaRadios.find(function (r) { return r.checked; });
                    if (checked) {
                        pistaRadios.forEach(function (r) {
                            r.disabled = true;
                            var lbl = r.closest('label');
                            if (lbl) lbl.classList.remove('selected');
                        });
                        var lblChecked = checked.closest('label');
                        if (lblChecked) lblChecked.classList.add('selected');
                        if (pistaChangeBtn) pistaChangeBtn.style.display = 'inline-block';
                    } else {
                        pistaRadios.forEach(function (r) {
                            r.disabled = false;
                            var lbl = r.closest('label');
                            if (lbl) lbl.classList.remove('selected');
                        });
                        if (pistaChangeBtn) pistaChangeBtn.style.display = 'none';
                    }
                } catch (e) { }
            }

            pistaRadios.forEach(function (r) {
                r.addEventListener('change', function () { updatePistaState(); });
            });

            if (pistaChangeBtn) {
                pistaChangeBtn.addEventListener('click', function () {
                    pistaRadios.forEach(function (r) { r.disabled = false; r.checked = false; });
                    pistaChangeBtn.style.display = 'none';
                    pistaRadios.forEach(function (r) {
                        var lbl = r.closest('label');
                        if (lbl) lbl.classList.remove('selected');
                    });
                });
            }

            updatePistaState();
        })();

        // Manejar fauna tipo reporte en formulario principal
        (function () {
            var faunaRadios = Array.prototype.slice.call(form.querySelectorAll('input[name="fauna_tipo_reporte_inspeccion"]'));
            function updateFaunaReporteState() {
                try {
                    faunaRadios.forEach(function (r) {
                        var lbl = r.closest('label');
                        if (r.checked && lbl) {
                            lbl.classList.add('selected');
                        } else if (lbl) {
                            lbl.classList.remove('selected');
                        }
                    });
                } catch (e) { }
            }
            faunaRadios.forEach(function (r) {
                r.addEventListener('change', function () { updateFaunaReporteState(); });
            });
            updateFaunaReporteState();
        })();

        // ─── ORQUESTACIÓN DE ENVÍO Y PDF ───
        form.addEventListener('submit', async function (e) {
            e.preventDefault();

            // SOPORTE OFFLINE
            if (!navigator.onLine) {
                if (typeof window.saveFormOffline === 'function') {
                    window.saveFormOffline();
                } else {
                    alert('Sin conexión a Internet. No se pudo guardar el reporte.');
                }
                return;
            }

            var submitBtn = form.querySelector('button[type="submit"]') || form.querySelector('input[type="submit"]');
            var originalBtnText = '';
            if (submitBtn) {
                originalBtnText = submitBtn.textContent || submitBtn.value;
                submitBtn.disabled = true;
                if (submitBtn.tagName === 'BUTTON') submitBtn.textContent = 'Guardando en base de datos...';
                else submitBtn.value = 'Guardando en base de datos...';
            }

            // Recolectar metadatos
            var fecha = document.getElementById('report-date') ? document.getElementById('report-date').textContent : '';
            fecha = fecha.replace(/\s*\(.*\)\s*$/, '').trim();
            
            var autor = '';
            var authorSel = document.getElementById('report-authors-select');
            if (authorSel) { var opt = authorSel.options[authorSel.selectedIndex]; autor = opt ? (opt.text || opt.label || opt.value) : (authorSel.value || ''); }
            
            var cargo = '';
            var roleEl = document.getElementById('report-role');
            if (roleEl) {
                var selOpt = roleEl.options[roleEl.selectedIndex];
                cargo = selOpt ? (selOpt.text || selOpt.label || selOpt.value) : roleEl.value;
                if (selOpt && (selOpt.value === 'Otro' || (selOpt.text || '').toLowerCase().indexOf('otro') !== -1)) {
                    var other = document.getElementById('report-role-other');
                    if (other && other.value.trim()) cargo = other.value.trim();
                }
            }

            var areaRep = '';
            var areaEl = document.getElementById('report-area-rep');
            if (areaEl && areaEl.value && areaEl.value !== 'N/A') {
                areaRep = (areaEl.options[areaEl.selectedIndex] || {}).text || areaEl.value || '';
                if (areaRep === 'N/A') areaRep = '';
            }
            var areaRepName = '';
            var areaRepNameEl = document.getElementById('report-area-rep-name');
            if (areaRepNameEl && areaRep) areaRepName = areaRepNameEl.value.trim();
            
            var afacName = '';
            var afacNameEl = document.getElementById('report-afac-name');
            if (afacNameEl) afacName = afacNameEl.value.trim();

            var tipos = Array.prototype.slice.call(document.querySelectorAll('input[name="tipo_inspeccion"]'))
                .filter(function (i) { return i.checked; })
                .map(function (i) {
                    var lbl = document.querySelector('label[for="' + i.id + '"]');
                    return (lbl ? lbl.textContent.trim() : (i.value || '')).trim();
                }).filter(Boolean);
            var tiposText = tipos.length ? tipos.join(', ') : '-';
            
            var turnoEl = document.querySelector('input[name="turno"]:checked');
            var turnoText = turnoEl ? (document.querySelector('label[for="' + turnoEl.id + '"]') ? document.querySelector('label[for="' + turnoEl.id + '"]').textContent.trim() : (turnoEl.value || '')) : '-';
            
            var pistaEl = document.querySelector('input[name="pista"]:checked');
            var pistaText = pistaEl ? (pistaEl.value || '-') : '-';

            function pad(n) { return n.toString().padStart(2, '0'); }
            var now = new Date();
            var utcTimeStr = pad(now.getUTCHours()) + ':' + pad(now.getUTCMinutes()) + ':' + pad(now.getUTCSeconds()) + ' UTC';
            var utcDateStr = pad(now.getUTCDate()) + '/' + pad(now.getUTCMonth() + 1) + '/' + now.getUTCFullYear();
            var folio = now.getUTCFullYear().toString() + pad(now.getUTCMonth() + 1) + pad(now.getUTCDate()) + '-' + pad(now.getUTCHours()) + pad(now.getUTCMinutes()) + pad(now.getUTCSeconds());

            // Obtener items seleccionados
            var items = Array.prototype.slice.call(document.querySelectorAll('input[type="checkbox"][id^="tipo_"]'));
            var filled = [];
            items.forEach(function (chk) {
                if (!chk.checked) return;
                var id = chk.id;
                var lbl = document.querySelector('label[for="' + id + '"]');
                var name = lbl ? lbl.textContent.trim() : id;
                var det = document.getElementById('details_' + id);
                var fields = [];
                if (det) {
                    Array.prototype.slice.call(det.querySelectorAll('input, textarea, select')).forEach(function (el) {
                        if (!el) return;
                        var val = '';
                        if (el.type === 'checkbox' || el.type === 'radio') { if (!el.checked) return; val = el.value || 'Seleccionado'; }
                        else val = (el.value || '').toString().trim();
                        if (val === '') return;
                        var parentLabel = el.closest('label');
                        var key = '';
                        if (parentLabel) { key = parentLabel.childNodes[0] ? parentLabel.childNodes[0].textContent.trim() : (el.name || el.id); }
                        if (!key) key = el.name || el.id;
                        try { key = key.replace(/[:：]\s*$/, '').trim(); } catch (e) { }
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
                var followupStatus = card.querySelector('.dynamic-followup-status');
                var followupObs = card.querySelector('.dynamic-followup-observaciones');
                var historialJson = card.querySelector('.dynamic-historial-json');
                var prioridad = card.querySelector('.dynamic-prioridad');
                var codigo = card.querySelector('.dynamic-codigo');
                if (lugar && lugar.value.trim()) fields.push({ key: 'lugar', value: lugar.value.trim(), mapImage: lugar.dataset.mapImage || '', mapsUrl: lugar.dataset.mapsUrl || '' });
                var hallazgoVal = hallazgo ? hallazgo.value : '';
                if (hallazgoVal === 'Otro' && hallazgoOtro && hallazgoOtro.value.trim()) hallazgoVal = hallazgoOtro.value.trim();
                if (hallazgoVal) fields.push({ key: 'hallazgo', value: hallazgoVal });
                if (condicion && condicion.value.trim()) fields.push({ key: 'condicion', value: condicion.value.trim() });
                if (observaciones && observaciones.value.trim()) fields.push({ key: 'observaciones', value: observaciones.value.trim() });
                if (followupStatus && followupStatus.value.trim()) fields.push({ key: 'estatus_atencion', value: followupStatus.value.trim() });
                if (followupObs && followupObs.value.trim()) fields.push({ key: 'observaciones_seguimiento', value: followupObs.value.trim() });
                if (historialJson && historialJson.value.trim()) fields.push({ key: 'historial_observaciones_json', value: historialJson.value.trim() });
                if (prioridad && prioridad.value.trim()) fields.push({ key: 'prioridad', value: prioridad.value.trim() });
                if (codigo && codigo.value.trim()) fields.push({ key: 'codigo', value: codigo.value.trim() });
                filled.push({ id: itemId, name: name, fields: fields });
            });

            if (filled.length === 0) {
                alert('No hay items seleccionados para generar el reporte.');
                if(submitBtn) { submitBtn.disabled = false; submitBtn.value = originalBtnText; }
                return;
            }

            // --- Funciones internas de guardado ---
            var saveToSupabase = async function (pdfUrl) {
                try {
                    if (!window.supabaseClient) {
                        alert('Error: No hay conexión con la base de datos.');
                        return null;
                    }
                    var { data: { session } } = await window.supabaseClient.auth.getSession();
                    if (!session) {
                        alert('Atención: No has iniciado sesión. El reporte se generará en PDF pero NO se guardará en la base de datos.');
                        return null;
                    }

                    var reportPayload = {
                        folio: folio, fecha_local: fecha, fecha_utc: utcDateStr + ' ' + utcTimeStr,
                        tipo_inspeccion: tiposText, turno: turnoText, pista: pistaText, responsable: autor,
                        cargo: cargo, "Area_Representante": areaRep, "Area_Representante_Nombre": areaRepName,
                        pdf_url: pdfUrl || null
                    };

                    var { data: reportData, error: reportError } = await window.MHRReportService.insertReport(window.supabaseClient, reportPayload);
                    
                    if (reportError && reportError.message && (reportError.message.includes('area_representante') || reportError.message.includes('schema'))) {
                        var reportPayloadBasic = {
                            folio: folio, fecha_local: fecha, fecha_utc: utcDateStr + ' ' + utcTimeStr,
                            tipo_inspeccion: tiposText, turno: turnoText, pista: pistaText, responsable: autor,
                            cargo: cargo, pdf_url: pdfUrl || null
                        };
                        var result = await window.MHRReportService.insertReport(window.supabaseClient, reportPayloadBasic);
                        reportData = result.data;
                        reportError = result.error;
                    }

                    if (reportError) { alert('Error guardando en base de datos: ' + reportError.message); return null; }
                    var reportId = reportData[0].id;

                    var insertedItems = [];
                    var insertedItemsByCatalogId = {};
                    var insertedItemsByFormItemKey = {};
                    for (var itx = 0; itx < filled.length; itx++) {
                        var f = filled[itx];
                        var lugarVal = '', hallazgoVal = '', condicionVal = '', observacionesVal = '', prioridadVal = '', codigoVal = '';
                        var estatusAtencionVal = '', observacionesSeguimientoVal = '', historialObsJsonVal = '';
                        (f.fields || []).forEach(function (ff) {
                            var k = (ff.key || '').toLowerCase(), v = ff.value;
                            if (k.includes('lugar')) lugarVal = v;
                            else if (k.includes('hallazgo')) hallazgoVal = v;
                            else if (k.includes('condici')) condicionVal = v;
                            else if (k.includes('estatus_atencion')) estatusAtencionVal = v;
                            else if (k.includes('observaciones_seguimiento')) observacionesSeguimientoVal = v;
                            else if (k.includes('historial_observaciones_json')) historialObsJsonVal = v;
                            else if (k === 'observaciones' || k.endsWith('[observaciones]')) observacionesVal = v;
                            else if (k.includes('prioridad')) prioridadVal = v;
                            else if (k.includes('codigo') || k.includes('seguimiento')) codigoVal = v;
                        });
                        if (estatusAtencionVal) {
                            observacionesVal = (observacionesVal ? observacionesVal + '\n' : '') + 'Estatus seguimiento: ' + estatusAtencionVal;
                        }
                        if (observacionesSeguimientoVal) {
                            observacionesVal = (observacionesVal ? observacionesVal + '\n' : '') + 'Observaciones seguimiento: ' + observacionesSeguimientoVal;
                        }
                        if (historialObsJsonVal) {
                            observacionesVal = (observacionesVal ? observacionesVal + '\n' : '') + 'Historial JSON: ' + historialObsJsonVal;
                        }
                        var parsedOrder = parseInt(itx, 10);
                        if (!isFinite(parsedOrder)) parsedOrder = 0;
                        var parsedCatalogId = null;
                        if (f.id && /^[0-9a-fA-F-]{36}$/.test(String(f.id))) parsedCatalogId = f.id;
                        var itemPayload = {
                            report_id: reportId,
                            item_catalogo_id: parsedCatalogId,
                            item_nombre: f.name || ('Item ' + (itx + 1)),
                            lugar: lugarVal || null,
                            hallazgo: hallazgoVal || null,
                            condicion: condicionVal || null,
                            observaciones: observacionesVal || null,
                            prioridad: prioridadVal || null,
                            codigo_seguimiento: codigoVal || null,
                            orden: parsedOrder
                        };
                        var candidates = [itemPayload];
                        var inserted = null, lastErr = null;
                        for (var ci = 0; ci < candidates.length; ci++) {
                            var r = await window.MHRReportService.insertReportItems(window.supabaseClient, [candidates[ci]]);
                            if (!r.error && r.data && r.data.length) { inserted = r.data[0]; break; }
                            lastErr = r.error || lastErr;
                        }
                        if (!inserted) {
                            console.warn('No se pudo guardar item de inspección; se continuará con el flujo del reporte.', {
                                item: f,
                                error: lastErr
                            });
                        } else {
                            insertedItems.push(inserted);
                            insertedItemsByFormItemKey[String(f.id)] = inserted;
                            if (parsedCatalogId) insertedItemsByCatalogId[String(parsedCatalogId)] = inserted;
                        }
                    }

                    // Subir evidencias fotográficas
                    try {
                        var photosToInsert = [];
                        for (var fi = 0; fi < filled.length; fi++) {
                            var f = filled[fi];
                            var photos = (window.mhr && window.mhr.getItemPhotos) ? window.mhr.getItemPhotos(f.id) : [];
                            if (!photos || photos.length === 0) continue;
                            for (var pi = 0; pi < photos.length; pi++) {
                                var photo = photos[pi];
                                try {
                                    var arr = photo.dataURL.split(',');
                                    var mime = (arr[0].match(/:(.*?);/) || [])[1] || 'image/jpeg';
                                    var bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
                                    while (n--) u8arr[n] = bstr.charCodeAt(n);
                                    var photoBlob = new Blob([u8arr], { type: mime });
                                    var ext = mime.split('/')[1] || 'jpg';
                                    var relatedItem = insertedItemsByFormItemKey[String(f.id)] || insertedItemsByCatalogId[String(f.id)] || (insertedItems && insertedItems[fi] ? insertedItems[fi] : null);
                                    var photoFilename = reportId + '/' + (relatedItem ? relatedItem.id : ('item-' + (fi + 1))) + '/' + folio + '_' + pi + '_' + Date.now() + '.' + ext;
                                    var { error: photoUploadErr } = await window.MHRReportService.uploadToBucket(window.supabaseClient, 'report-evidencias', photoFilename, photoBlob, { cacheControl: '3600', upsert: false, contentType: mime });
                                    if (!photoUploadErr) {
                                        var relItemId = relatedItem ? relatedItem.id : null;
                                        if (relItemId) {
                                            photosToInsert.push({
                                                report_inspection_item_id: relItemId,
                                                bucket: 'report-evidencias',
                                                storage_path: photoFilename,
                                                original_filename: photo.name || photoFilename,
                                                mime_type: mime,
                                                size_bytes: photoBlob.size
                                            });
                                        }
                                    }
                                } catch (photoErr) {}
                            }
                        }
                        if (photosToInsert.length > 0) await window.MHRReportService.insertItemPhotosBulk(window.supabaseClient, photosToInsert);

                        // Subir firmas como imágenes para conservarlas en edición/consulta
                        var firmasToUpload = (window.obtenerFirmas && window.obtenerFirmas()) || {};
                        var signatureItemId = (insertedItems[0] && insertedItems[0].id) ? insertedItems[0].id : null;
                        if (!signatureItemId) console.warn('No hay item de inspección para relacionar firmas; se omite guardado de firmas en BD.');
                        var signatureKeys = ['area', 'aifa', 'afac'];
                        for (var si = 0; si < signatureKeys.length; si++) {
                            var sigKey = signatureKeys[si];
                            var sigData = firmasToUpload[sigKey];
                            if (!sigData || typeof sigData !== 'string' || sigData.indexOf('data:image/') !== 0) continue;
                            try {
                                var sigArr = sigData.split(',');
                                var sigMime = (sigArr[0].match(/:(.*?);/) || [])[1] || 'image/png';
                                var sigBstr = atob(sigArr[1]), sigN = sigBstr.length, sigU8 = new Uint8Array(sigN);
                                while (sigN--) sigU8[sigN] = sigBstr.charCodeAt(sigN);
                                var sigBlob = new Blob([sigU8], { type: sigMime });
                                var sigExt = sigMime.split('/')[1] || 'png';
                                var sigPath = reportId + '/signatures/' + sigKey + '_' + Date.now() + '.' + sigExt;
                                var upSig = await window.MHRReportService.uploadToBucket(window.supabaseClient, 'report-evidencias', sigPath, sigBlob, { cacheControl: '3600', upsert: false, contentType: sigMime });
                                if (!upSig.error && signatureItemId) {
                                    await window.MHRReportService.insertItemPhoto(window.supabaseClient, {
                                        report_inspection_item_id: signatureItemId,
                                        bucket: 'report-evidencias',
                                        storage_path: sigPath,
                                        original_filename: 'firma_' + sigKey + '.' + sigExt,
                                        mime_type: sigMime,
                                        size_bytes: sigBlob.size
                                    });
                                }
                            } catch (sigErr) {}
                        }
                    } catch (allPhotosErr) { console.warn('Error general en subida de evidencias:', allPhotosErr); }

                    return reportId;
                } catch (e) {
                    alert('Error inesperado al guardar en base de datos: ' + e.message);
                    return null;
                }
            };

            var uploadPdfToSupabase = async function (blob, folio) {
                try {
                    if (!window.supabaseClient) return null;
                    var { data: { session } } = await window.supabaseClient.auth.getSession();
                    if (!session) return null;
                    var filename = 'report_' + folio + '_' + new Date().getTime() + '.pdf';
                    var { error } = await window.MHRReportService.uploadToBucket(window.supabaseClient, 'reports', filename, blob, { cacheControl: '3600', upsert: false });
                    if (error) { console.error('Error subiendo PDF:', error); return null; }
                    return filename;
                } catch (e) { return null; }
            };

            // --- Generación HTML para PDF ---
            var container = document.getElementById('report-summary');
            var html = '<div style="font-family:Arial,Helvetica,sans-serif;color:#0f1724;">';
            function escapeHtml(str) {
                try {
                    return str.toString()
                        .replace(/&/g, '&amp;')
                        .replace(/</g, '&lt;')
                        .replace(/>/g, '&gt;')
                        .replace(/"/g, '&quot;')
                        .replace(/'/g, '&#39;');
                } catch (e) {
                    return '' + str;
                }
            }
            
            function buildLugarHtml(f, lugarVal) {
                if (!lugarVal) return '<span style="color:#9ca3af">-</span>';
                var h = '<div style="font-size:11px;font-weight:600;margin-bottom:4px;">' + escapeHtml(lugarVal) + '</div>';
                try {
                    var placeField = null;
                    if (f.fields && f.fields.length) {
                        for (var i = 0; i < f.fields.length; i++) {
                            var fld = f.fields[i];
                            if (fld && fld.key && /^lugar$/i.test(String(fld.key))) { placeField = fld; break; }
                        }
                    }
                    var mapImage = placeField ? placeField.mapImage : '';
                    var mapsUrl = placeField ? placeField.mapsUrl : '';
                    if (mapImage) {
                        h += '<div style="position:relative;width:100%;"><img src="' + mapImage + '" style="width:100%;max-height:88px;border-radius:4px;display:block;object-fit:cover;border:1px solid #e6eef9;"><div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:18px;filter:drop-shadow(0 1px 3px rgba(0,0,0,0.7));">\uD83D\uDCCD</div></div>';
                    }
                    if (mapsUrl) h += '<div style="font-size:9px;color:#0055a5;margin-top:3px;word-break:break-all;">' + escapeHtml(mapsUrl) + '</div>';
                } catch (ex) { }
                return h;
            }

            var logoSrc = window.logoBase64 || '';
            var inlineLogo = '<svg xmlns="http://www.w3.org/2000/svg" width="240" height="90" viewBox="0 0 240 90"><rect width="100%" height="100%" fill="#007acc" rx="8" /><g transform="translate(16,15)"><circle cx="30" cy="30" r="24" fill="#fff" /><text x="30" y="36" font-family="Arial, sans-serif" font-size="18" fill="#007acc" font-weight="bold" text-anchor="middle">LOGO</text></g><text x="130" y="46" font-family="Arial, sans-serif" font-size="24" fill="#ffffff">Nombre Empresa</text></svg>';

            var membreteLines = [];
            try {
                document.querySelectorAll('.report-header .meta > div').forEach(function (d) {
                    if (d.querySelector && d.querySelector('#report-date')) return;
                    if (d.querySelector && d.querySelector('button')) return;
                    var txt = d.textContent.trim(); if (txt) membreteLines.push(txt);
                });
            } catch (e) { }

            html += '<div style="display:flex;justify-content:space-between;align-items:center;">';
            html += '<div style="min-width:180px;">';
            if (membreteLines.length) { html += '<div style="font-size:12px;color:#1f2937;line-height:1.1">'; membreteLines.forEach(function (line) { html += '<div>' + line + '</div>'; }); html += '</div>'; }
            html += '</div><div style="flex:1;text-align:center;padding:0 12px">';
            if (logoSrc) { html += '<img src="' + logoSrc + '" style="height:120px;display:block;margin:0 auto 6px">'; } else { html += inlineLogo; }
            html += '<h2 style="color:#0b66c3;margin:0;font-size:20px;">Reporte de Inspección en Área de Movimiento y Maniobras</h2>';
            html += '<div style="margin-top:6px;font-size:14px;color:#111;font-weight:700;">RWY: ' + (pistaText || '-') + '</div></div>';
            html += '<div style="text-align:right;color:#6b7280;font-size:12px;min-width:120px"><div><strong>' + utcTimeStr + '</strong></div><div style="font-size:12px;color:#6b7280;margin-top:6px">' + utcDateStr + '</div><div style="margin-top:8px;color:#374151;font-weight:600">Folio: ' + (folio || '') + '</div></div></div>';

            html += '<div style="display:flex;justify-content:center;gap:18px;flex-wrap:wrap;margin-top:12px;align-items:center">';
            var sep = '<div style="width:1px;height:28px;background:#e6eef9;margin:0 8px;display:inline-block;vertical-align:middle"></div>';
            html += '<div style="min-width:140px;text-align:center;font-size:13px;color:#374151">Tipo de Inspección<br><strong>' + (tiposText || '-') + '</strong></div>' + sep +
                    '<div style="min-width:120px;text-align:center;font-size:13px;color:#374151">Turno<br><strong>' + (turnoText || '-') + '</strong></div>' + sep +
                    '<div style="min-width:140px;text-align:center;font-size:13px;color:#374151">Pista<br><strong>' + (pistaText || '-') + '</strong></div>' + sep +
                    '<div style="min-width:140px;text-align:center;font-size:13px;color:#374151">Responsable<br><strong>' + (autor || '-') + '</strong></div>' + sep +
                    '<div style="min-width:140px;text-align:center;font-size:13px;color:#374151">Cargo<br><strong>' + (cargo || '-') + '</strong></div>' + sep +
                    '<div style="min-width:160px;text-align:center;font-size:13px;color:#374151">Representante de Área<br><strong>' + (areaRep || '-') + (areaRepName ? '<br>' + areaRepName : '') + '</strong></div>' + sep +
                    '<div style="min-width:120px;text-align:center;font-size:13px;color:#374151">Fecha<br><strong>' + fecha + '</strong></div></div>';
            html += '<hr style="border:none;border-top:1px solid #e6eef9;margin:12px 0">';
            
            html += '<table style="width:100%;border-collapse:collapse;font-size:13px;"><thead><tr><th style="text-align:left;padding:8px;border-bottom:1px solid #e6eef9;width:24%">Item</th><th style="text-align:left;padding:8px;border-bottom:1px solid #e6eef9;width:36%">Información</th><th style="text-align:left;padding:8px;border-bottom:1px solid #e6eef9;width:20%">Observaciones</th><th style="text-align:left;padding:8px;border-bottom:1px solid #e6eef9;width:20%">Lugar</th></tr></thead><tbody>';
            function buildObservacionesPdf(observacionesRaw) {
                var raw = (observacionesRaw || '').toString();
                if (!raw.trim()) return '';
                var lines = raw.split('\n');
                var visibleLines = [];
                var historySummary = '';
                lines.forEach(function (ln) {
                    if (/^\s*Historial JSON:\s*/i.test(ln)) {
                        var jsonPart = ln.replace(/^\s*Historial JSON:\s*/i, '').trim();
                        try {
                            var parsed = JSON.parse(jsonPart);
                            if (Array.isArray(parsed) && parsed.length) {
                                var last = parsed[parsed.length - 1] || {};
                                historySummary = 'Seguimiento: ' + (last.estado || 'N/A') + ' | ' + (last.usuario || 'N/A') + ' | ' + (last.fecha_utc || 'N/A');
                            }
                        } catch (e) { }
                        return;
                    }
                    visibleLines.push(ln);
                });
                if (historySummary) visibleLines.push(historySummary);
                return visibleLines.join('\n').trim();
            }
            filled.forEach(function (f) {
                var infoHtml = '', observacionesVal = '', lugarVal = '';
                if (f.fields && f.fields.length) {
                    var prioColor = { '1': '#28a745', '2': '#ffc107', '3': '#ff8c00' }, condColor = { 'Satisfactorio': '#28a745', 'No Satisfactorio': '#dc3545', 'N/A': '#6c757d' };
                    infoHtml = '<ul style="margin:6px 0 6px 16px;padding:0;">';
                    f.fields.forEach(function (ff) {
                        var key = (ff.key || '').toString(), val = (ff.value || '').toString();
                        if (/historial_observaciones_json/i.test(key)) { return; }
                        if (/observaciones_seguimiento/i.test(key)) { return; }
                        if (/^observaciones$/i.test(key)) { observacionesVal = val; return; }
                        if (/^lugar$/i.test(key)) { lugarVal = val; return; }
                        var dot = '';
                        if (/prioridad/i.test(key) && prioColor[val]) dot = '<span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:' + prioColor[val] + ';margin-left:8px;vertical-align:middle;"></span>';
                        else if (/condici/i.test(key) && condColor[val]) dot = '<span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:' + condColor[val] + ';margin-left:8px;vertical-align:middle;"></span>';
                        infoHtml += '<li style="margin-bottom:4px;">' + key + ': ' + val + (dot ? ' ' + dot : '') + '</li>';
                    });
                    infoHtml += '</ul>';
                } else { infoHtml = '<span class="muted">Sin campos adicionales</span>'; }
                var observacionesPdf = buildObservacionesPdf(observacionesVal);
                var itemNamePdf = (f.name || '').toString().replace(/\s{2,}/g, ' ').trim();
                html += '<tr><td style="vertical-align:top;padding:10px;border-bottom:1px solid #f0f6ff;font-weight:600;line-height:1.25;white-space:normal;word-break:break-word;overflow-wrap:anywhere;">' + escapeHtml(itemNamePdf || '-') + '</td><td style="vertical-align:top;padding:10px;border-bottom:1px solid #f0f6ff;line-height:1.3;word-break:break-word;overflow-wrap:anywhere;">' + infoHtml + '</td><td style="vertical-align:top;padding:10px;border-bottom:1px solid #f0f6ff">' + (observacionesPdf ? ('<div style="white-space:pre-wrap;word-break:break-word;overflow-wrap:anywhere;line-height:1.3;">' + escapeHtml(observacionesPdf) + '</div>') : '<span class="muted">-</span>') + '</td><td style="vertical-align:top;padding:10px;border-bottom:1px solid #f0f6ff;line-height:1.25;word-break:break-word;overflow-wrap:anywhere;">' + buildLugarHtml(f, lugarVal) + '</td></tr>';
            });
            html += '</tbody></table>';

            var firmas = (window.obtenerFirmas && window.obtenerFirmas()) || {};
            html += '<div style="display:flex;justify-content:space-around;gap:24px;margin-top:22px">';
            if (areaRep && areaRepName) {
                // Firmas Area / AIFA / AFAC
                html += `<div style="flex:1;border:1px solid #e6eef9;padding:14px;border-radius:6px;min-height:120px;display:flex;flex-direction:column;justify-content:space-between"><div style="font-size:13px;color:#17325a;text-align:center;font-weight:700">${areaRep || 'Área'}</div><div>${firmas.area ? `<div style="height:40px;margin:4px 0;display:flex;align-items:center;justify-content:center"><img src="${firmas.area}" style="max-height:50px;max-width:100%;object-fit:contain;"></div>` : `<div style="border-top:1px solid #cbdcec;margin-bottom:6px;padding-top:4px;text-align:center;color:#17325a">Firma</div>`}<div style="font-size:12px;color:#374151;text-align:center;font-weight:600">${areaRepName || '-'}</div></div></div>`;
                html += `<div style="flex:1;border:1px solid #e6eef9;padding:14px;border-radius:6px;min-height:120px;display:flex;flex-direction:column;justify-content:space-between"><div style="font-size:13px;color:#17325a;text-align:center;font-weight:700">AIFA</div><div>${firmas.aifa ? `<div style="height:40px;margin:4px 0;display:flex;align-items:center;justify-content:center"><img src="${firmas.aifa}" style="max-height:50px;max-width:100%;object-fit:contain;"></div>` : `<div style="border-top:1px solid #cbdcec;margin-bottom:6px;padding-top:4px;text-align:center;color:#17325a">Firma</div>`}<div style="font-size:12px;color:#374151;text-align:center;font-weight:600">${autor || '-'}</div><div style="font-size:11px;color:#6b7280;text-align:center">${cargo || '-'}</div></div></div>`;
                html += `<div style="flex:1;border:1px solid #e6eef9;padding:14px;border-radius:6px;min-height:120px;display:flex;flex-direction:column;justify-content:space-between"><div style="font-size:13px;color:#17325a;text-align:center;font-weight:700">AFAC</div><div>${firmas.afac ? `<div style="height:40px;margin:4px 0;display:flex;align-items:center;justify-content:center"><img src="${firmas.afac}" style="max-height:50px;max-width:100%;object-fit:contain;"></div>` : `<div style="border-top:1px solid #cbdcec;margin-top:10px;padding-top:8px;text-align:center;color:#17325a">Firma</div>`}<div style="font-size:12px;color:#374151;text-align:center;font-weight:600">${afacName || '-'}</div></div></div>`;
            } else {
                // Firmas AFAC / AIFA
                html += `<div style="flex:1;border:1px solid #e6eef9;padding:14px;border-radius:6px;min-height:120px;display:flex;flex-direction:column;justify-content:space-between"><div style="font-size:13px;color:#17325a;text-align:center;font-weight:700">AFAC</div><div>${firmas.afac ? `<div style="height:40px;margin:4px 0;display:flex;align-items:center;justify-content:center"><img src="${firmas.afac}" style="max-height:50px;max-width:100%;object-fit:contain;"></div>` : `<div style="border-top:1px solid #cbdcec;margin-top:10px;padding-top:8px;text-align:center;color:#17325a">Firma</div>`}<div style="font-size:12px;color:#374151;text-align:center;font-weight:600">${afacName || '-'}</div></div></div>`;
                html += `<div style="flex:1.2;border:1px solid #e6eef9;padding:14px;border-radius:6px;min-height:120px;display:flex;flex-direction:column;justify-content:space-between"><div style="font-size:13px;color:#17325a;text-align:center;font-weight:700">AIFA</div><div>${firmas.aifa ? `<div style="height:40px;margin:4px 0;display:flex;align-items:center;justify-content:center"><img src="${firmas.aifa}" style="max-height:50px;max-width:100%;object-fit:contain;"></div>` : `<div style="border-top:1px solid #cbdcec;margin-bottom:6px;padding-top:4px;text-align:center;color:#17325a">Firma</div>`}<div style="font-size:12px;color:#374151;text-align:center;font-weight:600">${autor || '-'}</div><div style="font-size:11px;color:#6b7280;text-align:center">${cargo || '-'}</div></div></div>`;
            }
            html += '</div><p style="margin-top:18px;font-size:12px;color:#6b7280">Generado desde el formulario interno.</p></div>';

                        var fnameDate = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
            var filename = 'Reporte-' + fnameDate + '.pdf';

            if (!window.MHRPdfRenderer || typeof window.MHRPdfRenderer.renderRevisionPdf !== 'function') {
                alert('Error al generar PDF: renderer no disponible.');
                if (submitBtn) {
                    submitBtn.disabled = false;
                    if (submitBtn.tagName === 'BUTTON') submitBtn.textContent = originalBtnText;
                    else submitBtn.value = originalBtnText;
                }
                return;
            }

            window.MHRPdfRenderer.renderRevisionPdf({
                container: container,
                html: html,
                filename: filename,
                submitBtn: submitBtn,
                originalBtnText: originalBtnText,
                onBlobReady: async function (blob) {
                    var pdfUrl = await uploadPdfToSupabase(blob, folio);
                    if (submitBtn) {
                        if (submitBtn.tagName === 'BUTTON') submitBtn.textContent = 'Guardando datos...';
                        else submitBtn.value = 'Guardando datos...';
                    }
                    await saveToSupabase(pdfUrl);
                    try {
                        var clearAllBtn = document.getElementById('clear-all-btn');
                        if (clearAllBtn) clearAllBtn.click();
                    } catch (clearErr) { console.warn('No se pudo limpiar formulario automáticamente:', clearErr); }
                }
            });;
        });
    }

    return { init: init };
})();
