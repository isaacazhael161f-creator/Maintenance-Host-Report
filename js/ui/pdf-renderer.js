window.MHRPdfRenderer = (function () {
    function renderRevisionPdf(options) {
        var container = options.container;
        var html = options.html;
        var filename = options.filename;
        var submitBtn = options.submitBtn;
        var originalBtnText = options.originalBtnText;
        var onBlobReady = options.onBlobReady;

        if (!container) return;

        container.innerHTML = html;
        container.style.display = 'block';
        container.style.position = 'fixed';
        container.style.left = '0';
        container.style.top = '0';
        container.style.width = '900px';
        container.style.zIndex = '0';
        container.style.visibility = 'visible';
        container.style.opacity = '0';
        container.style.pointerEvents = 'none';

        var opt = {
            margin: 10,
            filename: filename,
            image: { type: 'jpeg', quality: 0.95 },
            html2canvas: { scale: 2, useCORS: false, allowTaint: true, logging: false },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        var spinner = document.getElementById('pdf-spinner');
        var preview = document.getElementById('pdf-preview-container');
        try { if (spinner) spinner.style.display = 'flex'; } catch (e) { }

        var apCanvas = document.createElement('canvas');
        apCanvas.width = 1600;
        apCanvas.height = 1030;
        var ctx2d = apCanvas.getContext('2d');
        if (ctx2d) {
            ctx2d.fillStyle = '#1e3a5f';
            ctx2d.fillRect(0, 0, 1600, 1030);
        }

        html2pdf().set(opt).from(container).toPdf().get('pdf').then(async function (pdf) {
            if (apCanvas && apCanvas.width > 0) {
                try { pdf.addPage([297, 210], 'l'); pdf.addImage(apCanvas.toDataURL('image/jpeg', 0.94), 'JPEG', 4, 4, 289, 202); } catch (e) { }
            }

            var blob;
            try { blob = pdf.output('blob'); } catch (e) { blob = new Blob([pdf.output('arraybuffer')], { type: 'application/pdf' }); }

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
                preview.style.display = 'block';
                preview.setAttribute('aria-hidden', 'false');
            }
            if (downloadBtn) downloadBtn.onclick = function () { var a = document.createElement('a'); a.href = url; a.download = filename; a.click(); };
            if (closeBtn) closeBtn.onclick = function () { if (preview) preview.style.display = 'none'; if (iframe) iframe.src = ''; };

        }).catch(function (err) {
            console.error('Error generando PDF:', err);
            if (spinner) spinner.style.display = 'none';
            if (submitBtn) {
                submitBtn.disabled = false;
                if (submitBtn.tagName === 'BUTTON') submitBtn.textContent = originalBtnText;
                else submitBtn.value = originalBtnText;
            }
            alert('No se pudo generar el PDF. Reintenta.');
        }).finally(function () {
            try {
                container.innerHTML = '';
                container.style.display = 'none';
                container.style.position = '';
                container.style.left = '';
                container.style.top = '';
                container.style.width = '';
                container.style.zIndex = '';
                container.style.visibility = '';
                container.style.opacity = '';
                container.style.pointerEvents = '';
            } catch (e) { }
        });
    }

    return { renderRevisionPdf: renderRevisionPdf };
})();
