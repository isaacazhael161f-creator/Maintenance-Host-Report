(function () {
            // Añadir botón 'duplicar' (+) junto a cada item para crear instancias adicionales
            var counters = {};
            var baseItemIds = [
                'tipo_area_movimiento', 'tipo_franjas', 'tipo_iluminacion', 'tipo_marcas', 'tipo_ayudas',
                'tipo_obstaculos', 'tipo_combustibles', 'tipo_construccion', 'tipo_ssei', 'tipo_vehiculos',
                'tipo_fauna', 'tipo_proteccion'
            ];

            function setupItemControlsFor(id) {
                var chk = document.getElementById(id);
                var det = document.getElementById('details_' + id);
                var doneBtn = document.getElementById('done_' + id);
                var updateBtn = document.getElementById('update_' + id);
                var dupBtn = document.getElementById('dup_' + id);
                var clearBtn = document.getElementById('clear_' + id);
                if (!chk) return;

                // Helper: detecta si el item tiene datos (campos con valor o selecciones)
                function hasItemData() {
                    try {
                        // if checkbox itself is checked, consider it as data
                        if (chk && chk.checked) return true;
                        if (!det) return false;
                        var els = Array.prototype.slice.call(det.querySelectorAll('input,textarea,select'));
                        for (var i = 0; i < els.length; i++) {
                            var el = els[i];
                            if (!el) continue;
                            if (el.type === 'checkbox' || el.type === 'radio') { if (el.checked) return true; }
                            else if ((el.value || '').toString().trim() !== '') return true;
                        }
                    } catch (e) { }
                    return false;
                }

                function updateClearVisibility() {
                    try {
                        if (!clearBtn) return;
                        var has = hasItemData();
                        clearBtn.style.display = has ? 'inline-block' : 'none';
                    } catch (e) { }
                }

                function refresh() {
                    if (chk.disabled) {
                        if (doneBtn) doneBtn.style.display = 'none';
                        if (updateBtn) updateBtn.style.display = 'inline-block';
                    } else {
                        if (chk.checked) { if (doneBtn) doneBtn.style.display = 'inline-block'; } else { if (doneBtn) doneBtn.style.display = 'none'; }
                        if (updateBtn) updateBtn.style.display = 'none';
                    }
                    // mostrar/ocultar botones + y Clear según si el checkbox está seleccionado
                    if (dupBtn) dupBtn.style.display = chk.checked ? 'inline-block' : 'none';
                    updateClearVisibility();
                }

                chk.addEventListener('change', function () {
                    if (det) { det.style.display = chk.checked ? 'block' : 'none'; }
                    refresh();
                });

                if (doneBtn) {
                    doneBtn.addEventListener('click', function () {
                        if (chk.checked) {
                            chk.disabled = true;
                            if (det) {
                                Array.prototype.slice.call(det.querySelectorAll('input, textarea, select')).forEach(function (el) { try { el.disabled = true; } catch (e) { } });
                            }
                        }
                        refresh();
                    });
                }
                if (updateBtn) {
                    updateBtn.addEventListener('click', function () {
                        chk.disabled = false;
                        if (det) {
                            Array.prototype.slice.call(det.querySelectorAll('input, textarea, select')).forEach(function (el) { try { el.disabled = false; } catch (e) { } });
                        }
                        refresh();
                    });
                }

                if (dupBtn) {
                    dupBtn.addEventListener('click', function () { duplicateItem(id); });
                }
                if (clearBtn) {
                    clearBtn.addEventListener('click', function () {
                        try {
                            // uncheck the checkbox, hide details and clear values
                            if (chk) { chk.checked = false; chk.disabled = false; }
                            if (det) {
                                det.style.display = 'none';
                                Array.prototype.slice.call(det.querySelectorAll('input, textarea, select')).forEach(function (el) {
                                    try {
                                        if (el.type === 'checkbox' || el.type === 'radio') el.checked = false;
                                        else el.value = '';
                                        el.disabled = false;
                                        if (el.classList && el.classList.contains('priority-select')) { el.style.backgroundColor = ''; el.classList.remove('prio-1','prio-2','prio-3'); }
                                        if (el.classList && el.classList.contains('condicion-select')) { el.style.backgroundColor = ''; el.classList.remove('cond-ok','cond-bad','cond-na','cond-leve','cond-medio','cond-alto','cond-critico'); }
                                    } catch (e) { }
                                });
                            }
                            // update visuals
                            if (doneBtn) doneBtn.style.display = 'none';
                            if (updateBtn) updateBtn.style.display = 'none';
                            if (clearBtn) clearBtn.style.display = 'none';
                            // persist state
                            try { if (window.saveFormState) window.saveFormState(); } catch (e) { }
                        } catch (e) { console.error('Error clearing item', id, e); }
                    });
                }

                // si hay panel de detalles, escuchar cambios para mostrar/ocultar Clear
                if (det) {
                    try {
                        Array.prototype.slice.call(det.querySelectorAll('input,textarea,select')).forEach(function (el) {
                            el.addEventListener('input', updateClearVisibility);
                            el.addEventListener('change', updateClearVisibility);
                        });
                    } catch (e) { }
                }

                // inicializar estado visual
                refresh();
            }

            function duplicateItem(origId) {
                var origChk = document.getElementById(origId);
                var origDet = document.getElementById('details_' + origId);
                if (!origChk) return;
                counters[origId] = (counters[origId] || 0) + 1;
                var suffix = '_dup' + counters[origId];
                var newId = origId + suffix;

                // clone checkbox
                var newChk = origChk.cloneNode(false);
                newChk.id = newId;
                newChk.checked = false;
                newChk.disabled = false;

                // clone label
                var origLabel = document.querySelector('label[for="' + origId + '"]');
                var newLabel = origLabel ? origLabel.cloneNode(true) : null;
                if (newLabel) newLabel.setAttribute('for', newId);

                // create done/update buttons for the clone
                var newDone = document.createElement('button'); newDone.type = 'button'; newDone.id = 'done_' + newId; newDone.className = 'item-done'; newDone.style.display = 'none'; newDone.style.marginLeft = '6px'; newDone.textContent = 'Done';
                var newUpdate = document.createElement('button'); newUpdate.type = 'button'; newUpdate.id = 'update_' + newId; newUpdate.className = 'item-update'; newUpdate.style.display = 'none'; newUpdate.style.marginLeft = '6px'; newUpdate.textContent = 'Update';
                var newDup = document.createElement('button'); newDup.type = 'button'; newDup.id = 'dup_' + newId; newDup.className = 'item-duplicate'; newDup.style.display = 'none'; newDup.style.marginLeft = '6px'; newDup.textContent = '+';
                var newClear = document.createElement('button'); newClear.type = 'button'; newClear.id = 'clear_' + newId; newClear.className = 'item-done item-clear'; newClear.style.display = 'none'; newClear.style.marginLeft = '6px'; newClear.style.cssFloat = 'right'; newClear.textContent = 'Clear';
                var br = document.createElement('br');

                // clone details panel and adjust ids/names
                var newDet = origDet ? origDet.cloneNode(true) : null;
                if (newDet) {
                    newDet.id = 'details_' + newId;
                    // update any element ids inside
                    Array.prototype.slice.call(newDet.querySelectorAll('[id]')).forEach(function (el) { if (el.id) el.id = el.id.replace(origId, newId); });
                    // update name attributes and clear values
                    Array.prototype.slice.call(newDet.querySelectorAll('[name]')).forEach(function (el) {
                        if (el.name) el.name = el.name.replace(origId, newId);
                        try {
                            if (el.type === 'checkbox' || el.type === 'radio') el.checked = false;
                            else el.value = '';
                            el.disabled = false;
                            if (el.classList && el.classList.contains('priority-select')) { el.style.backgroundColor = ''; el.classList.remove('prio-1','prio-2','prio-3'); }
                            if (el.classList && el.classList.contains('condicion-select')) { el.style.backgroundColor = ''; el.classList.remove('cond-ok','cond-bad','cond-na','cond-leve','cond-medio','cond-alto','cond-critico'); }
                        } catch (e) { }
                    });
                }

                // insert cloned nodes after the original details block (or after the original checkbox if no details)
                var insertAfter = origDet ? origDet : origChk;
                var parent = insertAfter.parentNode;
                var ref = insertAfter.nextSibling;
                var frag = document.createDocumentFragment();
                frag.appendChild(newChk);
                if (newLabel) frag.appendChild(newLabel);
                frag.appendChild(newDone);
                frag.appendChild(newUpdate);
                frag.appendChild(newDup);
                frag.appendChild(newClear);
                frag.appendChild(br);
                if (newDet) frag.appendChild(newDet);
                if (ref) parent.insertBefore(frag, ref);
                else parent.appendChild(frag);

                // attach controls to the clone
                setupItemControlsFor(newId);

                // attach map picker to the new Lugar input
                try {
                    if (newDet) {
                        var lugarInput = newDet.querySelector('input[name*="lugar"]');
                        if (lugarInput) {
                            lugarInput.addEventListener('click', function (e) {
                                e.preventDefault();
                                if (window.openMapPicker) window.openMapPicker(lugarInput);
                            });
                            lugarInput.style.cursor = 'pointer';
                            lugarInput.setAttribute('placeholder', 'Click para seleccionar en mapa');
                            lugarInput.style.pointerEvents = 'auto';
                        }
                    }
                } catch (e) { }

                // also attach hallazgo 'Otro' handler if present
                try {
                    var hallSelect = document.getElementById('hallazgo_' + newId);
                    var hallOther = document.getElementById('hallazgo_other_' + newId);
                    if (hallSelect && hallOther) {
                        hallSelect.addEventListener('change', function () { if (hallSelect.value === 'Otro') hallOther.style.display = 'block'; else { hallOther.style.display = 'none'; hallOther.value = ''; } });
                        hallSelect.dispatchEvent(new Event('change'));
                    }
                } catch (e) { }

                // attach priority/condition color handlers for the clone
                try {
                    var prio = newDet ? newDet.querySelector('select.priority-select') : null;
                    if (prio) { prio.addEventListener('change', function () { var v = prio.value; var colorMap = { '1': '#28a745', '2': '#ffc107', '3': '#ff8c00' }; prio.style.backgroundColor = colorMap[v] || ''; }); }
                    var cond = newDet ? newDet.querySelector('select.condicion-select') : null;
                    if (cond) { cond.addEventListener('change', function () { var v = cond.value; var condMap = { 'Satisfactorio': '#28a745', 'No Satisfactorio': '#dc3545', 'N/A': '#6c757d' }; cond.style.backgroundColor = condMap[v] || ''; }); }
                } catch (e) { }
            }

            // Crear y conectar botones + para los items existentes
            baseItemIds.forEach(function (id) {
                var doneBtn = document.getElementById('done_' + id);
                // crear botón duplicar si no existe
                if (!document.getElementById('dup_' + id)) {
                    var dup = document.createElement('button'); dup.type = 'button'; dup.id = 'dup_' + id; dup.className = 'item-duplicate'; dup.style.marginLeft = '6px'; dup.style.display = 'none'; dup.textContent = '+';
                    if (doneBtn && doneBtn.parentNode) doneBtn.parentNode.insertBefore(dup, doneBtn.nextSibling);
                    else {
                        var chk = document.getElementById(id);
                        if (chk && chk.parentNode) chk.parentNode.insertBefore(dup, chk.nextSibling);
                    }
                }
                if (!document.getElementById('clear_' + id)) {
                    var clearBtn = document.createElement('button'); clearBtn.type = 'button'; clearBtn.id = 'clear_' + id; clearBtn.className = 'item-done item-clear'; clearBtn.style.marginLeft = '6px'; clearBtn.style.cssFloat = 'right'; clearBtn.style.display = 'none'; clearBtn.textContent = 'Clear';
                    var doneBtnLocal = document.getElementById('done_' + id);
                    if (doneBtnLocal && doneBtnLocal.parentNode) doneBtnLocal.parentNode.insertBefore(clearBtn, doneBtnLocal.nextSibling);
                    else {
                        var chk2 = document.getElementById(id);
                        if (chk2 && chk2.parentNode) chk2.parentNode.insertBefore(clearBtn, chk2.nextSibling);
                    }
                }
                // setup controls for existing and future clones
                setupItemControlsFor(id);
            });
            // Exponer API mínima para duplicar desde fuera (necesario para restauración)
            try { window.mhr = window.mhr || {}; window.mhr.duplicateItem = duplicateItem; window.mhr.counters = counters; window.mhr.setupItemControlsFor = setupItemControlsFor; } catch (e) { }
        })();
