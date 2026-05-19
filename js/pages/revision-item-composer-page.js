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
            var catOpt = document.createElement('option');
            catOpt.value = '';
            catOpt.disabled = true;
            catOpt.textContent = '- ' + cat.nombre;
            select.appendChild(catOpt);

            cat.items.forEach(function (item) {
                if (selectedIds[item.id]) return;
                var opt = document.createElement('option');
                opt.value = item.id;
                opt.textContent = '-- ' + item.nombre;
                select.appendChild(opt);
            });
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

    function activateItem(itemId, comboRow) {
        var item = itemMap[itemId];
        if (!item) return;
        selectedIds[itemId] = true;

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
            '  <label>Evidencias: <input type="file" class="dynamic-evidencias" multiple accept="image/*"></label><br>' +
            '  <label>Observaciones:<br><textarea class="dynamic-observaciones" rows="3"></textarea></label><br>' +
            '  <label>Prioridad: <select class="priority-select dynamic-prioridad">' + getPriorityOptionsHtml() + '</select></label><br>' +
            '  <label>Código de Seguimiento: <input type="text" class="dynamic-codigo"></label>' +
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

        card.querySelector('.dynamic-remove').addEventListener('click', function () {
            if (!window.confirm('¿Deseas eliminar este ITEM de la lista actual?')) return;
            selectedIds[itemId] = false;
            var replacement = createComboRow();
            card.replaceWith(replacement);
        });

        card.querySelector('.dynamic-add-next').addEventListener('click', function () {
            card.querySelector('.item-card-actions').remove();
            createComboRow(card);
        });

        comboRow.replaceWith(card);
    }

    async function loadCatalogTree() {
        if (!window.supabaseClient) return false;
        var res = await window.supabaseClient
            .from('catalogo_items_inspeccion')
            .select('id, clave, nombre, orden, activo, parent_id, tipo')
            .eq('activo', true)
            .order('orden', { ascending: true })
            .order('nombre', { ascending: true });
        if (res.error || !res.data) return false;

        var byId = {};
        res.data.forEach(function (r) { byId[r.id] = r; });
        var categorias = res.data.filter(function (r) { return r.tipo === 'CATEGORIA'; });
        catalogTree = categorias.map(function (cat) {
            var items = res.data.filter(function (r) { return r.tipo === 'ITEM' && r.parent_id === cat.id; })
                .map(function (it) {
                    var hallazgos = res.data.filter(function (r) { return r.tipo === 'HALLAZGO' && r.parent_id === it.id; });
                    var obj = { id: it.id, nombre: it.nombre, categoria: cat.nombre, hallazgos: hallazgos };
                    itemMap[it.id] = obj;
                    return obj;
                });
            return { id: cat.id, nombre: cat.nombre, items: items };
        }).filter(function (c) { return c.items.length > 0; });
        return catalogTree.length > 0;
    }

    loadCatalogTree().then(function (ok) {
        if (!ok) {
            selectedContainer.innerHTML = '<div style="padding:10px;color:#991b1b;background:#fef2f2;border:1px solid #fecaca;border-radius:8px;">No se pudo cargar catálogo ITEM/CATEGORÍA/HALLAZGO desde Supabase.</div>';
            return;
        }
        createComboRow();
        window.mhrDynamicItemCatalog = { catalogTree: catalogTree, selectedIds: selectedIds };
    }).catch(function () {
        selectedContainer.innerHTML = '<div style="padding:10px;color:#991b1b;background:#fef2f2;border:1px solid #fecaca;border-radius:8px;">No se pudo cargar catálogo ITEM/CATEGORÍA/HALLAZGO desde Supabase.</div>';
    });
})();
