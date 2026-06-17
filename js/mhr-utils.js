(function () {
    window.MHRUtils = window.MHRUtils || (function () {
        function toArray(nodes) { return Array.prototype.slice.call(nodes || []); }
        function pad2(n) { return n.toString().padStart(2, '0'); }

        function bindLockSelect(selectEl, resetBtn, opts) {
            if (!selectEl || !resetBtn) return;
            if (selectEl.dataset.mhrLockBound === '1') return;
            var options = opts || {};
            var clearOnReset = !!options.clearOnReset;

            selectEl.addEventListener('change', function () {
                if (!selectEl.value) return;
                selectEl.disabled = true;
                resetBtn.style.display = 'inline-block';
            });

            resetBtn.addEventListener('click', function () {
                selectEl.disabled = false;
                if (clearOnReset) selectEl.value = '';
                resetBtn.style.display = 'none';
            });
            selectEl.dataset.mhrLockBound = '1';
        }

        function bindTurnoVisibility(tipoName, sectionId, turnoName) {
            var tipoEls = toArray(document.getElementsByName(tipoName));
            var turnoSection = document.getElementById(sectionId);
            if (!tipoEls.length || !turnoSection) return;
            if (turnoSection.dataset.mhrTurnoBound === '1') return;

            function update() {
                var anyChecked = tipoEls.some(function (i) { return !!i.checked; });
                turnoSection.style.display = anyChecked ? 'block' : 'none';
                if (!anyChecked && turnoName) {
                    toArray(document.getElementsByName(turnoName)).forEach(function (r) { r.checked = false; });
                }
            }
            tipoEls.forEach(function (el) { el.addEventListener('change', update); });
            update();
            turnoSection.dataset.mhrTurnoBound = '1';
        }

        function debounce(fn, waitMs) {
            var timer = null;
            var wait = Number(waitMs || 250);
            return function () {
                var ctx = this;
                var args = arguments;
                if (timer) clearTimeout(timer);
                timer = setTimeout(function () { fn.apply(ctx, args); }, wait);
            };
        }

        function renderRows(containerEl, rowElements) {
            if (!containerEl || !rowElements || !rowElements.length) return;
            var frag = document.createDocumentFragment();
            rowElements.forEach(function (row) { if (row) frag.appendChild(row); });
            containerEl.appendChild(frag);
        }

        return {
            pad2: pad2,
            bindLockSelect: bindLockSelect,
            bindTurnoVisibility: bindTurnoVisibility,
            debounce: debounce,
            renderRows: renderRows
        };
    })();

    // ── Global PDF preview helper ──────────────────────────────────────────
    window.mhrOpenPdfPreview = function (url) {
        if (!url) return;
        // Normalizar URL: si viene relativa, intentar resolverla al origen actual
        try {
            if (typeof url === 'string' && !/^https?:\/\//i.test(url) && !url.startsWith('blob:') && !url.startsWith('data:')) {
                url = new URL(url, window.location.origin).href;
            }
        } catch (_) { /* noop */ }

        var preview  = document.getElementById('pdf-preview-container');
        var backdrop = document.getElementById('pdf-modal-backdrop');
        var iframe   = document.getElementById('pdf-preview-frame');
        var dlBtn    = document.getElementById('pdf-download-btn');
        var openTab  = document.getElementById('pdf-open-tab-btn');
        var closeBtn = document.getElementById('pdf-preview-close');
        var spinner  = document.getElementById('pdf-spinner');

        // Sin contenedor → abrir directo en pestaña
        if (!preview || !iframe) { window.open(url, '_blank', 'noopener'); return; }

        // Reset estado previo
        if (spinner) spinner.style.display = '';
        iframe.style.display = '';
        iframe.src = 'about:blank';

        // Cargar el PDF
        try { iframe.src = url; } catch (_) { window.open(url, '_blank', 'noopener'); return; }

        var loaded = false;
        var fallbackTimer = setTimeout(function () {
            if (!loaded) {
                // Si el iframe no logró cargar a tiempo, abrir en pestaña
                try { window.open(url, '_blank', 'noopener'); } catch (_) {}
            }
        }, 8000);

        iframe.onload = function () {
            loaded = true;
            clearTimeout(fallbackTimer);
            if (spinner) spinner.style.display = 'none';
        };
        iframe.onerror = function () {
            clearTimeout(fallbackTimer);
            try { window.open(url, '_blank', 'noopener'); } catch (_) {}
        };

        if (dlBtn)   dlBtn.onclick   = function () { window.open(url, '_blank', 'noopener'); };
        if (openTab) openTab.onclick = function () { window.open(url, '_blank', 'noopener'); };
        if (backdrop) backdrop.classList.add('pdf-visible');
        preview.removeAttribute('aria-hidden');
        preview.classList.add('pdf-visible');

        function _close() {
            clearTimeout(fallbackTimer);
            preview.classList.remove('pdf-visible');
            preview.setAttribute('aria-hidden', 'true');
            if (backdrop) backdrop.classList.remove('pdf-visible');
            iframe.onload = null;
            iframe.onerror = null;
            iframe.src = 'about:blank';
        }
        if (closeBtn) closeBtn.onclick = _close;
        if (backdrop) backdrop.onclick = _close;
    };
})();
