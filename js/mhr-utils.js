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
})();
