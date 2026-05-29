(function () {
    var comboList = document.getElementById('item-combo-list');
    var addBtn = document.getElementById('add-item-combo-btn');
    var selectedContainer = document.getElementById('item-selected-container');
    var stagingContainer = document.getElementById('item-staging-container');
    if (!comboList || !addBtn || !selectedContainer || !stagingContainer) return;

    comboList.style.display = 'none';
    addBtn.style.display = 'none';

    var catalogTree = [];
    var itemMap = {};

    function esc(text) {
        return (text || '').toString().replace(/[&<>'"]/g, function (m) {
            return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[m];
        });
    }

    function getConditionOptionsHtml() {
        var src = document.querySelector('.condicion-select');
        return src ? src.innerHTML : '<option value="">Seleccione condición</option>';
    }

    function getPriorityOptionsHtml() {
        var src = document.querySelector('.priority-select');
        return src ? src.innerHTML : '<option value="">Seleccione prioridad</option>';
    }

    function createComboRow(afterNode) {
        var row = document.createElement('div');
        row.className = 'item-combo-row';
        row.style.display = 'flex';
        row.style.gap = '8px';
        row.style.alignItems = 'center';
        row.style.padding = '8px 10px';
        row.style.border = '1px solid #d1dbe9';
        row.style.borderRadius = '10px';
        row.style.background = '#f8fbff';

        var select = document.createElement('select');
        select.style.flex = '1';
        select.style.maxWidth = '520px';
        select.style.padding = '8px';
        select.style.borderRadius = '8px';
        select.style.border = '1px solid #c8d8ee';
        select.style.background = '#fff';

        var placeholder = document.createElement('option');
        placeholder.value = '';
        placeholder.textContent = '-- Seleccionar item --';
        select.appendChild(placeholder);

        catalogTree.forEach(function (cat) {
            var group = document.createElement('optgroup');
            group.label = cat.nombre;
            cat.items.forEach(function (item) {
                var opt = document.createElement('option');
                opt.value = item.id;
                opt.textContent = item.nombre;
                group.appendChild(opt);
            });
            if (group.children.length > 0) select.appendChild(group);
        });

        var status = document.createElement('span');
        status.style.fontSize = '12px';
        status.style.color = '#64748b';
        status.textContent = 'Selecciona un item';

        row.appendChild(select);
        row.appendChild(status);

        select.addEventListener('change', function () {
            if (!select.value) return;
            activateItem(select.value, row);
        });

        if (afterNode && afterNode.parentNode === selectedContainer) selectedContainer.insertBefore(row, afterNode.nextSibling);
        else selectedContainer.appendChild(row);

        return row;
    }


    function ensureSingleComboRow(afterNode) {
        var rows = selectedContainer.querySelectorAll('.item-combo-row');
        if (rows.length > 0) {
            for (var i = 1; i < rows.length; i++) rows[i].remove();
            return rows[0];
        }
        return createComboRow(afterNode);
    }

    function buildItemCard(item, prefill) {
        prefill = prefill || {};
        var followupStatus = prefill.followup_status || '';
        var followupObs = prefill.followup_observaciones || '';
        if (!item) return;

        var hallazgoOptions = '<option value="">Seleccione hallazgo</option>';
        (item.hallazgos || []).forEach(function (h) {
            hallazgoOptions += '<option value="' + esc(h.nombre) + '">' + esc(h.nombre) + '</option>';
        });
        hallazgoOptions += '<option value="Otro">Otro</option>';

        var isPrefilled = !!prefill.is_prefilled_from_previous;
        var card = document.createElement('div');
        card.className = 'item-card dynamic-item-card';
        card.dataset.itemCatalogId = item.id;
        if (isPrefilled) card.dataset.prefilled = '1';
        
        // Estilos mejorados para ítems heredados
        if (isPrefilled) {
          card.style.border = '3px solid #f59e0b';
          card.style.borderRadius = '10px';
          card.style.background = 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)';
          card.style.padding = '12px';
          card.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
        } else {
          card.style.border = '1px solid #d1dbe9';
          card.style.borderRadius = '10px';
          card.style.background = '#ffffff';
          card.style.padding = '10px';
        }

        card.innerHTML = '' +
            (isPrefilled ? '<div style="background:#f59e0b; color:white; padding:6px 10px; border-radius:6px; font-size:13px; font-weight:600; margin-bottom:8px;">📋 ÍTEM DE SEGUIMIENTO (Reporte Anterior)</div>' : '') +
            '<button type="button" class="btn btn-ghost item-card-toggle" style="margin-bottom:8px;">▼ ' + esc(item.categoria) + ' / ' + esc(item.nombre) + '</button>' +
            '<div class="item-card-body">' +
            (isPrefilled ? '  <div style="background:#fef3c7;border:1px solid #f59e0b;border-radius:6px;padding:6px 10px;margin-bottom:10px;font-size:12px;color:#92400e;">🔒 Datos de solo lectura. Solo puedes modificar el <strong>Estado de Seguimiento</strong>.</div>' : '') +
            (isPrefilled
              ? '  <div style="margin-bottom:8px;"><div style="font-size:12px;color:#92400e;font-weight:600;margin-bottom:4px;">📍 Ubicación registrada</div><div style="display:flex;gap:6px;align-items:center;"><input type="text" name="dynamic_lugar" class="dynamic-lugar" readonly style="flex:1;background:#fef3c7;color:#374151;cursor:default;border:1px solid #f59e0b;padding:6px 8px;border-radius:6px;font-size:13px;"><button type="button" class="btn-compare-loc" style="padding:6px 12px;background:#0ea5e9;color:white;border:none;border-radius:6px;cursor:pointer;font-size:13px;white-space:nowrap;font-weight:500;flex-shrink:0;">🗺️ Comparar</button></div></div>'
              : '  <label>Lugar: <input type="text" name="dynamic_lugar" class="dynamic-lugar" placeholder="Click para seleccionar en mapa"></label><br>'
            ) +
            '  <label>Hallazgo: <select class="dynamic-hallazgo"' + (isPrefilled ? ' disabled style="background:#f3f4f6;color:#6b7280;"' : '') + '>' + hallazgoOptions + '</select></label><br>' +
            '  <input type="text" class="dynamic-hallazgo-otro" placeholder="Especifique otro hallazgo" style="display:none; width:100%; margin:6px 0;"' + (isPrefilled ? ' disabled' : '') + '>' +
            '  <label>Condición: <select class="condicion-select dynamic-condicion"' + (isPrefilled ? ' disabled style="background:#f3f4f6;color:#6b7280;"' : '') + '>' + getConditionOptionsHtml() + '</select></label><br>' +
            (isPrefilled
              ? '  <div style="margin:8px 0;padding:8px 10px;background:#f3f4f6;border-radius:8px;border:1px dashed #d1d5db;"><span style="font-size:13px;color:#6b7280;">📷 Las fotos se registraron en el reporte anterior.</span></div>'
              : '  <div class="dynamic-photo-upload-area" style="margin:10px 0;">' +
                '    <div style="font-size:13px;color:#374151;margin-bottom:4px;">📷 Evidencia Fotográfica <span style="color:#6b7280;">(opcional)</span></div>' +
                '    <div style="display:flex;gap:10px;">' +
                '      <label style="flex:1;text-align:center;border:2px dashed #3b82f6;color:#1d4ed8;border-radius:8px;padding:8px 10px;cursor:pointer;font-size:15px;">📁 Archivo<input type="file" class="dynamic-evidencias dynamic-evidencias-file" multiple accept="image/*" style="display:none;"></label>' +
                '      <label style="flex:1;text-align:center;border:2px dashed #10b981;color:#065f46;border-radius:8px;padding:8px 10px;cursor:pointer;font-size:15px;">📸 Foto<input type="file" class="dynamic-evidencias dynamic-evidencias-camera" accept="image/*" capture="environment" style="display:none;"></label>' +
                '    </div>' +
                '    <div class="dynamic-photo-previews" style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px;"></div>' +
                '  </div>'
            ) +
            '  <label>Observaciones:<br><textarea class="dynamic-observaciones" rows="3"' + (isPrefilled ? ' disabled style="background:#f3f4f6;color:#6b7280;resize:none;"' : '') + '>' + esc(prefill.observaciones || '') + '</textarea></label><br>' +
            (isPrefilled 
              ? '<div style="background:#f3f4f6; padding:10px; border-radius:8px; border-left:4px solid #f59e0b; margin:10px 0;">' +
                '  <div style="font-weight:600; color:#92400e; margin-bottom:8px;">✅ ESTADO DE SEGUIMIENTO</div>' +
                '  <label style="display:block; margin-bottom:8px;">¿Cuál es el estado de este ítem?<br>' +
                '    <select class="dynamic-followup-status" style="width:100%; padding:8px; margin-top:4px; border:2px solid #f59e0b; border-radius:6px; background:white;" required>' +
                '      <option value="" disabled selected>Seleccione estado</option>' +
                '      <option value="Atendido satisfactoriamente"' + (followupStatus === 'Atendido satisfactoriamente' ? ' selected' : '') + '>✓ Atendido satisfactoriamente</option>' +
                '      <option value="Sigue activo"' + (followupStatus === 'Sigue activo' ? ' selected' : '') + '>◆ Sigue activo / Pendiente</option>' +
                '    </select>' +
                '  </label>' +
                '  <label style="display:block;">Observaciones de seguimiento:<br><textarea class="dynamic-followup-observaciones" rows="2" style="width:100%; padding:6px; margin-top:4px; border:1px solid #d1d5db; border-radius:6px;">' + esc(followupObs) + '</textarea></label>' +
                '</div>'
              : '<label>Estatus de atención:' +
                '    <select class="dynamic-followup-status">' +
                '      <option value="">Seleccione estatus</option>' +
                '      <option value="Atendido satisfactoriamente"' + (followupStatus === 'Atendido satisfactoriamente' ? ' selected' : '') + '>Atendido satisfactoriamente</option>' +
                '      <option value="Sigue activo"' + (followupStatus === 'Sigue activo' ? ' selected' : '') + '>Sigue activo</option>' +
                '    </select>' +
                '  </label><br>' +
                '  <label>Observaciones de seguimiento:<br><textarea class="dynamic-followup-observaciones" rows="2">' + esc(followupObs) + '</textarea></label><br>'
            ) +
            '  <input type="hidden" class="dynamic-historial-json" value="' + esc(prefill.historial_json || '') + '">' +
            '  <label>Prioridad: <select class="priority-select dynamic-prioridad"' + (isPrefilled ? ' disabled style="background:#f3f4f6;color:#6b7280;"' : '') + '>' + getPriorityOptionsHtml() + '</select></label><br>' +
            '  <label>Código de Seguimiento: <input type="text" class="dynamic-codigo" value="' + esc(prefill.codigo || '') + '"' + (isPrefilled ? ' readonly style="background:#f3f4f6;color:#6b7280;"' : '') + '></label>' +
            '</div>' +
            (isPrefilled
                ? ''
                : '<button type="button" class="btn btn-ghost dynamic-remove" style="margin-top:8px;">🗑️ Eliminar item</button>') +
            (isPrefilled
                ? ''
                : '<div class="item-card-actions" style="margin-top:8px;"><button type="button" class="btn btn-ghost dynamic-add-next">➕ Agregar Item</button></div>');

        var toggle = card.querySelector('.item-card-toggle');
        var body = card.querySelector('.item-card-body');
        toggle.addEventListener('click', function () {
            var collapse = body.style.display !== 'none';
            body.style.display = collapse ? 'none' : 'block';
            toggle.textContent = (collapse ? '▶ ' : '▼ ') + item.categoria + ' / ' + item.nombre;
        });

        var hallSel = card.querySelector('.dynamic-hallazgo');
        var hallOther = card.querySelector('.dynamic-hallazgo-otro');
        hallSel.addEventListener('change', function () {
            hallOther.style.display = hallSel.value === 'Otro' ? 'block' : 'none';
            if (hallSel.value !== 'Otro') hallOther.value = '';
        });

        if (isPrefilled) {
            var compareBtn = card.querySelector('.btn-compare-loc');
            var lugarInputForCompare = card.querySelector('.dynamic-lugar');
            if (compareBtn && lugarInputForCompare) {
                compareBtn.addEventListener('click', function () {
                    if (window.openMapComparison) window.openMapComparison(lugarInputForCompare.value);
                });
            }
        } else {
            bindDynamicLugarInput(card.querySelector('.dynamic-lugar'));
            bindDynamicPhotoInputs(card, item.id);
        }

        var removeBtn = card.querySelector('.dynamic-remove');
        if (removeBtn) {
            removeBtn.addEventListener('click', function () {
                if (!window.confirm('¿Deseas eliminar este ITEM de la lista actual?')) return;
                card.remove();
                ensureSingleComboRow();
            });
        }

        var addNextBtn = card.querySelector('.dynamic-add-next');
        if (addNextBtn) {
            addNextBtn.addEventListener('click', function () {
                var actionsEl = card.querySelector('.item-card-actions');
                if (actionsEl) actionsEl.remove();
                ensureSingleComboRow(card);
            });
        }

        var lugar = card.querySelector('.dynamic-lugar');
        var hallazgo = card.querySelector('.dynamic-hallazgo');
        var hallazgoOtro = card.querySelector('.dynamic-hallazgo-otro');
        var condicion = card.querySelector('.dynamic-condicion');
        var prioridad = card.querySelector('.dynamic-prioridad');
        if (lugar && prefill.lugar) lugar.value = prefill.lugar;
        if (hallazgo && prefill.hallazgo) {
            var hasOption = Array.prototype.slice.call(hallazgo.options || []).some(function (o) { return o.value === prefill.hallazgo; });
            if (hasOption) hallazgo.value = prefill.hallazgo;
            else { hallazgo.value = 'Otro'; hallazgoOtro.style.display = 'block'; hallazgoOtro.value = prefill.hallazgo; }
        }
        if (condicion && prefill.condicion) condicion.value = prefill.condicion;
        if (prioridad && prefill.prioridad) prioridad.value = prefill.prioridad;
        return card;
    }

    function activateItem(itemId, comboRow) {
        var item = itemMap[itemId];
        if (!item) return;
        var card = buildItemCard(item, {});
        comboRow.replaceWith(card);
    }


    function bindDynamicLugarInput(input) {
        if (!input) return;
        input.readOnly = true;
        input.style.cursor = 'pointer';
        input.style.pointerEvents = 'auto';
        input.addEventListener('click', function (e) {
            e.preventDefault();
            if (window.openMapPicker) window.openMapPicker(input);
        });
    }

    function renderDynamicPhotoPreviews(card, itemId) {
        var previewsDiv = card.querySelector('.dynamic-photo-previews');
        if (!previewsDiv) return;
        var photos = (window.itemPhotos && window.itemPhotos[itemId]) || [];
        previewsDiv.innerHTML = '';
        photos.forEach(function (photo, idx) {
            var wrap = document.createElement('div');
            wrap.style.position = 'relative';
            var img = document.createElement('img');
            img.src = photo.dataURL;
            img.style.width = '84px'; img.style.height = '84px'; img.style.objectFit = 'cover'; img.style.borderRadius = '8px'; img.style.border = '1px solid #cbd5e1';
            var rm = document.createElement('button');
            rm.type = 'button'; rm.textContent = '×';
            rm.style.position='absolute'; rm.style.top='-6px'; rm.style.right='-6px'; rm.style.width='22px'; rm.style.height='22px'; rm.style.borderRadius='999px'; rm.style.border='none'; rm.style.background='#ef4444'; rm.style.color='#fff'; rm.style.cursor='pointer';
            rm.addEventListener('click', function () {
                if (!window.itemPhotos || !window.itemPhotos[itemId]) return;
                window.itemPhotos[itemId].splice(idx, 1);
                renderDynamicPhotoPreviews(card, itemId);
            });
            wrap.appendChild(img); wrap.appendChild(rm);
            previewsDiv.appendChild(wrap);
        });
    }

    function bindDynamicPhotoInputs(card, itemId) {
        window.itemPhotos = window.itemPhotos || {};
        window.itemPhotos[itemId] = window.itemPhotos[itemId] || [];
        var inputs = card.querySelectorAll('.dynamic-evidencias');
        Array.prototype.forEach.call(inputs, function (input) {
            input.addEventListener('change', function () {
                var files = Array.prototype.slice.call(input.files || []);
                if (!files.length) return;
                var pending = files.length;
                files.forEach(function (file) {
                    var reader = new FileReader();
                    reader.onload = function (e) {
                        window.itemPhotos[itemId].push({ dataURL: e.target.result, name: file.name });
                        pending--;
                        if (pending === 0) {
                            renderDynamicPhotoPreviews(card, itemId);
                            input.value = '';
                        }
                    };
                    reader.readAsDataURL(file);
                });
            });
        });
    }


    function waitForSupabaseClient(maxWaitMs) {
        maxWaitMs = typeof maxWaitMs === 'number' ? maxWaitMs : 5000;
        return new Promise(function (resolve) {
            if (window.supabaseClient) { resolve(window.supabaseClient); return; }
            var elapsed = 0;
            var step = 100;
            var timer = setInterval(function () {
                elapsed += step;
                if (window.supabaseClient) {
                    clearInterval(timer);
                    resolve(window.supabaseClient);
                    return;
                }
                if (elapsed >= maxWaitMs) {
                    clearInterval(timer);
                    resolve(null);
                }
            }, step);
        });
    }
    async function loadLastReportForPista(pista) {
        var client = await waitForSupabaseClient(7000);
        if (!client || !window.MHRReportService || !pista) return;
        selectedContainer.innerHTML = '';
        var resp = await window.MHRReportService.getLatestReportByPista(client, pista);
        
        if (resp.error || !resp.data) {
            // Si no hay reporte anterior, simplemente mostrar combo para agregar
            ensureSingleComboRow();
            return;
        }
        
        var items = Array.isArray(resp.data.report_inspection_items) ? resp.data.report_inspection_items : [];
        
        // Si hay ítems del reporte anterior, mostrar mensaje informativo
        if (items.length > 0) {
            var infoBox = document.createElement('div');
            infoBox.style.cssText = 'background:#e0f2fe; border:2px solid #0284c7; color:#0c4a6e; padding:12px 15px; border-radius:8px; margin-bottom:12px; font-size:14px;';
            infoBox.innerHTML = '📋 Se encontraron ' + items.length + ' ítem(s) pendiente(s) del último reporte de esta pista.<br><strong>Revisa el estado de cada uno y marca si ya fueron atendidos.</strong>';
            selectedContainer.appendChild(infoBox);
        }
        
        // Cargar cada ítem del reporte anterior
        items.forEach(function (it, idx) {
            var catalogId = it.item_catalogo_id || it.item_catalog_id;
            if (!catalogId || !itemMap[catalogId]) return;
            var prefill = {
                lugar: it.lugar || '',
                hallazgo: it.hallazgo || '',
                condicion: it.condicion || '',
                observaciones: it.observaciones || '',
                prioridad: it.prioridad || '',
                codigo: it.codigo_seguimiento || '',
                followup_status: '', // Vacío para que usuario defina nuevo estado
                followup_observaciones: ''
            };
            prefill.is_prefilled_from_previous = true;
            prefill.historial_json = it.observaciones ? JSON.stringify([{ tipo: 'observacion_previa', texto: it.observaciones }]) : '[]';
            var card = buildItemCard(itemMap[catalogId], prefill);
            selectedContainer.appendChild(card);
            
            // No mostrar acciones en ítems del medio, solo en el último
            var actions = card.querySelector('.item-card-actions');
            if (idx < items.length - 1) {
                if (actions) actions.remove();
            }
        });
        
        // Siempre agregar un combo para agregar nuevos ítems al final
        ensureSingleComboRow();
    }

    async function loadCatalogTree() {
        var client = await waitForSupabaseClient(7000);
        if (!client) return false;
        var res = await client
            .from('catalogo_items_inspeccion')
            .select('id, clave, nombre, orden, activo, parent_id, tipo, nivel')
            .eq('activo', true)
            .order('orden', { ascending: true })
            .order('nombre', { ascending: true });
        
        var data = res.data;
        
        // Si la tabla no existe o está vacía, usar datos de fallback
        if (res.error || !data || data.length === 0) {
            console.warn('Error al cargar catalogo_items_inspeccion:', res.error);
            console.log('Usando datos de fallback...');
            
            // Datos de muestra para que la aplicación funcione
            data = [
                { id: '1', clave: 'CAT_PISTA', nombre: 'Pista', orden: 1, activo: true, parent_id: null, tipo: 'CATEGORIA', nivel: 0 },
                { id: '1-1', clave: 'ITEM_ASFALTO', nombre: 'Condición del Asfalto', orden: 1, activo: true, parent_id: '1', tipo: 'ITEM', nivel: 1 },
                { id: '1-1-1', clave: 'HALL_GRIETAS', nombre: 'Grietas', orden: 1, activo: true, parent_id: '1-1', tipo: 'HALLAZGO', nivel: 2 },
                { id: '1-1-2', clave: 'HALL_HUNDIMIENTOS', nombre: 'Hundimientos', orden: 2, activo: true, parent_id: '1-1', tipo: 'HALLAZGO', nivel: 2 },
                { id: '1-2', clave: 'ITEM_MARCAS', nombre: 'Marcas y Señalización', orden: 2, activo: true, parent_id: '1', tipo: 'ITEM', nivel: 1 },
                { id: '1-2-1', clave: 'HALL_DESGASTE_MARCAS', nombre: 'Desgaste de Marcas', orden: 1, activo: true, parent_id: '1-2', tipo: 'HALLAZGO', nivel: 2 },
                { id: '1-3', clave: 'ITEM_ILUMINACION', nombre: 'Iluminación', orden: 3, activo: true, parent_id: '1', tipo: 'ITEM', nivel: 1 },
                { id: '1-3-1', clave: 'HALL_LUCES_DAÑADAS', nombre: 'Luces Dañadas', orden: 1, activo: true, parent_id: '1-3', tipo: 'HALLAZGO', nivel: 2 },
                
                { id: '2', clave: 'CAT_HANGARES', nombre: 'Hangares', orden: 2, activo: true, parent_id: null, tipo: 'CATEGORIA', nivel: 0 },
                { id: '2-1', clave: 'ITEM_TECHO', nombre: 'Estructura de Techo', orden: 1, activo: true, parent_id: '2', tipo: 'ITEM', nivel: 1 },
                { id: '2-1-1', clave: 'HALL_FUGAS', nombre: 'Fugas de Agua', orden: 1, activo: true, parent_id: '2-1', tipo: 'HALLAZGO', nivel: 2 },
                { id: '2-2', clave: 'ITEM_PUERTAS', nombre: 'Puertas y Accesos', orden: 2, activo: true, parent_id: '2', tipo: 'ITEM', nivel: 1 },
                { id: '2-2-1', clave: 'HALL_PUERTAS_DAÑADAS', nombre: 'Puertas Dañadas', orden: 1, activo: true, parent_id: '2-2', tipo: 'HALLAZGO', nivel: 2 }
            ];
        }
        
        var byId = {};
        var childrenByParent = {};
        data.forEach(function (r) {
            byId[r.id] = r;
            var k = r.parent_id || '__root__';
            childrenByParent[k] = childrenByParent[k] || [];
            childrenByParent[k].push(r);
        });

        function getDescendantsByType(parentId, type) {
            var out = [];
            var stack = (childrenByParent[parentId] || []).slice();
            while (stack.length) {
                var n = stack.shift();
                if (n.tipo === type) out.push(n);
                var kids = childrenByParent[n.id] || [];
                for (var i = 0; i < kids.length; i++) stack.push(kids[i]);
            }
            out.sort(function (a, b) {
                var ao = Number(a.orden || 0), bo = Number(b.orden || 0);
                if (ao !== bo) return ao - bo;
                return (a.nombre || '').localeCompare(b.nombre || '');
            });
            return out;
        }

        function getItemChildren(itemId) {
            return (childrenByParent[itemId] || []).filter(function (n) { return n.tipo === 'ITEM'; });
        }

        function buildItemPathName(itemNode) {
            var parts = [itemNode.nombre || ''];
            var cursor = itemNode;
            while (cursor && cursor.parent_id && byId[cursor.parent_id] && byId[cursor.parent_id].tipo !== 'CATEGORIA') {
                cursor = byId[cursor.parent_id];
                parts.unshift(cursor.nombre || '');
            }
            return parts.join(' / ');
        }

        var categorias = data.filter(function (r) { return r.tipo === 'CATEGORIA'; });
        catalogTree = categorias.map(function (cat) {
            var items = getDescendantsByType(cat.id, 'ITEM').filter(function (it) {
                return getItemChildren(it.id).length === 0;
            }).map(function (it) {
                var hallazgos = getDescendantsByType(it.id, 'HALLAZGO');
                var obj = { id: it.id, nombre: buildItemPathName(it), categoria: cat.nombre, hallazgos: hallazgos, nivel: it.nivel };
                itemMap[it.id] = obj;
                return obj;
            });
            return { id: cat.id, nombre: cat.nombre, items: items };
        }).filter(function (c) { return c.items.length > 0; });
        return catalogTree.length > 0;
    }
    function removeLegacyChecklist() {
        var legacyIds = [
            'tipo_area_movimiento', 'tipo_franjas', 'tipo_iluminacion', 'tipo_marcas', 'tipo_ayudas',
            'tipo_obstaculos', 'tipo_combustibles', 'tipo_construccion', 'tipo_ssei', 'tipo_vehiculos',
            'tipo_fauna', 'tipo_proteccion'
        ];

        legacyIds.forEach(function (id) {
            var chk = document.getElementById(id);
            var lbl = document.querySelector('label[for="' + id + '"]');
            var doneBtn = document.getElementById('done_' + id);
            var updateBtn = document.getElementById('update_' + id);
            var dupBtn = document.getElementById('dup_' + id);
            var clearBtn = document.getElementById('clear_' + id);
            var det = document.getElementById('details_' + id);
            var br = det && det.previousElementSibling && det.previousElementSibling.tagName === 'BR' ? det.previousElementSibling : null;
            [chk, lbl, doneBtn, updateBtn, dupBtn, clearBtn, br, det].forEach(function (node) {
                if (!node) return;
                node.remove();
            });
        });

        if (stagingContainer) stagingContainer.remove();
    }

    removeLegacyChecklist();
    loadCatalogTree().then(function (ok) {
        if (!ok) {
            selectedContainer.innerHTML = '<div style="padding:10px; border:1px solid #fecaca; color:#991b1b; background:#fef2f2; border-radius:8px;">No se pudo cargar el catálogo de inspección (catalogo_items_inspeccion).</div>';
            return;
        }
        ensureSingleComboRow();
        window.mhrDynamicItemCatalog = { catalogTree: catalogTree };
        Array.prototype.slice.call(document.querySelectorAll('input[name="pista"]')).forEach(function (r) {
            r.addEventListener('change', function () {
                if (r.checked) loadLastReportForPista(r.value);
            });
        });
    }).catch(function () {
        selectedContainer.innerHTML = '<div style="padding:10px; border:1px solid #fecaca; color:#991b1b; background:#fef2f2; border-radius:8px;">Error cargando catálogo de inspección.</div>';
    });
})();
