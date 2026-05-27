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
            image: { type: 'jpeg', quality: 0.95 },
            html2canvas: {
                scale: 2,
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
            // --- Páginas de evidencias fotográficas (landscape A4) ---
            var photosHtml = options.photosHtml;
            if (photosHtml && photosHtml.length > 0 && typeof window.html2canvas === 'function') {
                for (var _ppi = 0; _ppi < photosHtml.length; _ppi++) {
                    var _tempDiv;
                    try {
                        _tempDiv = document.createElement('div');
                        _tempDiv.style.cssText = 'position:fixed;top:0;left:-1200px;width:1122px;height:794px;overflow:hidden;background:#fff;';
                        _tempDiv.innerHTML = photosHtml[_ppi];
                        document.body.appendChild(_tempDiv);

                        var _photoCanvas = await window.html2canvas(_tempDiv, {
                            scale: 2,
                            useCORS: true,
                            allowTaint: true,
                            logging: false,
                            width: 1122,
                            height: 794
                        });

                        document.body.removeChild(_tempDiv);
                        _tempDiv = null;

                        pdf.addPage([297, 210], 'l');
                        pdf.addImage(_photoCanvas.toDataURL('image/jpeg', 0.88), 'JPEG', 0, 0, 297, 210);
                    } catch (_photoErr) {
                        if (_tempDiv && _tempDiv.parentNode) _tempDiv.parentNode.removeChild(_tempDiv);
                        console.warn('Error al añadir página de evidencias:', _photoErr);
                    }
                }
            }

            var blob;
            try {
                blob = pdf.output('blob');
            } catch (e) {
                blob = new Blob([pdf.output('arraybuffer')], { type: 'application/pdf' });
            }

            if (blob && typeof onBlobReady === 'function') {
                try { await onBlobReady(blob); } catch (e) { console.error(e); }
            }

            if (spinner) spinner.style.display = 'none';
            if (submitBtn) {
                submitBtn.disabled = false;
                if (submitBtn.tagName === 'BUTTON') submitBtn.textContent = originalBtnText;
                else submitBtn.value = originalBtnText;
            }

            if (!blob) return;
            var url = URL.createObjectURL(blob);
            var iframe = document.getElementById('pdf-preview-frame');
            var downloadBtn = document.getElementById('pdf-download-btn');
            var closeBtn = document.getElementById('pdf-preview-close');

            if (iframe) iframe.src = url;
            if (preview) {
                preview.style.setProperty('display', 'flex', 'important');
                preview.setAttribute('aria-hidden', 'false');
            }
            var backdrop = document.getElementById('pdf-modal-backdrop');
            if (backdrop) {
                backdrop.style.setProperty('display', 'block', 'important');
            }

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
        });
    }

    return { renderRevisionPdf: renderRevisionPdf };
})();
