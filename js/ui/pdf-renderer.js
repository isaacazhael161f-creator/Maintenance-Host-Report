/**
 * pdf-renderer.js
 * Genera el PDF del Formato de Revisión de Seguridad Operacional.
 *
 * Estrategia robusta:
 *   1. Crear un div real en el DOM (fuera de pantalla) con el HTML del reporte.
 *   2. Capturar con html2canvas 1.4.1 (cargado por separado, probado y estable).
 *   3. Dividir el canvas en páginas A4 y construir el PDF con jsPDF 2.5.1.
 *   4. Agregar páginas de mapa y evidencias (si existen).
 *   5. Mostrar vista previa en el modal e invocar onBlobReady en segundo plano.
 *
 * SIN dependencia de html2pdf (su cadena .from('string') falla con layouts desconectados).
 */
window.MHRPdfRenderer = (function () {

    // ─── helpers ──────────────────────────────────────────────────────────────
    function _getJsPDF() {
        if (window.jspdf && window.jspdf.jsPDF) return window.jspdf.jsPDF;
        if (window.jsPDF) return window.jsPDF;
        return null;
    }

    function _restoreBtn(submitBtn, originalBtnText) {
        if (!submitBtn) return;
        submitBtn.disabled = false;
        if (submitBtn.tagName === 'BUTTON') submitBtn.textContent = originalBtnText;
        else submitBtn.value = originalBtnText;
    }

    // ─── main ─────────────────────────────────────────────────────────────────
    function renderRevisionPdf(options) {
        var html            = options.html;
        var filename        = options.filename;
        var submitBtn       = options.submitBtn;
        var originalBtnText = options.originalBtnText;
        var onBlobReady     = options.onBlobReady;
        var mapItems        = options.mapItems   || null;
        var mapCaption      = options.mapCaption || '';
        var photosHtml      = options.photosHtml || null;

        var spinner  = document.getElementById('pdf-spinner');
        var preview  = document.getElementById('pdf-preview-container');
        var backdrop = document.getElementById('pdf-modal-backdrop');
        var iframe   = document.getElementById('pdf-preview-frame');

        // Mostrar spinner fijo (cubre pantalla)
        if (spinner) {
            spinner.style.cssText = [
                'display:flex !important',
                'position:fixed !important',
                'inset:0 !important',
                'z-index:20000 !important',
                'background:rgba(255,255,255,0.93) !important',
                'align-items:center !important',
                'justify-content:center !important'
            ].join(';');
        }
        if (iframe) iframe.src = '';

        // Timeout de seguridad: 60 segundos
        var _timedOut = false;
        var _timer = setTimeout(function () {
            _timedOut = true;
            if (spinner) spinner.removeAttribute('style');
            _restoreBtn(submitBtn, originalBtnText);
            alert('El PDF tardó demasiado. Intenta de nuevo.');
        }, 60000);

        (async function _generate() {
            var _container = null;
            try {
                // ── 1. Verificar dependencias ──────────────────────────────────
                if (typeof window.html2canvas !== 'function') {
                    throw new Error('html2canvas no está disponible. Recarga la página.');
                }
                var JsPDF = _getJsPDF();
                if (!JsPDF) {
                    throw new Error('jsPDF no está disponible. Recarga la página.');
                }

                // ── 2. Crear contenedor real en el DOM ─────────────────────────
                // html2canvas necesita un elemento ADJUNTO al DOM con
                // dimensiones reales. Posicionamos fuera de pantalla.
                _container = document.createElement('div');
                _container.setAttribute('aria-hidden', 'true');
                _container.style.cssText = [
                    'position:absolute',
                    'top:0',
                    'left:-9999px',
                    'width:794px',
                    'min-height:100px',
                    'background:#ffffff',
                    'font-family:Arial,Helvetica,sans-serif',
                    'z-index:-1',
                    'overflow:visible'
                ].join(';');
                _container.innerHTML = html;
                document.body.appendChild(_container);

                // Pausa para que el navegador aplique estilos y layout
                await new Promise(function (r) { setTimeout(r, 100); });

                if (_timedOut) return;

                // ── 2.b Recolectar anclas marcadas para anotaciones de enlace ─
                var pdfLinkAnchors = [];
                try {
                    var contRect = _container.getBoundingClientRect();
                    Array.prototype.forEach.call(
                        _container.querySelectorAll('[data-pdf-link]'),
                        function (el) {
                            var url = el.getAttribute('data-pdf-url') || el.getAttribute('href');
                            if (!url) return;
                            var r = el.getBoundingClientRect();
                            if (!r.width || !r.height) return;
                            pdfLinkAnchors.push({
                                url: url,
                                srcX: r.left - contRect.left,
                                srcY: r.top - contRect.top,
                                srcW: r.width,
                                srcH: r.height
                            });
                        }
                    );
                } catch (_e) { /* ignore */ }

                // ── 3. Capturar con html2canvas ────────────────────────────────
                var canvas = await window.html2canvas(_container, {
                    scale: 1.5,
                    useCORS: true,
                    allowTaint: true,
                    logging: false,
                    backgroundColor: '#ffffff',
                    width: 794,
                    windowWidth: 794
                });

                if (_container && _container.parentNode) {
                    document.body.removeChild(_container);
                    _container = null;
                }

                if (_timedOut) return;

                if (!canvas || canvas.width === 0 || canvas.height === 0) {
                    throw new Error('html2canvas produjo un canvas vacío. Intenta de nuevo.');
                }

                // ── 4. Construir PDF multi-página A4 ──────────────────────────
                var pdf      = new JsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
                var A4_W     = 210;
                var A4_H     = 297;
                var MARGIN   = 8;
                var contentW = A4_W - 2 * MARGIN;
                var contentH = A4_H - 2 * MARGIN;

                var pxPerMm  = canvas.width / A4_W;
                var pageH_px = Math.floor(contentH * pxPerMm);
                var totalPages = Math.ceil(canvas.height / pageH_px);

                // Escala usada por html2canvas (debe coincidir con scale arriba)
                var H2C_SCALE = 1.5;
                var canvasContentW_mm = contentW; // canvas se dibuja a este ancho en el PDF

                for (var p = 0; p < totalPages; p++) {
                    if (p > 0) pdf.addPage();
                    var srcY = p * pageH_px;
                    var srcH = Math.min(pageH_px, canvas.height - srcY);

                    var slice = document.createElement('canvas');
                    slice.width  = canvas.width;
                    slice.height = srcH;
                    var ctx = slice.getContext('2d');
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(0, 0, slice.width, slice.height);
                    ctx.drawImage(canvas, 0, srcY, canvas.width, srcH, 0, 0, canvas.width, srcH);

                    var sliceH_mm = srcH / pxPerMm;
                    pdf.addImage(
                        slice.toDataURL('image/jpeg', 0.88),
                        'JPEG', MARGIN, MARGIN, contentW, sliceH_mm
                    );

                    // ── Anotaciones de enlaces que caen en esta página ─────
                    if (pdfLinkAnchors.length) {
                        for (var _li = 0; _li < pdfLinkAnchors.length; _li++) {
                            var _a = pdfLinkAnchors[_li];
                            var aCY = _a.srcY * H2C_SCALE;
                            var aCH = _a.srcH * H2C_SCALE;
                            if (aCY + aCH < srcY) continue;
                            if (aCY > srcY + srcH) continue;
                            var topInPage = Math.max(aCY, srcY);
                            var botInPage = Math.min(aCY + aCH, srcY + srcH);
                            var pageRelY = topInPage - srcY;
                            var pageRelH = botInPage - topInPage;
                            var aCX = _a.srcX * H2C_SCALE;
                            var aCW = _a.srcW * H2C_SCALE;
                            var xMm = MARGIN + (aCX / canvas.width) * canvasContentW_mm;
                            var wMm = (aCW / canvas.width) * canvasContentW_mm;
                            var yMm = MARGIN + (pageRelY / pxPerMm);
                            var hMm = pageRelH / pxPerMm;
                            try { pdf.link(xMm, yMm, wMm, hMm, { url: _a.url }); } catch (_) { }
                        }
                    }
                }

                // ── 5. Página de mapa (Leaflet, landscape A4) ─────────────────
                if (mapItems && mapItems.length > 0 &&
                    typeof window.L !== 'undefined') {

                    var _mapWrap = null;
                    var _tempMap = null;
                    try {
                        function _esc(s) {
                            return String(s)
                                .replace(/&/g,'&amp;').replace(/</g,'&lt;')
                                .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
                        }

                        _mapWrap = document.createElement('div');
                        _mapWrap.style.cssText = 'position:fixed;top:0;left:-1400px;width:1122px;height:794px;background:#fff;font-family:Arial,Helvetica,sans-serif;overflow:hidden;z-index:-1;';

                        var _hdr = '<div style="padding:12px 22px 0 22px;">';
                        _hdr += '<table style="width:100%;border-collapse:collapse;"><tbody><tr>';
                        _hdr += '<td style="vertical-align:bottom;"><span style="font-size:15px;font-weight:700;color:#0b66c3;">Ubicaciones de Hallazgos</span>';
                        _hdr += '<span style="font-size:10px;color:#6b7280;margin-left:14px;">' + _esc(mapCaption) + '</span></td>';
                        _hdr += '<td style="text-align:right;vertical-align:bottom;">';
                        mapItems.forEach(function (it) {
                            _hdr += '<span style="display:inline-flex;align-items:center;gap:5px;margin-left:10px;font-size:10px;color:#374151;">';
                            _hdr += '<span style="display:inline-flex;align-items:center;justify-content:center;width:18px;height:18px;border-radius:50%;background:#dc2626;color:#fff;font-size:9px;font-weight:700;">' + it.num + '</span>';
                            _hdr += _esc(it.name) + '</span>';
                        });
                        _hdr += '</td></tr></tbody></table>';
                        _hdr += '<div style="border-top:2px solid #0b66c3;margin-top:6px;"></div></div>';

                        var _mapId = 'pdf-leaflet-map-' + Date.now();
                        _mapWrap.innerHTML = _hdr + '<div id="' + _mapId + '" style="width:1122px;height:730px;"></div>';
                        document.body.appendChild(_mapWrap);

                        _tempMap = window.L.map(_mapId, {
                            zoomControl: false, attributionControl: false,
                            preferCanvas: true, fadeAnimation: false, zoomAnimation: false
                        });
                        window.L.tileLayer('https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
                            subdomains: ['mt0','mt1','mt2','mt3'], maxZoom: 20, crossOrigin: true
                        }).addTo(_tempMap);

                        mapItems.forEach(function (it) {
                            var parts = (it.coords || '').split(',');
                            var lat = parseFloat(parts[0]), lng = parseFloat(parts[1]);
                            if (isNaN(lat) || isNaN(lng)) return;
                            var icon = window.L.divIcon({
                                className: '',
                                html: '<div style="display:flex;flex-direction:column;align-items:center;">' +
                                      '<div style="background:#dc2626;color:#fff;font-size:13px;font-weight:700;width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.55);">' + it.num + '</div>' +
                                      '<div style="width:0;height:0;border-left:7px solid transparent;border-right:7px solid transparent;border-top:12px solid #dc2626;margin-top:-1px;"></div></div>',
                                iconSize: [30,42], iconAnchor: [15,42]
                            });
                            window.L.marker([lat, lng], { icon: icon }).addTo(_tempMap);
                        });

                        _tempMap.fitBounds(
                            window.L.latLngBounds([19.730,-99.035],[19.767,-98.985]),
                            { padding: [10,10] }
                        );

                        await new Promise(function (resolve) {
                            var done = false;
                            function fin() { if (!done) { done = true; resolve(); } }
                            _tempMap.once('load', fin);
                            setTimeout(fin, 2500);
                        });
                        await new Promise(function (r) { setTimeout(r, 250); });

                        var _mapCanvas = await window.html2canvas(_mapWrap, {
                            scale: 1.5, useCORS: true, allowTaint: true, logging: false,
                            width: 1122, height: 794
                        });
                        _tempMap.remove(); _tempMap = null;
                        document.body.removeChild(_mapWrap); _mapWrap = null;

                        pdf.addPage([297,210], 'l');
                        pdf.addImage(_mapCanvas.toDataURL('image/jpeg', 0.85), 'JPEG', 0, 0, 297, 210);

                    } catch (_mapErr) {
                        console.warn('Error generando página de mapa (no crítico):', _mapErr);
                        try { if (_tempMap) _tempMap.remove(); } catch(e) {}
                        if (_mapWrap && _mapWrap.parentNode) _mapWrap.parentNode.removeChild(_mapWrap);
                    }
                }

                // ── 6. Páginas de evidencias fotográficas ─────────────────────
                if (photosHtml && photosHtml.length > 0) {
                    var _photoTasks = photosHtml.map(function (pageHtml) {
                        var _div = document.createElement('div');
                        _div.style.cssText = 'position:fixed;top:0;left:-1200px;width:1122px;height:794px;overflow:hidden;background:#fff;z-index:-1;';
                        _div.innerHTML = pageHtml;
                        document.body.appendChild(_div);
                        return window.html2canvas(_div, {
                            scale: 1.5, useCORS: true, allowTaint: true, logging: false,
                            width: 1122, height: 794
                        }).then(function (c) {
                            if (_div.parentNode) document.body.removeChild(_div);
                            return c;
                        }).catch(function (e) {
                            if (_div.parentNode) document.body.removeChild(_div);
                            console.warn('Error en página de fotos:', e);
                            return null;
                        });
                    });

                    var _photoCanvases = await Promise.all(_photoTasks);
                    _photoCanvases.forEach(function (c) {
                        if (!c) return;
                        pdf.addPage([297,210], 'l');
                        pdf.addImage(c.toDataURL('image/jpeg', 0.85), 'JPEG', 0, 0, 297, 210);
                    });
                }

                // ── 7. Mostrar vista previa ────────────────────────────────────
                clearTimeout(_timer);
                if (_timedOut) return;

                var blob = pdf.output('blob');
                var url  = URL.createObjectURL(blob);

                if (spinner) spinner.removeAttribute('style');
                _restoreBtn(submitBtn, originalBtnText);

                if (iframe) iframe.src = url;
                if (preview) {
                    preview.style.setProperty('display', 'flex', 'important');
                    preview.setAttribute('aria-hidden', 'false');
                }
                if (backdrop) backdrop.style.setProperty('display', 'block', 'important');

                var downloadBtn = document.getElementById('pdf-download-btn');
                var closeBtn    = document.getElementById('pdf-preview-close');

                if (downloadBtn) {
                    downloadBtn.onclick = function () {
                        var a = document.createElement('a');
                        a.href = url; a.download = filename; a.click();
                    };
                }
                if (closeBtn) {
                    closeBtn.onclick = function () {
                        if (preview) preview.style.setProperty('display', 'none', 'important');
                        if (backdrop) backdrop.style.setProperty('display', 'none', 'important');
                        if (iframe) iframe.src = '';
                    };
                }

                // Guardar en Supabase en segundo plano
                if (typeof onBlobReady === 'function') {
                    onBlobReady(blob).catch(function (e) {
                        console.error('Error guardando PDF en Supabase:', e);
                    });
                }

            } catch (err) {
                if (_container && _container.parentNode) {
                    try { document.body.removeChild(_container); } catch(e) {}
                }
                clearTimeout(_timer);
                if (_timedOut) return;
                if (spinner) spinner.removeAttribute('style');
                if (preview) preview.style.setProperty('display', 'none', 'important');
                if (backdrop) backdrop.style.setProperty('display', 'none', 'important');
                _restoreBtn(submitBtn, originalBtnText);
                console.error('Error generando PDF de revisión:', err);
                alert('Error al generar el PDF:\n\n' + (err && err.message ? err.message : String(err)));
            }
        })();
    }

    return { renderRevisionPdf: renderRevisionPdf };
})();
