(function () {
            // Gestión de items de Fauna Impacto con botones Done/Update/Duplicate/Clear
            var counters = {};
            var faunaItemIds = ['fauna_avistamiento'];

            function setupFaunaItemControlsFor(id) {
                var chk = document.getElementById(id);
                var itemType = id.replace('fauna_', '');
                var det = document.getElementById('fauna_details_' + itemType);
                var doneBtn = document.getElementById('done_' + id);
                var updateBtn = document.getElementById('update_' + id);
                var dupBtn = document.getElementById('dup_' + id);
                var clearBtn = document.getElementById('clear_' + id);

                if (!chk || !det) {
                    return;
                }
                var isPrimaryAvistamiento = (id === 'fauna_avistamiento');
                if (isPrimaryAvistamiento) {
                    chk.checked = true;
                    det.style.display = 'block';
                }

                // Mostrar/ocultar detalles cuando cambia el checkbox
                chk.addEventListener('change', function () {
                    if (isPrimaryAvistamiento) {
                        chk.checked = true;
                        det.style.display = 'block';
                        refresh();
                        return;
                    }
                    det.style.display = chk.checked ? 'block' : 'none';
                    refresh();
                });

                // Botón DONE: bloquea el item
                if (doneBtn) {
                    doneBtn.addEventListener('click', function (e) {
                        e.preventDefault();
                        chk.disabled = true;
                        // Deshabilitar todos los inputs/selects/textareas en el detalle
                        try {
                            var fields = det.querySelectorAll('input, textarea, select');
                            fields.forEach(function (el) { 
                                if (el.type !== 'checkbox' && el.type !== 'radio') {
                                    el.disabled = true;
                                }
                            });
                        } catch (e) { }
                        refresh();
                    });
                }

                // Botón UPDATE: desbloquea el item
                if (updateBtn) {
                    updateBtn.addEventListener('click', function (e) {
                        e.preventDefault();
                        chk.disabled = false;
                        // Habilitar todos los inputs/selects/textareas en el detalle
                        try {
                            var fields = det.querySelectorAll('input, textarea, select');
                            fields.forEach(function (el) { 
                                if (el.type !== 'checkbox' && el.type !== 'radio') {
                                    el.disabled = false;
                                }
                            });
                        } catch (e) { }
                        refresh();
                    });
                }

                // Botón DUPLICATE: crear clon del item
                if (dupBtn) {
                    dupBtn.addEventListener('click', function (e) {
                        e.preventDefault();
                        duplicateFaunaItem(id);
                    });
                }

                // Botón CLEAR: limpiar el item
                if (clearBtn) {
                    clearBtn.addEventListener('click', function (e) {
                        e.preventDefault();
                        // Desmarcar el checkbox
                        chk.checked = isPrimaryAvistamiento ? true : false;
                        chk.disabled = false;
                        det.style.display = isPrimaryAvistamiento ? 'block' : 'none';
                        // Limpiar todos los campos
                        try {
                            var inputs = det.querySelectorAll('input, textarea, select');
                            inputs.forEach(function (el) {
                                if (el.type === 'checkbox' || el.type === 'radio') {
                                    el.checked = false;
                                } else {
                                    el.value = '';
                                }
                                el.disabled = false;
                            });
                        } catch (e) { }
                        refresh();
                    });
                }

                // Función para actualizar la visibilidad de botones
                function refresh() {
                    var isDone = chk.disabled;
                    var isChecked = chk.checked;

                    if (isDone) {
                        if (doneBtn) doneBtn.style.display = 'none';
                        if (updateBtn) updateBtn.style.display = 'inline-block';
                        if (dupBtn) dupBtn.style.display = 'none';
                        if (clearBtn) clearBtn.style.display = 'none';
                    } else if (isChecked) {
                        if (doneBtn) doneBtn.style.display = 'inline-block';
                        if (updateBtn) updateBtn.style.display = 'none';
                        if (dupBtn) dupBtn.style.display = 'inline-block';
                        if (clearBtn) clearBtn.style.display = 'inline-block';
                    } else {
                        if (doneBtn) doneBtn.style.display = 'none';
                        if (updateBtn) updateBtn.style.display = 'none';
                        if (dupBtn) dupBtn.style.display = 'none';
                        if (clearBtn) clearBtn.style.display = 'none';
                    }
                    if (isPrimaryAvistamiento) {
                        chk.checked = true;
                        det.style.display = 'block';
                    }
                }

                // Inicializar estado visual
                refresh();
            }

            function duplicateFaunaItem(origId) {
                var origChk = document.getElementById(origId);
                var origItemType = origId.replace('fauna_', '');
                var origDet = document.getElementById('fauna_details_' + origItemType);
                
                if (!origChk || !origDet) return;

                counters[origId] = (counters[origId] || 0) + 1;
                var newId = origId + '_dup' + counters[origId];

                // Crear el nuevo checkbox
                var newChk = document.createElement('input');
                newChk.type = 'checkbox';
                newChk.id = newId;
                newChk.name = origChk.name;
                newChk.value = origChk.value;
                newChk.checked = false;
                newChk.disabled = false;

                // Crear la nueva etiqueta
                var origLabel = document.querySelector('label[for="' + origId + '"]');
                var newLabel = document.createElement('label');
                newLabel.setAttribute('for', newId);
                newLabel.textContent = origLabel ? origLabel.textContent : origId;

                // Crear el nuevo detalle clonando el original
                var newDet = origDet.cloneNode(true);
                var newItemType = newId.replace('fauna_', '');
                newDet.id = 'fauna_details_' + newItemType;
                newDet.style.display = 'none';
                
                // Actualizar IDs y nombres dentro del detalle clonado
                try {
                    var allEls = newDet.querySelectorAll('[id]');
                    allEls.forEach(function (el) {
                        if (el.id.includes(origId)) {
                            el.id = el.id.replace(origId, newId);
                        }
                    });
                } catch (e) { }

                try {
                    var namedEls = newDet.querySelectorAll('[name]');
                    namedEls.forEach(function (el) {
                        if (el.name && el.name.includes(origId)) {
                            el.name = el.name.replace(origId, newId);
                        }
                    });
                } catch (e) { }

                // Limpiar valores en el detalle clonado
                try {
                    var inputs = newDet.querySelectorAll('input, textarea, select');
                    inputs.forEach(function (el) {
                        if (el.type === 'checkbox' || el.type === 'radio') {
                            el.checked = false;
                        } else {
                            el.value = '';
                        }
                        el.disabled = false;
                    });
                } catch (e) { }

                // Insertar después del detalle original
                var parent = origDet.parentNode;
                var br = document.createElement('br');
                parent.insertBefore(br, origDet.nextSibling);
                parent.insertBefore(newDet, br);
                parent.insertBefore(newLabel, newDet);
                parent.insertBefore(newChk, newLabel);

                // Configurar controles para el nuevo item
                setupFaunaItemControlsFor(newId);
            }

            // Inicializar cuando el DOM esté listo
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', initializeFaunaItems);
            } else {
                initializeFaunaItems();
            }

            function initializeFaunaItems() {
                setTimeout(function() {
                    faunaItemIds.forEach(function (id) {
                        setupFaunaItemControlsFor(id);
                    });
                }, 0);
            }
        })();
