/**
 * js/pages/historial-so-page.js
 * Carga, muestra y filtra los reportes de Seguridad Operacional en el
 * panel de historial (#admin-panel).
 *
 * Expone window.loadAdminReports() para que auth-session-page.js lo invoque
 * cuando el usuario con rol admin/superuser inicie sesión.
 */
(function () {
    'use strict';

    var allReports = [];      // caché de reportes cargados
    var isLoading = false;

    // ─── Helpers ────────────────────────────────────────────────────────────

    function esc(text) {
        return (text || '').toString().replace(/[&<>'"]/g, function (m) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[m];
        });
    }

    /**
     * Convierte "DD/MM/YYYY HH:MM:SS" o ISO a objeto Date.
     * Devuelve null si no se puede parsear.
     */
    function parseReportDate(str) {
        if (!str) return null;
        str = String(str).trim();
        // ISO (created_at de Supabase)
        if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
            var d = new Date(str);
            return isNaN(d.getTime()) ? null : d;
        }
        // DD/MM/YYYY HH:MM:SS
        var m = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{2}):(\d{2})(?::(\d{2}))?)?/);
        if (m) {
            return new Date(
                parseInt(m[3]), parseInt(m[2]) - 1, parseInt(m[1]),
                parseInt(m[4] || 0), parseInt(m[5] || 0), parseInt(m[6] || 0)
            );
        }
        return null;
    }

    /**
     * Formatea para mostrar en la tabla: devuelve "DD/MM/YYYY HH:MM" o el
     * string original si no se puede parsear.
     */
    function formatDisplayDate(str) {
        if (!str) return '-';
        var d = parseReportDate(str);
        if (!d || isNaN(d.getTime())) return str;
        var pad = function (n) { return String(n).padStart(2, '0'); };
        return pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + '/' + d.getFullYear() +
               ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
    }

    // ─── Chip group helpers ──────────────────────────────────────────────────

    function getChipValues(groupId) {
        var group = document.getElementById(groupId);
        if (!group) return [];
        return Array.prototype.slice.call(group.querySelectorAll('.filter-chip.active'))
            .map(function (btn) { return btn.dataset.value || btn.textContent.trim(); });
    }

    function wireChipGroups() {
        document.querySelectorAll('#admin-panel .filter-chip-group').forEach(function (group) {
            group.querySelectorAll('.filter-chip').forEach(function (chip) {
                chip.addEventListener('click', function () {
                    chip.classList.toggle('active');
                });
            });
        });
    }

    function resetChips() {
        document.querySelectorAll('#admin-panel .filter-chip.active').forEach(function (chip) {
            chip.classList.remove('active');
        });
    }

    // ─── Filter-multi dropdown wiring (Responsable only) ─────────────────────

    function wireFilterMultiToggles() {
        var toggles = document.querySelectorAll('#admin-panel .filter-multi-toggle');
        toggles.forEach(function (toggle) {
            toggle.addEventListener('click', function (e) {
                e.stopPropagation();
                var parent = toggle.closest('.filter-multi');
                if (!parent) return;
                var isOpen = parent.classList.contains('open');
                // Cierra todos los demás
                document.querySelectorAll('#admin-panel .filter-multi.open').forEach(function (el) {
                    el.classList.remove('open');
                });
                if (!isOpen) parent.classList.add('open');
            });

            toggle.addEventListener('keydown', function (e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggle.click();
                }
            });
        });

        // Cierra al hacer click fuera
        document.addEventListener('click', function () {
            document.querySelectorAll('#admin-panel .filter-multi.open').forEach(function (el) {
                el.classList.remove('open');
            });
        });

        // Actualiza el texto del toggle cuando cambia la selección
        document.querySelectorAll('#admin-panel .filter-multi-select').forEach(function (sel) {
            sel.addEventListener('change', function () {
                updateToggleLabel(sel);
            });
        });
    }

    function updateToggleLabel(sel) {
        var parent = sel.closest('.filter-multi');
        if (!parent) return;
        var toggle = parent.querySelector('.filter-multi-toggle');
        if (!toggle) return;
        var selected = Array.prototype.slice.call(sel.selectedOptions || []).map(function (o) { return o.text; });
        var original = toggle.dataset.originalLabel || toggle.textContent.trim();
        if (!toggle.dataset.originalLabel) toggle.dataset.originalLabel = original;
        toggle.textContent = selected.length ? selected.join(', ') : original;
    }

    function resetToggleLabels() {
        document.querySelectorAll('#admin-panel .filter-multi-toggle').forEach(function (t) {
            if (t.dataset.originalLabel) t.textContent = t.dataset.originalLabel;
        });
    }

    // ─── Responsable filter population ──────────────────────────────────────

    function populateResponsableFilter(reports) {
        var sel = document.getElementById('filter-responsable');
        if (!sel) return;
        var existing = Array.prototype.slice.call(sel.options).map(function (o) { return o.value; });
        var names = {};
        reports.forEach(function (r) {
            var v = (r.responsable || '').trim();
            if (v && !names[v]) names[v] = true;
        });
        Object.keys(names).sort(function (a, b) { return a.localeCompare(b, 'es', { sensitivity: 'base' }); }).forEach(function (name) {
            if (existing.indexOf(name) === -1) {
                var opt = document.createElement('option');
                opt.value = name;
                opt.textContent = name;
                sel.appendChild(opt);
            }
        });
        // Ajusta el size para mostrar todas las opciones (máx 6)
        var count = sel.options.length;
        sel.size = Math.min(Math.max(count, 2), 6);
    }

    // ─── Apply filters ───────────────────────────────────────────────────────

    function getFilterValues() {
        function multiVals(id) {
            var sel = document.getElementById(id);
            if (!sel) return [];
            return Array.prototype.slice.call(sel.selectedOptions || []).map(function (o) { return o.value; });
        }

        return {
            folio:      ((document.getElementById('filter-folio') || {}).value || '').trim().toLowerCase(),
            fechaDesde: ((document.getElementById('filter-fecha-desde') || {}).value || '').trim(),
            fechaHasta: ((document.getElementById('filter-fecha-hasta') || {}).value || '').trim(),
            responsable: multiVals('filter-responsable'),
            tipo:       getChipValues('filter-tipo-group'),
            turno:      getChipValues('filter-turno-group'),
            pista:      getChipValues('filter-pista-group')
        };
    }

    function applyFilters() {
        var f = getFilterValues();
        var fechaDesdeD = f.fechaDesde ? new Date(f.fechaDesde + 'T00:00:00') : null;
        var fechaHastaD = f.fechaHasta ? new Date(f.fechaHasta + 'T23:59:59') : null;

        var filtered = allReports.filter(function (r) {
            // Folio
            if (f.folio && !(r.folio || '').toLowerCase().includes(f.folio)) return false;

            // Fecha
            var rDate = parseReportDate(r.fecha_local) || parseReportDate(r.created_at);
            if (fechaDesdeD && rDate && rDate < fechaDesdeD) return false;
            if (fechaHastaD && rDate && rDate > fechaHastaD) return false;

            // Responsable (multi)
            if (f.responsable.length > 0) {
                var rResp = (r.responsable || '').trim();
                if (!f.responsable.some(function (v) { return rResp === v; })) return false;
            }

            // Tipo inspección (multi) — el campo almacenado puede ser "Primaria", "Secundaria" o "Primaria, Secundaria"
            if (f.tipo.length > 0) {
                var rTipo = (r.tipo_inspeccion || '').trim();
                var match = f.tipo.some(function (v) {
                    return rTipo.toLowerCase().includes(v.toLowerCase());
                });
                if (!match) return false;
            }

            // Turno (multi)
            if (f.turno.length > 0) {
                var rTurno = (r.turno || '').trim();
                if (!f.turno.some(function (v) { return rTurno.toLowerCase() === v.toLowerCase(); })) return false;
            }

            // Pista/RWY (multi)
            if (f.pista.length > 0) {
                var rPista = (r.pista || '').trim();
                if (!f.pista.some(function (v) { return rPista === v; })) return false;
            }

            return true;
        });

        renderReports(filtered);
    }

    // ─── Render table rows ───────────────────────────────────────────────────

    function renderReports(reports) {
        var tbody = document.getElementById('admin-reports-list');
        if (!tbody) return;

        if (!reports || reports.length === 0) {
            tbody.innerHTML =
                '<tr><td colspan="7" style="padding:20px;text-align:center;color:#6b7280;">' +
                'No hay reportes que coincidan con los filtros.</td></tr>';
            return;
        }

        var html = '';
        reports.forEach(function (r) {
            var fecha = formatDisplayDate(r.fecha_local || r.created_at);
            var folio = esc(r.folio || '-');
            var responsable = esc(r.responsable || '-');
            var areaRep = esc(r.Area_Representante || r.area_representante || '-');
            var tipo = esc(r.tipo_inspeccion || '-');
            var turno = esc(r.turno || '-');
            var pista = esc(r.pista || '-');

            var pdfCell;
            if (r.pdf_url) {
                // Compatibilidad retroactiva: registros anteriores guardaban solo el filename
                var pdfHref = r.pdf_url;
                if (pdfHref && !pdfHref.startsWith('http')) {
                    pdfHref = 'https://fgstncvuuhpgyzmjceyr.supabase.co/storage/v1/object/public/reports/' + pdfHref;
                }
                pdfCell = '<a href="' + esc(pdfHref) + '" target="_blank" rel="noopener noreferrer" ' +
                    'style="color:#1d4ed8;text-decoration:underline;font-weight:500;">Ver PDF</a>';
            } else {
                pdfCell = '<span style="color:#9ca3af;font-size:12px;">Sin PDF</span>';
            }

            html += '<tr>' +
                '<td style="white-space:nowrap;">' + fecha + '</td>' +
                '<td style="font-family:monospace;font-size:12px;">' + folio + '</td>' +
                '<td>' + responsable + '</td>' +
                '<td>' + areaRep + '</td>' +
                '<td>' + tipo + '</td>' +
                '<td>' + turno + '</td>' +
                '<td>' + pista + '</td>' +
                '<td>' + pdfCell + '</td>' +
                '</tr>';
        });
        tbody.innerHTML = html;
    }

    // ─── Load from Supabase ──────────────────────────────────────────────────

    async function fetchReports() {
        var client = window.supabaseClient;
        if (!client) {
            console.warn('[HistorialSO] supabaseClient no disponible todavía.');
            return [];
        }
        var resp = await client
            .from('reports')
            .select('id, folio, fecha_local, created_at, tipo_inspeccion, turno, pista, responsable, cargo, Area_Representante, pdf_url')
            .order('created_at', { ascending: false })
            .limit(500);
        if (resp.error) {
            console.error('[HistorialSO] Error al cargar reportes:', resp.error);
            return [];
        }
        return resp.data || [];
    }

    function showLoadingState() {
        var tbody = document.getElementById('admin-reports-list');
        if (tbody) tbody.innerHTML =
            '<tr><td colspan="7" style="padding:20px;text-align:center;color:#6b7280;">Cargando reportes…</td></tr>';
    }

    function showErrorState(msg) {
        var tbody = document.getElementById('admin-reports-list');
        if (tbody) tbody.innerHTML =
            '<tr><td colspan="7" style="padding:20px;text-align:center;color:#ef4444;">' +
            esc(msg || 'Error al cargar reportes.') + '</td></tr>';
    }

    async function loadAdminReports() {
        if (isLoading) return;
        isLoading = true;
        showLoadingState();

        try {
            allReports = await fetchReports();
            populateResponsableFilter(allReports);
            renderReports(allReports);
        } catch (e) {
            console.error('[HistorialSO] Excepción al cargar:', e);
            showErrorState('Error al cargar reportes: ' + (e.message || e));
        } finally {
            isLoading = false;
        }
    }

    // ─── Init: wires buttons & dropdowns ────────────────────────────────────

    function init() {
        wireChipGroups();
        wireFilterMultiToggles();

        var applyBtn   = document.getElementById('filter-apply-btn');
        var clearBtn   = document.getElementById('filter-clear-btn');
        var refreshBtn = document.getElementById('refresh-admin-btn');

        if (applyBtn) {
            applyBtn.addEventListener('click', function () {
                applyFilters();
                // Cierra todos los dropdowns multi
                document.querySelectorAll('#admin-panel .filter-multi.open').forEach(function (el) {
                    el.classList.remove('open');
                });
            });
        }

        if (clearBtn) {
            clearBtn.addEventListener('click', function () {
                resetHistorialFilters();
                renderReports(allReports);
            });
        }

        if (refreshBtn) {
            refreshBtn.addEventListener('click', function () {
                loadAdminReports();
            });
        }
    }

    // ─── Expose globally ─────────────────────────────────────────────────────

    function resetHistorialFilters() {
        var folio = document.getElementById('filter-folio');
        var desde = document.getElementById('filter-fecha-desde');
        var hasta = document.getElementById('filter-fecha-hasta');
        if (folio) folio.value = '';
        if (desde) desde.value = '';
        if (hasta) hasta.value = '';
        var respSel = document.getElementById('filter-responsable');
        if (respSel) Array.prototype.forEach.call(respSel.options, function (o) { o.selected = false; });
        resetToggleLabels();
        resetChips();
    }

    window.loadAdminReports = loadAdminReports;
    window.resetHistorialFilters = resetHistorialFilters;

    // Auto-init on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
