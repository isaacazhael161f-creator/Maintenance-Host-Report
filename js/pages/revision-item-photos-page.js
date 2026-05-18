(function () {
        // Almacén global: { [itemId]: [{dataURL, name}, ...] }
        window.itemPhotos = window.itemPhotos || {};

        /**
         * Inyecta el campo de fotos en el panel de detalles de un item.
         * Se inserta después del <br> que sigue al label de Condición.
         */
        function injectPhotoField(det) {
            if (!det || det.querySelector('.photo-upload-area')) return; // ya existe
            if (det.id && det.id.indexOf('fauna_details_') === 0) return; // fauna ya tiene su propio bloque de evidencias
            var condSelect = det.querySelector('.condicion-select');
            if (!condSelect) return;

            // Buscar el <br> inmediato después del label/select de condición
            var condLabel = condSelect.closest ? condSelect.closest('label') : condSelect.parentElement;
            var refNode = null;
            // Recorrer desde condLabel buscando un <br> hermano siguiente
            var sibling = (condLabel || condSelect).nextSibling;
            while (sibling) {
                if (sibling.nodeName === 'BR') { refNode = sibling.nextSibling; break; }
                sibling = sibling.nextSibling;
            }

            // Crear el campo de foto
            var wrapper = document.createElement('div');
            wrapper.className = 'photo-upload-area';
            wrapper.innerHTML =
                '<div style="font-size:13px;color:#374151;margin-bottom:4px;">📷 Evidencias fotográficas (opcional)</div>' +
                '<div class="photo-upload-btns">' +
                '<label class="photo-upload-label">📁 Adjuntar archivo<input type="file" class="photo-upload-input" accept="image/*" multiple></label>' +
                '<label class="photo-upload-label photo-camera-label">📸 Tomar foto<input type="file" class="photo-upload-input" accept="image/*" capture="environment"></label>' +
                '</div>' +
                '<div class="photo-previews"></div>';
            var br = document.createElement('br');

            if (refNode) {
                det.insertBefore(wrapper, refNode);
                det.insertBefore(br, refNode);
            } else {
                // Insertar antes de Observaciones si no hay referencia
                var obsLabel = null;
                var children = det.childNodes;
                for (var i = 0; i < children.length; i++) {
                    var n = children[i];
                    if (n.nodeName === 'LABEL' && n.textContent && /observac/i.test(n.textContent)) {
                        obsLabel = n; break;
                    }
                }
                if (obsLabel) {
                    det.insertBefore(br, obsLabel);
                    det.insertBefore(wrapper, br);
                } else {
                    det.appendChild(wrapper);
                }
            }
        }

        /** Obtiene el itemId a partir del panel de detalles */
        function getItemId(det) {
            if (!det || !det.id) return null;
            return det.id.replace(/^details_/, '');
        }

        /** Renderiza las miniaturas en el container de previews */
        function renderPreviews(det) {
            var itemId = getItemId(det);
            if (!itemId) return;
            var previewsDiv = det.querySelector('.photo-previews');
            if (!previewsDiv) return;
            previewsDiv.innerHTML = '';
            var photos = window.itemPhotos[itemId] || [];
            photos.forEach(function (photo, idx) {
                var wrapper = document.createElement('div');
                wrapper.className = 'photo-thumb-wrapper';
                var img = document.createElement('img');
                img.src = photo.dataURL;
                img.className = 'photo-thumb';
                img.alt = photo.name || ('Foto ' + (idx + 1));
                var removeBtn = document.createElement('button');
                removeBtn.type = 'button';
                removeBtn.className = 'photo-thumb-remove';
                removeBtn.title = 'Eliminar foto';
                removeBtn.textContent = '×';
                removeBtn.setAttribute('data-item-id', itemId);
                removeBtn.setAttribute('data-photo-idx', idx);
                wrapper.appendChild(img);
                wrapper.appendChild(removeBtn);
                previewsDiv.appendChild(wrapper);
            });
        }

        /** Maneja el cambio en un input de archivo */
        function handleFileChange(input) {
            var det = input.closest ? input.closest('.item-details') : null;
            if (!det) { var p = input.parentElement; while (p && !p.classList.contains('item-details')) p = p.parentElement; det = p; }
            if (!det) return;
            var itemId = getItemId(det);
            if (!itemId) return;
            window.itemPhotos[itemId] = window.itemPhotos[itemId] || [];
            var files = Array.prototype.slice.call(input.files || []);
            var pending = files.length;
            if (!pending) return;
            files.forEach(function (file) {
                var reader = new FileReader();
                reader.onload = function (e) {
                    window.itemPhotos[itemId].push({ dataURL: e.target.result, name: file.name });
                    pending--;
                    if (pending === 0) {
                        renderPreviews(det);
                        input.value = ''; // reset para permitir re-seleccionar misma imagen
                    }
                };
                reader.readAsDataURL(file);
            });
        }

        // Delegación de eventos: cambio en file input de fotos
        document.addEventListener('change', function (e) {
            if (e.target && e.target.classList && e.target.classList.contains('photo-upload-input')) {
                handleFileChange(e.target);
            }
        });

        // Delegación de eventos: eliminar foto
        document.addEventListener('click', function (e) {
            if (e.target && e.target.classList && e.target.classList.contains('photo-thumb-remove')) {
                var itemId = e.target.getAttribute('data-item-id');
                var idx = parseInt(e.target.getAttribute('data-photo-idx'), 10);
                if (itemId && !isNaN(idx) && window.itemPhotos[itemId]) {
                    window.itemPhotos[itemId].splice(idx, 1);
                    // re-render previews
                    var det = document.getElementById('details_' + itemId);
                    if (det) renderPreviews(det);
                }
            }
        });

        // Inyectar campo de fotos en todos los item-details al cargar
        document.addEventListener('DOMContentLoaded', function () {
            var dets = document.querySelectorAll('.item-details');
            Array.prototype.forEach.call(dets, function (det) { injectPhotoField(det); });
        });

        // Parchear duplicateItem para inyectar fotos en el clon
        var originalSetup = null;
        var checkPatch = setInterval(function () {
            if (window.mhr && window.mhr.duplicateItem) {
                clearInterval(checkPatch);
                var origDup = window.mhr.duplicateItem;
                window.mhr.duplicateItem = function (origId) {
                    origDup(origId);
                    // El clon se inserta en el DOM; encontrarlo y agregarle fotos
                    setTimeout(function () {
                        var counters = window.mhr.counters || {};
                        var suffix = '_dup' + (counters[origId] || 1);
                        var newDetId = 'details_' + origId + suffix;
                        var newDet = document.getElementById(newDetId);
                        if (newDet) {
                            // Eliminar campo de fotos clonado (vendrá con valores del clon) y reinsertar limpio
                            var existingArea = newDet.querySelector('.photo-upload-area');
                            if (existingArea) existingArea.parentNode && existingArea.parentNode.removeChild(existingArea);
                            injectPhotoField(newDet);
                        }
                    }, 50);
                };
            }
        }, 200);

        // Exponer helper para el PDF
        window.mhr = window.mhr || {};
        window.mhr.getItemPhotos = function (itemId) { return window.itemPhotos[itemId] || []; };
    })();
