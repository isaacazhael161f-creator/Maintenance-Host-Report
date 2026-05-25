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
    var selectedIds = {};

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
                if (selectedIds[item.id]) return;
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
            if (selectedIds[select.value]) {
                alert('Ese ITEM ya fue agregado.');
                select.value = '';
                return;
            }
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

        var card = document.createElement('div');
        card.className = 'item-card dynamic-item-card';
        card.dataset.itemCatalogId = item.id;
        card.style.border = '1px solid #d1dbe9';
        card.style.borderRadius = '10px';
        card.style.background = '#ffffff';
        card.style.padding = '10px';

        card.innerHTML = '' +
            '<button type="button" class="btn btn-ghost item-card-toggle" style="margin-bottom:8px;">▼ ' + esc(item.categoria) + ' / ' + esc(item.nombre) + '</button>' +
            '<div class="item-card-body">' +
            '  <label>Lugar: <input type="text" name="dynamic_lugar" class="dynamic-lugar" placeholder="Click para seleccionar en mapa"></label><br>' +
            '  <label>Hallazgo: <select class="dynamic-hallazgo">' + hallazgoOptions + '</select></label><br>' +
            '  <input type="text" class="dynamic-hallazgo-otro" placeholder="Especifique otro hallazgo" style="display:none; width:100%; margin:6px 0;">' +
            '  <label>Condición: <select class="condicion-select dynamic-condicion">' + getConditionOptionsHtml() + '</select></label><br>' +
            '  <div class="dynamic-photo-upload-area" style="margin:10px 0;">' +
            '    <div style="font-size:13px;color:#374151;margin-bottom:4px;">📷 Evidencia Fotográfica <span style="color:#6b7280;">(opcional)</span></div>' +
            '    <div style="display:flex;gap:10px;">' +
            '      <label style="flex:1;text-align:center;border:2px dashed #3b82f6;color:#1d4ed8;border-radius:8px;padding:8px 10px;cursor:pointer;font-size:15px;">📁 Archivo<input type="file" class="dynamic-evidencias dynamic-evidencias-file" multiple accept="image/*" style="display:none;"></label>' +
            '      <label style="flex:1;text-align:center;border:2px dashed #10b981;color:#065f46;border-radius:8px;padding:8px 10px;cursor:pointer;font-size:15px;">📸 Foto<input type="file" class="dynamic-evidencias dynamic-evidencias-camera" accept="image/*" capture="environment" style="display:none;"></label>' +
            '    </div>' +
            '    <div class="dynamic-photo-previews" style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px;"></div>' +
            '  </div>' +
            '  <label>Observaciones:<br><textarea class="dynamic-observaciones" rows="3">' + esc(prefill.observaciones || '') + '</textarea></label><br>' +
            '  <label>Estatus de atención:' +
            '    <select class="dynamic-followup-status">' +
            '      <option value="">Seleccione estatus</option>' +
            '      <option value="Atendido satisfactoriamente"' + (followupStatus === 'Atendido satisfactoriamente' ? ' selected' : '') + '>Atendido satisfactoriamente</option>' +
            '      <option value="Sigue activo"' + (followupStatus === 'Sigue activo' ? ' selected' : '') + '>Sigue activo</option>' +
            '    </select>' +
            '  </label><br>' +
            '  <label>Observaciones de seguimiento:<br><textarea class="dynamic-followup-observaciones" rows="2">' + esc(followupObs) + '</textarea></label><br>' +
            '  <label>Prioridad: <select class="priority-select dynamic-prioridad">' + getPriorityOptionsHtml() + '</select></label><br>' +
            '  <label>Código de Seguimiento: <input type="text" class="dynamic-codigo" value="' + esc(prefill.codigo || '') + '"></label>' +
            '</div>' +
            '<button type="button" class="btn btn-ghost dynamic-remove" style="margin-top:8px;">🗑️ Eliminar item</button>' +
            '<div class="item-card-actions" style="margin-top:8px;"><button type="button" class="btn btn-ghost dynamic-add-next">➕ Agregar Item</button></div>';

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

        bindDynamicLugarInput(card.querySelector('.dynamic-lugar'));
        bindDynamicPhotoInputs(card, item.id);

        card.querySelector('.dynamic-remove').addEventListener('click', function () {
            if (!window.confirm('¿Deseas eliminar este ITEM de la lista actual?')) return;
            selectedIds[item.id] = false;
            card.remove();
            ensureSingleComboRow();
        });

        card.querySelector('.dynamic-add-next').addEventListener('click', function () {
            card.querySelector('.item-card-actions').remove();
            ensureSingleComboRow(card);
        });

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
        selectedIds[itemId] = true;
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
        selectedIds = {};
        ensureSingleComboRow();
        var resp = await window.MHRReportService.getLatestReportByPista(client, pista);
        if (resp.error || !resp.data) return;
        var items = Array.isArray(resp.data.report_inspection_items) ? resp.data.report_inspection_items : [];
        if (!items.length) return;
        selectedContainer.innerHTML = '';
        selectedIds = {};
        items.forEach(function (it, idx) {
            var catalogId = it.item_catalogo_id || it.item_catalog_id;
            if (!catalogId || selectedIds[catalogId] || !itemMap[catalogId]) return;
            selectedIds[catalogId] = true;
            var prefill = {
                lugar: it.lugar || '',
                hallazgo: it.hallazgo || '',
                condicion: it.condicion || '',
                observaciones: it.observaciones || '',
                prioridad: it.prioridad || '',
                codigo: it.codigo_seguimiento || ''
            };
            var card = buildItemCard(itemMap[catalogId], prefill);
            selectedContainer.appendChild(card);
            if (idx === items.length - 1) {
                var actions = card.querySelector('.item-card-actions');
                if (actions) actions.innerHTML = '<button type="button" class="btn btn-ghost dynamic-add-next">➕ Agregar Item</button>';
                var btn = card.querySelector('.dynamic-add-next');
                if (btn) btn.addEventListener('click', function () { card.querySelector('.item-card-actions').remove(); ensureSingleComboRow(card); });
            } else {
                var a = card.querySelector('.item-card-actions'); if (a) a.remove();
            }
        });
        if (!selectedContainer.querySelector('.item-combo-row')) ensureSingleComboRow();
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
        if (res.error || !res.data) return false;

        var byId = {};
        var childrenByParent = {};
        res.data.forEach(function (r) {
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

        var categorias = res.data.filter(function (r) { return r.tipo === 'CATEGORIA'; });
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
        window.mhrDynamicItemCatalog = { catalogTree: catalogTree, selectedIds: selectedIds };
        Array.prototype.slice.call(document.querySelectorAll('input[name="pista"]')).forEach(function (r) {
            r.addEventListener('change', function () {
                if (r.checked) loadLastReportForPista(r.value);
            });
        });
    }).catch(function () {
        selectedContainer.innerHTML = '<div style="padding:10px; border:1px solid #fecaca; color:#991b1b; background:#fef2f2; border-radius:8px;">Error cargando catálogo de inspección.</div>';
    });
})();
