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

            var notasGenerales = '';
            var notasEl = document.getElementById('report-notas-generales');
            if (notasEl) notasGenerales = notasEl.value.trim();

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
                var prioridad = card.querySelector('.dynamic-prioridad');
                var codigo = card.querySelector('.dynamic-codigo');
                var followupStatus = card.querySelector('.dynamic-followup-status');
                var followupObs = card.querySelector('.dynamic-followup-observaciones');
                if (lugar && lugar.value.trim()) fields.push({ key: 'lugar', value: lugar.value.trim(), mapImage: lugar.dataset.mapImage || '', mapsUrl: lugar.dataset.mapsUrl || '' });
                var hallazgoVal = hallazgo ? hallazgo.value : '';
                if (hallazgoVal === 'Otro' && hallazgoOtro && hallazgoOtro.value.trim()) hallazgoVal = hallazgoOtro.value.trim();
                if (hallazgoVal) fields.push({ key: 'hallazgo', value: hallazgoVal });
                if (condicion && condicion.value.trim()) fields.push({ key: 'condicion', value: condicion.value.trim() });
                if (observaciones && observaciones.value.trim()) fields.push({ key: 'observaciones', value: observaciones.value.trim() });
                if (prioridad && prioridad.value.trim()) fields.push({ key: 'prioridad', value: prioridad.value.trim() });
                if (codigo && codigo.value.trim()) fields.push({ key: 'codigo', value: codigo.value.trim() });
                if (followupStatus && followupStatus.value.trim()) fields.push({ key: 'followup_status', value: followupStatus.value.trim() });
                if (followupObs && followupObs.value.trim()) fields.push({ key: 'followup_observaciones', value: followupObs.value.trim() });
                filled.push({ id: itemId, name: name, fields: fields, followupStatus: followupStatus ? followupStatus.value : '', followupObs: followupObs ? followupObs.value : '' });
            });

            if (filled.length === 0) {
                alert('No hay items seleccionados para generar el reporte.');
                if(submitBtn) { submitBtn.disabled = false; submitBtn.value = originalBtnText; }
                return;
            }

            // Validar que cada ítem de seguimiento (del reporte anterior) tenga nueva evidencia fotográfica
            var prefilledCards = Array.prototype.slice.call(document.querySelectorAll('.dynamic-item-card[data-prefilled="1"]'));
            var missingPhotoItems = [];
            prefilledCards.forEach(function (card) {
                var itemId = card.dataset.itemCatalogId;
                var photos = (window.itemPhotos && window.itemPhotos[itemId]) ? window.itemPhotos[itemId] : [];
                if (photos.length === 0) {
                    var titleBtn = card.querySelector('.item-card-toggle');
                    var name = titleBtn ? titleBtn.textContent.replace(/^[▼▶]\s*/, '').trim() : itemId;
                    missingPhotoItems.push(name);
                }
            });
            if (missingPhotoItems.length > 0) {
                alert('Los siguientes ítems de seguimiento requieren nueva evidencia fotográfica:\n\n• ' + missingPhotoItems.join('\n• ') + '\n\nAdjunta al menos una foto nueva a cada ítem antes de continuar.');
                if (submitBtn) {
                    submitBtn.disabled = false;
                    if (submitBtn.tagName === 'BUTTON') submitBtn.textContent = originalBtnText;
                    else submitBtn.value = originalBtnText;
                }
                return;
            }

            // Helper: generar miniatura base64 para almacenar en datos_extra sin depender de storage
            function makeThumb(dataURL) {
                return new Promise(function (resolve) {
                    try {
                        var img = new Image();
                        img.onload = function () {
                            var MAX = 600;
                            var scale = Math.min(MAX / img.width, MAX / img.height, 1);
                            var canvas = document.createElement('canvas');
                            canvas.width = Math.max(1, Math.round(img.width * scale));
                            canvas.height = Math.max(1, Math.round(img.height * scale));
                            canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
                            resolve(canvas.toDataURL('image/jpeg', 0.80));
                        };
                        img.onerror = function () { resolve(null); };
                        img.src = dataURL;
                    } catch (e) { resolve(null); }
                });
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
                        notas_generales: notasGenerales || null,
                        pdf_url: pdfUrl || null
                    };

                    var { data: reportData, error: reportError } = await window.MHRReportService.insertReport(window.supabaseClient, reportPayload);
                    
                    if (reportError) {
                        var _errMsg = (reportError.message || '').toLowerCase();
                        if (_errMsg.includes('area_representante') || _errMsg.includes('schema') || _errMsg.includes('does not exist') || _errMsg.includes('column') || _errMsg.includes('unknown')) {
                            var reportPayloadBasic = {
                                folio: folio, fecha_local: fecha, fecha_utc: utcDateStr + ' ' + utcTimeStr,
                                tipo_inspeccion: tiposText, turno: turnoText, pista: pistaText, responsable: autor,
                                cargo: cargo, pdf_url: pdfUrl || null
                            };
                            var result = await window.MHRReportService.insertReport(window.supabaseClient, reportPayloadBasic);
                            reportData = result.data;
                            reportError = result.error;
                        }
                    }

                    if (reportError) { alert('Error guardando en base de datos: ' + reportError.message); return null; }
                    var reportId = reportData[0].id;

                    // Insertar todos los items en paralelo
                    var insertedItems = [];
                    var insertedItemsByCatalogId = {};
                    var insertedItemsByFormItemKey = {};

                    var itemInsertResults = await Promise.all(filled.map(async function (f, itx) {
                        var lugarVal = '', hallazgoVal = '', condicionVal = '', observacionesVal = '', prioridadVal = '', codigoVal = '';
                        (f.fields || []).forEach(function (ff) {
                            var k = (ff.key || '').toLowerCase(), v = ff.value;
                            if (k.includes('lugar')) lugarVal = v;
                            else if (k.includes('hallazgo')) hallazgoVal = v;
                            else if (k.includes('condici')) condicionVal = v;
                            else if (k.includes('observac')) observacionesVal = v;
                            else if (k.includes('prioridad')) prioridadVal = v;
                            else if (k.includes('codigo') || k.includes('seguimiento')) codigoVal = v;
                        });
                        var parsedCatalogId = (f.id && /^[0-9a-fA-F-]{36}$/.test(String(f.id))) ? f.id : null;
                        var datosExtra = {};
                        if (f.followupStatus) datosExtra.followup_status = f.followupStatus;
                        if (f.followupObs) datosExtra.followup_observaciones = f.followupObs;
                        // Generar miniaturas y almacenarlas en datos_extra para que el
                        // siguiente ciclo las muestre sin necesitar acceso a storage
                        var fPhotos = (window.mhr && window.mhr.getItemPhotos)
                            ? window.mhr.getItemPhotos(f.id)
                            : ((window.itemPhotos && window.itemPhotos[f.id]) || []);
                        if (fPhotos.length > 0) {
                            var thumbArr = await Promise.all(fPhotos.slice(0, 5).map(function (ph) {
                                return makeThumb(ph.dataURL).then(function (t) {
                                    return t ? { dataURL: t, name: ph.name || 'foto' } : null;
                                });
                            }));
                            var validThumbs = thumbArr.filter(Boolean);
                            if (validThumbs.length > 0) datosExtra.thumbs = validThumbs;
                        }
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
                            orden: itx,
                            datos_extra: Object.keys(datosExtra).length > 0 ? datosExtra : null
                        };
                        return window.MHRReportService.insertReportItems(window.supabaseClient, [itemPayload])
                            .then(function (r) {
                                if (!r.error && r.data && r.data.length) return { f: f, inserted: r.data[0], catalogId: parsedCatalogId };
                                console.warn('No se pudo guardar item de inspección:', { item: f, error: r.error });
                                return { f: f, inserted: null, catalogId: parsedCatalogId };
                            })
                            .catch(function (err) {
                                console.warn('Error al insertar item:', err);
                                return { f: f, inserted: null, catalogId: parsedCatalogId };
                            });
                    }));

                    itemInsertResults.forEach(function (res) {
                        if (res.inserted) {
                            insertedItems.push(res.inserted);
                            insertedItemsByFormItemKey[String(res.f.id)] = res.inserted;
                            if (res.catalogId) insertedItemsByCatalogId[String(res.catalogId)] = res.inserted;
                        }
                    });

                    // Subir evidencias fotográficas en paralelo
                    try {
                        // Preparar todas las subidas de fotos como promesas simultáneas
                        var photoUploadTasks = [];
                        filled.forEach(function (f, fi) {
                            var photos = (window.mhr && window.mhr.getItemPhotos) ? window.mhr.getItemPhotos(f.id) : [];
                            if (!photos || photos.length === 0) return;
                            var relatedItem = insertedItemsByFormItemKey[String(f.id)] || insertedItemsByCatalogId[String(f.id)] || (insertedItems[fi] || null);
                            photos.forEach(function (photo, pi) {
                                photoUploadTasks.push((function (f, fi, photo, pi, relatedItem) {
                                    return Promise.resolve().then(function () {
                                        var arr = photo.dataURL.split(',');
                                        var mime = (arr[0].match(/:(.*?);/) || [])[1] || 'image/jpeg';
                                        var bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
                                        while (n--) u8arr[n] = bstr.charCodeAt(n);
                                        var photoBlob = new Blob([u8arr], { type: mime });
                                        var ext = mime.split('/')[1] || 'jpg';
                                        var photoFilename = reportId + '/' + (relatedItem ? relatedItem.id : ('item-' + (fi + 1))) + '/' + folio + '_' + pi + '_' + Date.now() + '.' + ext;
                                        return window.MHRReportService.uploadToBucket(window.supabaseClient, 'report-evidencias', photoFilename, photoBlob, { cacheControl: '3600', upsert: false, contentType: mime })
                                            .then(function (upRes) {
                                                if (!upRes.error && relatedItem && relatedItem.id) {
                                                    return { report_inspection_item_id: relatedItem.id, bucket: 'report-evidencias', storage_path: photoFilename, original_filename: photo.name || photoFilename, mime_type: mime, size_bytes: photoBlob.size };
                                                }
                                                return null;
                                            });
                                    }).catch(function () { return null; });
                                })(f, fi, photo, pi, relatedItem));
                            });
                        });

                        var photoResults = await Promise.allSettled(photoUploadTasks);
                        var photosToInsert = photoResults
                            .filter(function (r) { return r.status === 'fulfilled' && r.value; })
                            .map(function (r) { return r.value; });
                        if (photosToInsert.length > 0) await window.MHRReportService.insertItemPhotosBulk(window.supabaseClient, photosToInsert);

                        // Subir firmas en paralelo
                        var firmasToUpload = (window.obtenerFirmas && window.obtenerFirmas()) || {};
                        var signatureItemId = (insertedItems[0] && insertedItems[0].id) ? insertedItems[0].id : null;
                        if (!signatureItemId) console.warn('No hay item de inspección para relacionar firmas; se omite guardado de firmas en BD.');
                        var signatureKeys = ['area', 'aifa', 'afac'];
                        var sigTasks = signatureKeys.map(function (sigKey) {
                            var sigData = firmasToUpload[sigKey];
                            if (!sigData || typeof sigData !== 'string' || sigData.indexOf('data:image/') !== 0) return Promise.resolve();
                            return Promise.resolve().then(function () {
                                var sigArr = sigData.split(',');
                                var sigMime = (sigArr[0].match(/:(.*?);/) || [])[1] || 'image/png';
                                var sigBstr = atob(sigArr[1]), sigN = sigBstr.length, sigU8 = new Uint8Array(sigN);
                                while (sigN--) sigU8[sigN] = sigBstr.charCodeAt(sigN);
                                var sigBlob = new Blob([sigU8], { type: sigMime });
                                var sigExt = sigMime.split('/')[1] || 'png';
                                var sigPath = reportId + '/signatures/' + sigKey + '_' + Date.now() + '.' + sigExt;
                                return window.MHRReportService.uploadToBucket(window.supabaseClient, 'report-evidencias', sigPath, sigBlob, { cacheControl: '3600', upsert: false, contentType: sigMime })
                                    .then(function (upSig) {
                                        if (!upSig.error && signatureItemId) {
                                            return window.MHRReportService.insertItemPhoto(window.supabaseClient, { report_inspection_item_id: signatureItemId, bucket: 'report-evidencias', storage_path: sigPath, original_filename: 'firma_' + sigKey + '.' + sigExt, mime_type: sigMime, size_bytes: sigBlob.size });
                                        }
                                    });
                            }).catch(function (sigErr) { console.warn('Error al subir firma ' + sigKey + ':', sigErr); });
                        });
                        await Promise.allSettled(sigTasks);
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
                    var publicResp = window.MHRReportService.getPublicUrl(window.supabaseClient, 'reports', filename);
                    return (publicResp && publicResp.data && publicResp.data.publicUrl) ? publicResp.data.publicUrl : filename;
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

            html += '<table style="width:100%;border-collapse:collapse;margin-bottom:6px;"><tbody><tr>';
            html += '<td style="width:190px;vertical-align:top;padding-right:10px;">';
            if (membreteLines.length) {
                var membreteStyles = [
                    'font-size:14px;font-weight:700;color:#0f1724;margin-bottom:3px;',
                    'font-size:12px;font-weight:700;color:#374151;margin-bottom:2px;',
                    'font-size:12px;font-weight:700;color:#374151;margin-bottom:2px;',
                    'font-size:10px;font-weight:400;color:#6b7280;margin-top:5px;letter-spacing:0.3px;'
                ];
                html += '<div style="line-height:1.45">';
                membreteLines.forEach(function (line, i) {
                    var s = membreteStyles[i] || 'font-size:11px;font-weight:600;color:#374151;';
                    html += '<div style="' + s + '">' + line + '</div>';
                });
                html += '</div>';
            }
            html += '</td>';
            html += '<td style="text-align:center;vertical-align:middle;padding:0 12px;">';
            if (logoSrc) { html += '<img src="' + logoSrc + '" style="height:80px;display:block;margin:0 auto 6px">'; } else { html += inlineLogo; }
            html += '<h2 style="color:#0b66c3;margin:4px 0 0 0;font-size:18px;">Reporte de Inspección en Área de Movimiento y Maniobras</h2>';
            html += '<div style="margin-top:4px;font-size:13px;color:#111;font-weight:700;">RWY: ' + (pistaText || '-') + '</div>';
            html += '</td>';
            html += '<td style="width:160px;text-align:right;vertical-align:top;font-size:12px;color:#6b7280;white-space:nowrap;">';
            html += '<div><strong>' + utcTimeStr + '</strong></div>';
            html += '<div style="margin-top:4px;">' + utcDateStr + '</div>';
            html += '<div style="margin-top:6px;color:#374151;font-weight:600;white-space:nowrap;">Folio: ' + (folio || '') + '</div>';
            html += '</td></tr></tbody></table>';

            var mc  = 'vertical-align:top;text-align:center;padding:7px 5px;border-right:1px solid #e0e0e0;';
            var mcL = 'vertical-align:top;text-align:center;padding:7px 5px;';
            var metaLabel = 'style="display:block;font-size:8px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:3px;"';
            var metaValue = 'style="display:block;font-size:11px;color:#0f1724;font-weight:700;"';
            var metaValueNowrap = 'style="display:block;font-size:11px;color:#0f1724;font-weight:700;white-space:nowrap;"';
            html += '<table style="width:100%;border-collapse:collapse;margin-top:8px;border:1px solid #e0e0e0;table-layout:fixed;">';
            html += '<tbody><tr>';
            html += '<td style="' + mc  + 'width:11%;"><span ' + metaLabel + '>Tipo de Inspecci\u00f3n</span><span ' + metaValue + '>' + (tiposText || '-') + '</span></td>';
            html += '<td style="' + mc  + 'width:8%;"><span ' + metaLabel + '>Turno</span><span ' + metaValue + '>' + (turnoText || '-') + '</span></td>';
            html += '<td style="' + mc  + 'width:10%;"><span ' + metaLabel + '>Pista</span><span ' + metaValueNowrap + '>' + (pistaText || '-') + '</span></td>';
            html += '<td style="' + mc  + 'width:17%;"><span ' + metaLabel + '>Responsable</span><span ' + metaValue + '>' + (autor || '-') + '</span></td>';
            html += '<td style="' + mc  + 'width:17%;"><span ' + metaLabel + '>Cargo</span><span ' + metaValue + '>' + (cargo || '-') + '</span></td>';
            html += '<td style="' + mc  + 'width:14%;"><span ' + metaLabel + '>Representante de \u00c1rea</span><span ' + metaValue + '>' + (areaRep || '-') + (areaRepName ? '<br>' + areaRepName : '') + '</span></td>';
            html += '<td style="' + mcL + 'width:13%;"><span ' + metaLabel + '>Fecha Local</span><span ' + metaValue + '>' + fecha + '</span></td>';
            html += '</tr></tbody></table>';
            html += '<hr style="border:none;border-top:1px solid #e6eef9;margin:12px 0">';
            
            html += '<table style="width:100%;border-collapse:collapse;font-size:13px;"><thead><tr><th style="text-align:center;padding:8px;border-bottom:1px solid #e0e0e0;width:4%">#</th><th style="text-align:left;padding:8px;border-bottom:1px solid #e0e0e0;width:22%">Item</th><th style="text-align:left;padding:8px;border-bottom:1px solid #e0e0e0;width:34%">Información</th><th style="text-align:left;padding:8px;border-bottom:1px solid #e0e0e0;width:20%">Observaciones</th><th style="text-align:left;padding:8px;border-bottom:1px solid #e0e0e0;width:20%">Lugar</th></tr></thead><tbody>';
            filled.forEach(function (f, _itemIdx) {
                var infoHtml = '', observacionesVal = '', lugarVal = '';
                if (f.fields && f.fields.length) {
                    var prioColor = { '1': '#28a745', '2': '#ffc107', '3': '#ff8c00' }, condColor = { 'Satisfactorio': '#28a745', 'No Satisfactorio': '#dc3545', 'N/A': '#6c757d' };
                    infoHtml = '<ul style="margin:6px 0 6px 16px;padding:0;">';
                    f.fields.forEach(function (ff) {
                        var key = (ff.key || '').toString(), val = (ff.value || '').toString();
                        if (/observac/i.test(key)) { observacionesVal = val; return; }
                        if (/^lugar$/i.test(key)) { lugarVal = val; return; }
                        var dot = '';
                        if (/prioridad/i.test(key) && prioColor[val]) dot = '<span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:' + prioColor[val] + ';margin-left:8px;vertical-align:middle;"></span>';
                        else if (/condici/i.test(key) && condColor[val]) dot = '<span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:' + condColor[val] + ';margin-left:8px;vertical-align:middle;"></span>';
                        infoHtml += '<li style="margin-bottom:4px;">' + key + ': ' + val + (dot ? ' ' + dot : '') + '</li>';
                    });
                    infoHtml += '</ul>';
                } else { infoHtml = '<span class="muted">Sin campos adicionales</span>'; }
                html += '<tr><td style="vertical-align:top;padding:10px;border-bottom:1px solid #e0e0e0;text-align:center;"><div style="display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;border-radius:50%;background:#0b66c3;color:#fff;font-size:11px;font-weight:700;">' + (_itemIdx + 1) + '</div></td><td style="vertical-align:top;padding:10px;border-bottom:1px solid #e0e0e0;font-weight:600">' + f.name + '</td><td style="vertical-align:top;padding:10px;border-bottom:1px solid #e0e0e0">' + infoHtml + '</td><td style="vertical-align:top;padding:10px;border-bottom:1px solid #e0e0e0">' + (observacionesVal ? ('<div style="white-space:pre-wrap;">' + escapeHtml(observacionesVal) + '</div>') : '<span class="muted">-</span>') + '</td><td style="vertical-align:top;padding:10px;border-bottom:1px solid #e0e0e0">' + buildLugarHtml(f, lugarVal) + '</td></tr>';
            });
            html += '</tbody></table>';

            if (notasGenerales) {
                html += '<div style="margin-top:18px;padding:12px 16px;border:1px solid #e0e0e0;border-left:3px solid #0b66c3;border-radius:0 4px 4px 0;">';
                html += '<div style="font-size:10px;font-weight:700;color:#0b66c3;text-transform:uppercase;letter-spacing:0.6px;margin-bottom:6px;">Notas Generales</div>';
                html += '<div style="font-size:12px;color:#0f1724;line-height:1.6;white-space:pre-wrap;">' + escapeHtml(notasGenerales) + '</div>';
                html += '</div>';
            }

            var firmas = (window.obtenerFirmas && window.obtenerFirmas()) || {};
            html += '<table style="width:100%;border-collapse:collapse;margin-top:22px;">';
            html += '<tbody><tr>';
            if (areaRep && areaRepName) {
                // Firmas Area / AIFA / AFAC
                html += '<td style="width:33%;border:1px solid #e6eef9;padding:14px;vertical-align:top;text-align:center;">';
                html += '<div style="font-size:13px;color:#17325a;font-weight:700;margin-bottom:8px;">' + (areaRep || 'Área') + '</div>';
                if (firmas.area) { html += '<img src="' + firmas.area + '" style="max-height:50px;max-width:100%;display:block;margin:4px auto;">'; } else { html += '<div style="border-top:1px solid #cbdcec;padding-top:4px;color:#17325a;margin:8px 0;">Firma</div>'; }
                html += '<div style="font-size:12px;color:#374151;font-weight:600;">' + (areaRepName || '-') + '</div>';
                html += '</td>';

                html += '<td style="width:33%;border:1px solid #e6eef9;padding:14px;vertical-align:top;text-align:center;">';
                html += '<div style="font-size:13px;color:#17325a;font-weight:700;margin-bottom:8px;">AIFA</div>';
                if (firmas.aifa) { html += '<img src="' + firmas.aifa + '" style="max-height:50px;max-width:100%;display:block;margin:4px auto;">'; } else { html += '<div style="border-top:1px solid #cbdcec;padding-top:4px;color:#17325a;margin:8px 0;">Firma</div>'; }
                html += '<div style="font-size:12px;color:#374151;font-weight:600;">' + (autor || '-') + '</div>';
                html += '<div style="font-size:11px;color:#6b7280;">' + (cargo || '-') + '</div>';
                html += '</td>';

                html += '<td style="width:33%;border:1px solid #e6eef9;padding:14px;vertical-align:top;text-align:center;">';
                html += '<div style="font-size:13px;color:#17325a;font-weight:700;margin-bottom:8px;">AFAC</div>';
                if (firmas.afac) { html += '<img src="' + firmas.afac + '" style="max-height:50px;max-width:100%;display:block;margin:4px auto;">'; } else { html += '<div style="border-top:1px solid #cbdcec;padding-top:8px;color:#17325a;margin:10px 0;">Firma</div>'; }
                html += '<div style="font-size:12px;color:#374151;font-weight:600;">' + (afacName || '-') + '</div>';
                html += '</td>';
            } else {
                // Firmas AFAC / AIFA
                html += '<td style="width:50%;border:1px solid #e6eef9;padding:14px;vertical-align:top;text-align:center;">';
                html += '<div style="font-size:13px;color:#17325a;font-weight:700;margin-bottom:8px;">AFAC</div>';
                if (firmas.afac) { html += '<img src="' + firmas.afac + '" style="max-height:50px;max-width:100%;display:block;margin:4px auto;">'; } else { html += '<div style="border-top:1px solid #cbdcec;padding-top:8px;color:#17325a;margin:10px 0;">Firma</div>'; }
                html += '<div style="font-size:12px;color:#374151;font-weight:600;">' + (afacName || '-') + '</div>';
                html += '</td>';

                html += '<td style="width:50%;border:1px solid #e6eef9;padding:14px;vertical-align:top;text-align:center;">';
                html += '<div style="font-size:13px;color:#17325a;font-weight:700;margin-bottom:8px;">AIFA</div>';
                if (firmas.aifa) { html += '<img src="' + firmas.aifa + '" style="max-height:50px;max-width:100%;display:block;margin:4px auto;">'; } else { html += '<div style="border-top:1px solid #cbdcec;padding-top:4px;color:#17325a;margin:6px 0;">Firma</div>'; }
                html += '<div style="font-size:12px;color:#374151;font-weight:600;">' + (autor || '-') + '</div>';
                html += '<div style="font-size:11px;color:#6b7280;">' + (cargo || '-') + '</div>';
                html += '</td>';
            }
            html += '</tr></tbody></table>';
            html += '<p style="margin-top:18px;font-size:12px;color:#6b7280">Generado desde el formulario interno.</p>';
            html += '</div>';

            // --- Ítems con ubicación para mapa unificado ---
            var mapItems = (function () {
                var items = [];
                filled.forEach(function (f, idx) {
                    var placeField = null;
                    if (f.fields) {
                        for (var i = 0; i < f.fields.length; i++) {
                            if (/^lugar$/i.test(String(f.fields[i].key || ''))) { placeField = f.fields[i]; break; }
                        }
                    }
                    if (placeField && placeField.value) {
                        items.push({ num: idx + 1, name: f.name, coords: placeField.value, mapsUrl: placeField.mapsUrl || '' });
                    }
                });
                return items.length ? items : null;
            }());
            // --- Construcción de páginas de evidencias fotográficas (landscape) ---
            var photoPageHtmls = (function () {
                var sections = [];
                for (var _i = 0; _i < filled.length; _i++) {
                    var _f = filled[_i];
                    var _photos = (window.mhr && window.mhr.getItemPhotos)
                        ? window.mhr.getItemPhotos(_f.id)
                        : ((window.itemPhotos && window.itemPhotos[_f.id]) || []);
                    if (_photos && _photos.length > 0)
                        sections.push({ itemName: _f.name, photos: _photos });
                }
                if (!sections.length) return null;

                // Aplanar a celdas individuales (ordenadas por item)
                var allCells = [];
                sections.forEach(function (sec) {
                    sec.photos.forEach(function (ph, idx) {
                        allCells.push({
                            itemName: sec.itemName,
                            dataURL: ph.dataURL,
                            caption: ph.name || ('Foto ' + (idx + 1))
                        });
                    });
                });

                var PER_PAGE = 8; // 4 col × 2 rows = 1/8 de página por foto
                var totalPages = Math.ceil(allCells.length / PER_PAGE);
                var pages = [];

                for (var _pp = 0; _pp < totalPages; _pp++) {
                    var cells = allCells.slice(_pp * PER_PAGE, (_pp + 1) * PER_PAGE);
                    while (cells.length < PER_PAGE) cells.push(null);

                    // 1122 × 794 px = A4 landscape a 96 dpi
                    var ph = '<div style="width:1122px;height:794px;padding:22px 24px 14px 24px;font-family:Arial,Helvetica,sans-serif;box-sizing:border-box;background:#fff;overflow:hidden;">';

                    // Cabecera de página
                    ph += '<table style="width:100%;border-collapse:collapse;margin-bottom:8px;"><tbody><tr>';
                    ph += '<td style="vertical-align:bottom;">';
                    ph += '<span style="font-size:16px;font-weight:700;color:#0b66c3;">Evidencias Fotogr\u00e1ficas</span>';
                    ph += '<span style="font-size:11px;color:#6b7280;margin-left:12px;">Folio: ' + escapeHtml(folio) + '</span>';
                    ph += '</td>';
                    ph += '<td style="text-align:right;vertical-align:bottom;font-size:11px;color:#6b7280;">P\u00e1gina ' + (_pp + 1) + ' de ' + totalPages + '</td>';
                    ph += '</tr></tbody></table>';
                    ph += '<div style="border-top:2px solid #0b66c3;margin-bottom:8px;"></div>';

                    // Rejilla 4 × 2
                    ph += '<table style="width:100%;border-collapse:separate;border-spacing:5px;table-layout:fixed;">';
                    ph += '<tbody>';
                    for (var _row = 0; _row < 2; _row++) {
                        ph += '<tr>';
                        for (var _col = 0; _col < 4; _col++) {
                            var _cell = cells[_row * 4 + _col];
                            ph += '<td style="width:25%;vertical-align:top;border:1px solid #d1dce8;border-radius:3px;padding:5px;background:#fafcff;">';
                            if (_cell) {
                                ph += '<div style="font-size:9px;font-weight:700;color:#0b66c3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-bottom:3px;" title="' + escapeHtml(_cell.itemName) + '">' + escapeHtml(_cell.itemName) + '</div>';
                                ph += '<img src="' + _cell.dataURL + '" style="width:100%;height:283px;object-fit:cover;display:block;border-radius:2px;">';
                                ph += '<div style="font-size:8px;color:#6b7280;margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + escapeHtml(_cell.caption) + '</div>';
                            }
                            ph += '</td>';
                        }
                        ph += '</tr>';
                    }
                    ph += '</tbody></table>';
                    ph += '</div>';
                    pages.push(ph);
                }
                return pages;
            }());

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
                html: html,
                mapItems: mapItems,
                mapCaption: 'Folio: ' + folio + '  ·  RWY: ' + (pistaText || '-'),
                photosHtml: photoPageHtmls,
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
                    if (submitBtn) {
                        submitBtn.disabled = false;
                        if (submitBtn.tagName === 'BUTTON') submitBtn.textContent = originalBtnText;
                        else submitBtn.value = originalBtnText;
                    }
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
