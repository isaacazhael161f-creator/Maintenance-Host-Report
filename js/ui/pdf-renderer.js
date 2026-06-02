window.MHRPdfRenderer = (function () {
    function renderRevisionPdf(options) {
        var html = options.html;
        var filename = options.filename;
        var submitBtn = options.submitBtn;
        var originalBtnText = options.originalBtnText;
        var onBlobReady = options.onBlobReady;

        var spinner = document.getElementById('pdf-spinner');
        var preview = document.getElementById('pdf-preview-container');
        try { if (spinner) spinner.style.display = 'flex'; } catch (e) { }

        var opt = {
            margin: [8, 8, 8, 8],
            filename: filename,
            image: { type: 'jpeg', quality: 0.82 },
            html2canvas: {
                scale: 1.5,
                useCORS: true,
                allowTaint: true,
                logging: false
            },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        // Pasar el HTML directamente como string — html2pdf 0.9.3 crea y gestiona el
        // contenedor internamente: lo agrega al DOM en posición renderizable, captura con
        // html2canvas y lo elimina al terminar. Esto resuelve el problema del PDF en blanco
        // causado por renderizar elementos ocultos o fuera del área de captura.
        html2pdf().set(opt).from(html, 'string').toPdf().get('pdf').then(async function (pdf) {
            // --- Página de mapa unificado con todos los pins (Leaflet, landscape A4) ---
            var mapItems = options.mapItems;
            var mapCaption = options.mapCaption || '';
            if (mapItems && mapItems.length > 0 && typeof window.L !== 'undefined' && typeof window.html2canvas === 'function') {
                var _mapWrap;
                var _tempMap;
                try {
                    function _esc(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

                    // Contenedor de página A4 landscape
                    _mapWrap = document.createElement('div');
                    _mapWrap.style.cssText = 'position:fixed;top:0;left:-1400px;width:1122px;height:794px;background:#fff;font-family:Arial,Helvetica,sans-serif;overflow:hidden;';

                    // Cabecera con leyenda de pins
                    var _hdr = '<div style="padding:12px 22px 0 22px;">';
                    _hdr += '<table style="width:100%;border-collapse:collapse;"><tbody><tr>';
                    _hdr += '<td style="vertical-align:bottom;">';
                    _hdr += '<span style="font-size:15px;font-weight:700;color:#0b66c3;">Ubicaciones de Hallazgos</span>';
                    _hdr += '<span style="font-size:10px;color:#6b7280;margin-left:14px;">' + _esc(mapCaption) + '</span>';
                    _hdr += '</td><td style="text-align:right;vertical-align:bottom;">';
                    mapItems.forEach(function (it) {
                        _hdr += '<span style="display:inline-flex;align-items:center;gap:5px;margin-left:10px;font-size:10px;color:#374151;">';
                        _hdr += '<span style="display:inline-flex;align-items:center;justify-content:center;width:18px;height:18px;border-radius:50%;background:#dc2626;color:#fff;font-size:9px;font-weight:700;flex-shrink:0;">' + it.num + '</span>';
                        _hdr += _esc(it.name) + '</span>';
                    });
                    _hdr += '</td></tr></tbody></table>';
                    _hdr += '<div style="border-top:2px solid #0b66c3;margin-top:6px;"></div>';
                    _hdr += '</div>';

                    // Div del mapa Leaflet (ocupa resto de la página)
                    var _mapId = 'pdf-leaflet-map-' + Date.now();
                    _hdr += '<div id="' + _mapId + '" style="width:1122px;height:730px;"></div>';
                    _mapWrap.innerHTML = _hdr;
                    document.body.appendChild(_mapWrap);

                    // Inicializar mapa Leaflet
                    _tempMap = window.L.map(_mapId, {
                        zoomControl: false,
                        attributionControl: false,
                        preferCanvas: true,
                        fadeAnimation: false,
                        zoomAnimation: false
                    });
                    window.L.tileLayer('https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
                        subdomains: ['mt0','mt1','mt2','mt3'],
                        maxZoom: 20,
                        crossOrigin: true
                    }).addTo(_tempMap);

                    // Agregar pins numerados
                    var _latlngs = [];
                    mapItems.forEach(function (it) {
                        var parts = (it.coords || '').split(',');
                        var lat = parseFloat(parts[0]);
                        var lng = parseFloat(parts[1]);
                        if (isNaN(lat) || isNaN(lng)) return;
                        var _icon = window.L.divIcon({
                            className: '',
                            html: '<div style="display:flex;flex-direction:column;align-items:center;">' +
                                  '<div style="background:#dc2626;color:#fff;font-size:13px;font-weight:700;width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.55);">' + it.num + '</div>' +
                                  '<div style="width:0;height:0;border-left:7px solid transparent;border-right:7px solid transparent;border-top:12px solid #dc2626;margin-top:-1px;"></div>' +
                                  '</div>',
                            iconSize: [30, 42],
                            iconAnchor: [15, 42]
                        });
                        window.L.marker([lat, lng], { icon: _icon }).addTo(_tempMap);
                        _latlngs.push([lat, lng]);
                    });

                    // Siempre encuadrar el aeródromo AIFA completo (bounds fijos)
                    // independientemente de cuántos pines haya o dónde estén.
                    var _airportBounds = window.L.latLngBounds(
                        [19.730, -99.035],   // SW corner
                        [19.767, -98.985]    // NE corner
                    );
                    _tempMap.fitBounds(_airportBounds, { padding: [10, 10] });

                    // Esperar a que carguen los tiles (máx 2 s)
                    await new Promise(function (resolve) {
                        var _done = false;
                        function _finish() { if (!_done) { _done = true; resolve(); } }
                        _tempMap.once('load', _finish);
                        setTimeout(_finish, 2000);
                    });
                    // Pausa extra para que el canvas de Leaflet se pinte
                    await new Promise(function (resolve) { setTimeout(resolve, 200); });

                    var _mapCanvas = await window.html2canvas(_mapWrap, {
                        scale: 1.5,
                        useCORS: true,
                        allowTaint: true,
                        logging: false,
                        width: 1122,
                        height: 794
                    });

                    _tempMap.remove();
                    document.body.removeChild(_mapWrap);
                    _mapWrap = null;

                    pdf.addPage([297, 210], 'l');
                    pdf.addImage(_mapCanvas.toDataURL('image/jpeg', 0.82), 'JPEG', 0, 0, 297, 210);

                } catch (_mapErr) {
                    try { if (_tempMap) _tempMap.remove(); } catch(e) {}
                    if (_mapWrap && _mapWrap.parentNode) _mapWrap.parentNode.removeChild(_mapWrap);
                    console.warn('Error al generar página de mapa unificado:', _mapErr);
                }
            }

            // --- Páginas de evidencias fotográficas (landscape A4) — renderizado en paralelo ---
            var photosHtml = options.photosHtml;
            if (photosHtml && photosHtml.length > 0 && typeof window.html2canvas === 'function') {
                // Lanzar todos los renders simultáneamente
                var _photoTasks = photosHtml.map(function (pageHtml) {
                    var _div = document.createElement('div');
                    _div.style.cssText = 'position:fixed;top:0;left:-1200px;width:1122px;height:794px;overflow:hidden;background:#fff;';
                    _div.innerHTML = pageHtml;
                    document.body.appendChild(_div);
                    return window.html2canvas(_div, {
                        scale: 1.5,
                        useCORS: true,
                        allowTaint: true,
                        logging: false,
                        width: 1122,
                        height: 794
                    }).then(function (canvas) {
                        document.body.removeChild(_div);
                        return canvas;
                    }).catch(function (_photoErr) {
                        if (_div.parentNode) document.body.removeChild(_div);
                        console.warn('Error al renderizar página de evidencias:', _photoErr);
                        return null;
                    });
                });
                // Esperar todos y agregar al PDF en orden
                var _photoCanvases = await Promise.all(_photoTasks);
                _photoCanvases.forEach(function (canvas) {
                    if (!canvas) return;
                    pdf.addPage([297, 210], 'l');
                    pdf.addImage(canvas.toDataURL('image/jpeg', 0.82), 'JPEG', 0, 0, 297, 210);
                });
            }

            var blob;
            try {
                blob = pdf.output('blob');
            } catch (e) {
                blob = new Blob([pdf.output('arraybuffer')], { type: 'application/pdf' });
            }

            if (!blob) return;

            // Mostrar vista previa de inmediato — no esperar a Supabase
            var url = URL.createObjectURL(blob);
            var iframe = document.getElementById('pdf-preview-frame');
            var downloadBtn = document.getElementById('pdf-download-btn');
            var closeBtn = document.getElementById('pdf-preview-close');

            if (spinner) spinner.style.display = 'none';
            if (submitBtn) {
                submitBtn.disabled = false;
                if (submitBtn.tagName === 'BUTTON') submitBtn.textContent = originalBtnText;
                else submitBtn.value = originalBtnText;
            }

            if (iframe) iframe.src = url;
            if (preview) {
                preview.style.setProperty('display', 'flex', 'important');
                preview.setAttribute('aria-hidden', 'false');
            }
            var backdrop = document.getElementById('pdf-modal-backdrop');
            if (backdrop) backdrop.style.setProperty('display', 'block', 'important');

            if (downloadBtn) {
                downloadBtn.onclick = function () {
                    var a = document.createElement('a');
                    a.href = url;
                    a.download = filename;
                    a.click();
                };
            }
            if (closeBtn) {
                closeBtn.onclick = function () {
                    if (preview) preview.style.setProperty('display', 'none', 'important');
                    if (backdrop) backdrop.style.setProperty('display', 'none', 'important');
                    if (iframe) iframe.src = '';
                };
            }

            // Guardar en Supabase en segundo plano (no bloquea la vista previa)
            if (typeof onBlobReady === 'function') {
                onBlobReady(blob).catch(function (e) { console.error('Error al guardar reporte en Supabase:', e); });
            }
        });
    }

    return { renderRevisionPdf: renderRevisionPdf };
})();
