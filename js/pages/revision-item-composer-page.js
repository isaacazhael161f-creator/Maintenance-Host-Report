(function () {
            var itemDefs = [
                { id: 'tipo_area_movimiento', label: 'Área de Movimiento' },
                { id: 'tipo_franjas', label: 'Franjas de seguridad' },
                { id: 'tipo_iluminacion', label: 'Iluminación' },
                { id: 'tipo_marcas', label: 'Marcas y Señales' },
                { id: 'tipo_ayudas', label: 'Ayudas a la Navegación' },
                { id: 'tipo_obstaculos', label: 'Obstáculos' },
                { id: 'tipo_combustibles', label: 'Operaciones de Combustibles' },
                { id: 'tipo_construccion', label: 'Construcción' },
                { id: 'tipo_ssei', label: 'SSEI' },
                { id: 'tipo_vehiculos', label: 'Vehículos' },
                { id: 'tipo_fauna', label: 'Control de Fauna' },
                { id: 'tipo_proteccion', label: 'Protección Civil' }
            ];

            var comboList = document.getElementById('item-combo-list');
            var addBtn = document.getElementById('add-item-combo-btn');
            var selectedContainer = document.getElementById('item-selected-container');
            var stagingContainer = document.getElementById('item-staging-container');
            if (!comboList || !addBtn || !selectedContainer || !stagingContainer) return;

            var usedItems = {};
            var itemDefsLoaded = itemDefs.slice();
            var itemCatalogMeta = {};
            comboList.style.display = 'none';
            addBtn.style.display = 'none';

            function byId(id) { return document.getElementById(id); }

            function wrapItemBlock(itemId) {
                var chk = byId(itemId);
                var det = byId('details_' + itemId);
                if (!chk || !det) return null;
                var wrapperId = 'item_block_' + itemId;
                var existing = byId(wrapperId);
                if (existing) return existing;

                var parent = chk.parentNode;
                var wrapper = document.createElement('div');
                wrapper.id = wrapperId;
                wrapper.className = 'item-block-wrapper';
                wrapper.dataset.itemId = itemId;
                wrapper.style.display = 'none';
                parent.insertBefore(wrapper, chk);

                var label = document.querySelector('label[for="' + itemId + '"]');
                var doneBtn = byId('done_' + itemId);
                var updateBtn = byId('update_' + itemId);
                var dupBtn = byId('dup_' + itemId);
                var clearBtn = byId('clear_' + itemId);
                var br = det.previousElementSibling && det.previousElementSibling.tagName === 'BR' ? det.previousElementSibling : null;

                [chk, label, doneBtn, updateBtn, dupBtn, clearBtn, br, det].forEach(function (node) {
                    if (node && node.parentNode) wrapper.appendChild(node);
                });
                chk.style.display = 'none';
                if (label) label.style.display = 'none';
                if (dupBtn) dupBtn.style.display = 'none';
                stagingContainer.appendChild(wrapper);
                return wrapper;
            }

            function normalizeText(value) {
                return (value || '').toString().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
            }

            async function loadItemDefsFromCatalog() {
                if (!window.supabaseClient) return itemDefsLoaded;
                try {
                    var response = await window.supabaseClient
                        .from('catalogo_items_inspeccion')
                        .select('id, clave, nombre, orden, activo, tipo, parent_id')
                        .eq('activo', true)
                        .order('orden', { ascending: true })
                        .order('nombre', { ascending: true });
                    var rows = (response && response.data) ? response.data : [];
                    if (!rows.length) return itemDefsLoaded;

                    var byId = {};
                    rows.forEach(function (row) { byId[row.id] = row; });
                    var categoryByItem = {};
                    var hallazgosByItem = {};
                    var itemRows = rows.filter(function (row) { return row.tipo === 'ITEM'; });
                    rows.filter(function (row) { return row.tipo === 'HALLAZGO'; }).forEach(function (row) {
                        var itemParent = byId[row.parent_id];
                        if (!itemParent || itemParent.tipo !== 'ITEM') return;
                        var itemKey = normalizeText(itemParent.nombre);
                        hallazgosByItem[itemKey] = hallazgosByItem[itemKey] || [];
                        hallazgosByItem[itemKey].push(row.nombre);
                    });
                    itemRows.forEach(function (row) {
                        var cat = byId[row.parent_id];
                        var categoryName = (cat && cat.tipo === 'CATEGORIA') ? cat.nombre : 'Sin categoría';
                        categoryByItem[normalizeText(row.nombre)] = categoryName;
                    });

                    var filtered = itemDefs.map(function (item) {
                        var itemKey = normalizeText(item.label);
                        var categoryName = categoryByItem[itemKey];
                        if (!categoryName) return null;
                        var hallazgos = hallazgosByItem[itemKey] || [];
                        itemCatalogMeta[item.id] = { category: categoryName, hallazgos: hallazgos };
                        return { id: item.id, label: item.label, category: categoryName };
                    }).filter(Boolean);
                    if (filtered.length > 0) itemDefsLoaded = filtered;
                } catch (e) {
                    console.warn('No se pudo cargar catálogo de items desde Supabase, se usa lista local.', e);
                }
                return itemDefsLoaded;
            }

            function applyItemHallazgos(itemId) {
                var meta = itemCatalogMeta[itemId];
                if (!meta || !meta.hallazgos || meta.hallazgos.length === 0) return;
                var hallazgoSelect = byId('hallazgo_' + itemId);
                if (!hallazgoSelect) return;
                hallazgoSelect.innerHTML = '';
                var placeholder = document.createElement('option');
                placeholder.value = '';
                placeholder.textContent = '-- Seleccione hallazgo --';
                hallazgoSelect.appendChild(placeholder);
                meta.hallazgos.forEach(function (hallazgoName) {
                    var option = document.createElement('option');
                    option.value = hallazgoName;
                    option.textContent = hallazgoName;
                    hallazgoSelect.appendChild(option);
                });
                var otherOption = document.createElement('option');
                otherOption.value = 'Otro';
                otherOption.textContent = 'Otro';
                hallazgoSelect.appendChild(otherOption);
            }

            function renderComboOptions(select) {
                var currentVal = select.value;
                select.innerHTML = '<option value=\"\">-- Seleccionar item --</option>';
                itemDefsLoaded.forEach(function (item) {
                    if (usedItems[item.id] && item.id !== currentVal) return;
                    var opt = document.createElement('option');
                    opt.value = item.id;
                    opt.textContent = (item.category ? ('- ' + item.category + ' -- ' + item.label) : item.label);
                    if (item.id === currentVal) opt.selected = true;
                    select.appendChild(opt);
                });
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
                select.style.maxWidth = '420px';
                select.style.padding = '8px';
                select.style.borderRadius = '8px';
                select.style.border = '1px solid #c8d8ee';
                select.style.background = '#fff';
                renderComboOptions(select);

                var status = document.createElement('span');
                status.style.fontSize = '12px';
                status.style.color = '#64748b';
                status.textContent = 'Selecciona un item';

                row.appendChild(select);
                row.appendChild(status);
                if (afterNode && afterNode.parentNode === selectedContainer) {
                    selectedContainer.insertBefore(row, afterNode.nextSibling);
                } else {
                    selectedContainer.appendChild(row);
                }
                return row;
            }

            function collapseCard(card, collapse) {
                var body = card.querySelector('.item-card-body');
                var toggle = card.querySelector('.item-card-toggle');
                if (!body || !toggle) return;
                body.style.display = collapse ? 'none' : 'block';
                toggle.textContent = (collapse ? '▶ ' : '▼ ') + toggle.dataset.label;
            }

            function attachAddItemAction(card) {
                var actionWrap = document.createElement('div');
                actionWrap.className = 'item-card-actions';
                actionWrap.style.marginTop = '8px';
                var btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'btn btn-ghost';
                btn.textContent = '➕ Agregar Item';
                btn.addEventListener('click', function () {
                    collapseCard(card, true);
                    actionWrap.remove();
                    createComboRow(card);
                });
                actionWrap.appendChild(btn);
                card.appendChild(actionWrap);
            }

            function activateItem(itemId, comboRow) {
                if (!itemId || usedItems[itemId]) return;
                var block = wrapItemBlock(itemId);
                var chk = byId(itemId);
                if (!block || !chk) return;

                usedItems[itemId] = true;
                chk.checked = true;
                chk.dispatchEvent(new Event('change'));
                applyItemHallazgos(itemId);

                var label = (itemDefsLoaded.find(function (i) { return i.id === itemId; }) || {}).label || itemId;
                var card = document.createElement('div');
                card.className = 'item-card';
                card.style.border = '1px solid #d1dbe9';
                card.style.borderRadius = '10px';
                card.style.background = '#ffffff';
                card.style.padding = '10px';

                var toggle = document.createElement('button');
                toggle.type = 'button';
                toggle.className = 'btn btn-ghost item-card-toggle';
                toggle.dataset.label = label;
                toggle.style.marginBottom = '8px';
                toggle.textContent = '▼ ' + label;

                var body = document.createElement('div');
                body.className = 'item-card-body';
                block.style.display = 'block';
                body.appendChild(block);

                toggle.addEventListener('click', function () {
                    collapseCard(card, body.style.display !== 'none');
                });

                card.appendChild(toggle);
                card.appendChild(body);
                var removeBtn = document.createElement('button');
                removeBtn.type = 'button';
                removeBtn.className = 'btn btn-ghost';
                removeBtn.style.marginTop = '8px';
                removeBtn.textContent = '🗑️ Eliminar item';
                removeBtn.addEventListener('click', function () {
                    if (!window.confirm('¿Deseas eliminar este ITEM de la lista actual?')) return;
                    usedItems[itemId] = false;
                    chk.checked = false;
                    chk.dispatchEvent(new Event('change'));
                    block.style.display = 'none';
                    stagingContainer.appendChild(block);
                    var replacement = createComboRow();
                    bindComboRow(replacement);
                    card.replaceWith(replacement);
                });
                card.appendChild(removeBtn);

                comboRow.replaceWith(card);
                attachAddItemAction(card);
            }

            function bindComboRow(row) {
                if (!row || row.dataset.bound === '1') return;
                var sel = row.querySelector('select');
                if (!sel) return;
                renderComboOptions(sel);
                sel.addEventListener('change', function () { activateItem(sel.value, row); });
                row.dataset.bound = '1';
            }

            function activatePreselectedItems() {
                itemDefsLoaded.forEach(function (item) {
                    if (usedItems[item.id]) return;
                    var chk = byId(item.id);
                    if (!chk || !chk.checked) return;
                    var row = selectedContainer.querySelector('.item-combo-row') || createComboRow();
                    bindComboRow(row);
                    activateItem(item.id, row);
                });
            }

            // Inicialización: crear wrappers y ocultar lista larga original
            itemDefs.forEach(function (item) { wrapItemBlock(item.id); });
            loadItemDefsFromCatalog().finally(function () {
                var firstRow = createComboRow();
                bindComboRow(firstRow);
                activatePreselectedItems();
                setTimeout(activatePreselectedItems, 450);
            });

            // Hook para combos nuevos
            var observer = new MutationObserver(function () {
                selectedContainer.querySelectorAll('.item-combo-row').forEach(function (row) {
                    bindComboRow(row);
                });
            });
            observer.observe(selectedContainer, { childList: true, subtree: true });
        })();
