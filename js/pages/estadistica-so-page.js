/**
 * js/pages/estadistica-so-page.js
 * Módulo de estadísticas de Seguridad Operacional (reportes de revisión).
 * Expone: window.MHREstadisticaSoPage
 * Devuelve: { loadEstadisticas }  para que el orquestador lo pase a MHRMainTabsPage.
 */
window.MHREstadisticaSoPage = (function () {

    function init() {

        // ── Carga principal de estadísticas ───────────────────────────────────
        async function loadEstadisticas() {
            var client = window.supabaseClient;
            if (!client) {
                console.error('MHREstadisticaSoPage: supabaseClient no disponible');
                return;
            }

            ['inspection-types-chart', 'monthly-reports-chart'].forEach(function (id) {
                var el = document.getElementById(id);
                if (el) el.innerHTML = '<p style="color:#6b7280;text-align:center;padding:20px">Cargando datos...</p>';
            });

            try {
                var reports;
                try {
                    reports = await window.MHRReportService.getReportsOrdered(client);
                } catch (error) {
                    console.error('Error loading SO statistics:', error);
                    ['inspection-types-chart', 'monthly-reports-chart'].forEach(function (id) {
                        var el = document.getElementById(id);
                        if (el) el.innerHTML = '<p style="color:#ef4444;text-align:center;padding:20px">Error al cargar datos: ' + error.message + '</p>';
                    });
                    return;
                }

                var totalReports = reports.length;
                var currentMonth = new Date().getMonth();
                var currentYear  = new Date().getFullYear();

                var reportsThisMonth = reports.filter(function (r) {
                    var d = new Date(r.created_at);
                    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
                }).length;

                // Prioridad promedio
                var totalPriority = 0, priorityCount = 0;
                reports.forEach(function (report) {
                    if (report.details) {
                        Object.values(report.details).forEach(function (detail) {
                            if (detail.prioridad && detail.prioridad !== 'N/A') {
                                totalPriority += parseInt(detail.prioridad) || 0;
                                priorityCount++;
                            }
                        });
                    }
                });
                var avgPriority = priorityCount > 0 ? (totalPriority / priorityCount).toFixed(1) : '—';

                // Tasa de completitud (con PDF generado)
                var completedReports = reports.filter(function (r) { return r.pdf_url; }).length;
                var completionRate = totalReports > 0 ? Math.round((completedReports / totalReports) * 100) : 0;

                // Conteo por turno
                var diurnos = reports.filter(function (r) {
                    return r.turno && r.turno.toString().toLowerCase().includes('diurna');
                }).length;
                var nocturnos = reports.filter(function (r) {
                    return r.turno && r.turno.toString().toLowerCase().includes('noct');
                }).length;

                // Conteo por tipo de inspección
                var primarios = reports.filter(function (r) {
                    return r.tipo_inspeccion && r.tipo_inspeccion.toString().toLowerCase().includes('primaria');
                }).length;
                var secundarios = reports.filter(function (r) {
                    return r.tipo_inspeccion && r.tipo_inspeccion.toString().toLowerCase().includes('secundaria');
                }).length;

                // Conteo por pista
                var pistaCounts = {};
                reports.forEach(function (r) {
                    var p = (r.pista || '').toString().trim();
                    if (!p) return;
                    pistaCounts[p] = (pistaCounts[p] || 0) + 1;
                });

                // Actualizar tarjetas de resumen
                var elTotal      = document.getElementById('total-reports');
                var elMonth      = document.getElementById('reports-this-month');
                var elDiurnos    = document.getElementById('report-diurnos');
                var elNocturnos  = document.getElementById('report-nocturnos');
                var elPrimarios  = document.getElementById('report-primarios');
                var elSecundarios = document.getElementById('report-secundarios');
                var elPistaCards = document.getElementById('report-pista-cards');
                var elAvg        = document.getElementById('avg-priority');
                var elRate       = document.getElementById('completion-rate');

                if (elTotal)      elTotal.textContent      = totalReports;
                if (elMonth)      elMonth.textContent      = reportsThisMonth;
                if (elDiurnos)    elDiurnos.textContent    = diurnos;
                if (elNocturnos)  elNocturnos.textContent  = nocturnos;
                if (elPrimarios)  elPrimarios.textContent  = primarios;
                if (elSecundarios) elSecundarios.textContent = secundarios;
                if (elAvg)        elAvg.textContent        = avgPriority;
                if (elRate)       elRate.textContent       = completionRate + '%';

                if (elPistaCards) {
                    elPistaCards.innerHTML = '';
                    var pistaEntries = Object.entries(pistaCounts).sort(function (a, b) { return b[1] - a[1]; });
                    if (pistaEntries.length === 0) {
                        elPistaCards.innerHTML = '<span style="font-size:13px;color:rgba(255,255,255,0.85);">Sin datos</span>';
                    } else {
                        pistaEntries.forEach(function (entry) {
                            var label = entry[0], count = entry[1];
                            var card = document.createElement('div');
                            card.style.cssText = 'padding:6px 10px;border-radius:999px;background:rgba(255,255,255,0.18);color:#fff;font-weight:700;font-size:13px;display:inline-flex;align-items:center;gap:8px;';
                            card.textContent = label + ':';
                            var badge = document.createElement('span');
                            badge.textContent = count;
                            badge.style.cssText = 'background:rgba(0,0,0,0.25);border-radius:999px;padding:2px 8px;font-size:12px;font-weight:700;';
                            card.appendChild(badge);
                            elPistaCards.appendChild(card);
                        });
                    }
                }

                // Tabla de responsables
                var responsableTable = document.getElementById('responsable-table-body');
                if (responsableTable) {
                    var counts = {};
                    reports.forEach(function (r) {
                        var name = (r.responsable || '').toString().trim() || 'Sin responsable';
                        counts[name] = (counts[name] || 0) + 1;
                    });
                    var respEntries = Object.entries(counts).sort(function (a, b) { return b[1] - a[1]; });
                    if (respEntries.length === 0) {
                        responsableTable.innerHTML = '<tr><td colspan="2" style="padding:12px;color:#6b7280;text-align:center;">Sin datos</td></tr>';
                    } else {
                        responsableTable.innerHTML = '';
                        respEntries.forEach(function (entry) {
                            var tr = document.createElement('tr');
                            tr.innerHTML = '<td style="padding:10px;border-bottom:1px solid #e5e7eb;">' + entry[0] + '</td>' +
                                '<td style="padding:10px;border-bottom:1px solid #e5e7eb;text-align:right;">' + entry[1] + '</td>';
                            responsableTable.appendChild(tr);
                        });
                    }
                }

                createInspectionTypesChart(reports);
                createMonthlyReportsChart(reports);

            } catch (err) {
                console.error('Error in loadEstadisticas:', err);
            }
        }

        // ── Gráfico: Tipos de Inspección (barras horizontales) ────────────────
        function createInspectionTypesChart(reports) {
            var container = document.getElementById('inspection-types-chart');
            if (!container) return;

            var types = {};
            reports.forEach(function (r) {
                if (Array.isArray(r.tipo_inspeccion)) {
                    r.tipo_inspeccion.forEach(function (t) { types[t] = (types[t] || 0) + 1; });
                } else if (r.tipo_inspeccion && typeof r.tipo_inspeccion === 'string') {
                    types[r.tipo_inspeccion] = (types[r.tipo_inspeccion] || 0) + 1;
                }
            });

            var entries = Object.entries(types).sort(function (a, b) { return b[1] - a[1]; });
            if (entries.length === 0) {
                container.innerHTML = '<p style="color:#6b7280;text-align:center;padding:30px">Sin datos de tipo de inspección aún.</p>';
                return;
            }

            var maxVal = entries[0][1];
            var colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899'];
            var html = '<div style="padding:10px 0;">';
            entries.forEach(function (entry, i) {
                var type = entry[0], count = entry[1];
                var pct      = maxVal > 0 ? Math.round((count / maxVal) * 100) : 0;
                var totalPct = reports.length > 0 ? Math.round((count / reports.length) * 100) : 0;
                html += '<div style="margin-bottom:14px;">' +
                    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">' +
                        '<span style="font-size:13px;font-weight:600;color:#1f2937;max-width:65%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + type + '</span>' +
                        '<span style="font-size:13px;color:#6b7280;">' + count + ' (' + totalPct + '%)</span>' +
                    '</div>' +
                    '<div style="background:#e5e7eb;border-radius:6px;height:14px;overflow:hidden;">' +
                        '<div style="height:100%;width:' + pct + '%;background:' + colors[i % colors.length] + ';border-radius:6px;transition:width 0.6s ease;"></div>' +
                    '</div>' +
                '</div>';
            });
            html += '</div>';
            container.innerHTML = html;
        }

        // ── Gráfico: Reportes por Mes (barras verticales) ─────────────────────
        function createMonthlyReportsChart(reports) {
            var container = document.getElementById('monthly-reports-chart');
            if (!container) return;

            var monthlyData = {};
            var monthNames  = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
            reports.forEach(function (r) {
                var d   = new Date(r.created_at);
                var key = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
                monthlyData[key] = {
                    count: (monthlyData[key] ? monthlyData[key].count : 0) + 1,
                    label: monthNames[d.getMonth()] + ' ' + String(d.getFullYear()).slice(2)
                };
            });

            var entries = Object.entries(monthlyData).sort(function (a, b) { return a[0].localeCompare(b[0]); }).slice(-8);
            if (entries.length === 0) {
                container.innerHTML = '<p style="color:#6b7280;text-align:center;padding:30px">Sin reportes registrados aún.</p>';
                return;
            }

            var maxVal = Math.max.apply(null, entries.map(function (e) { return e[1].count; }));
            var BAR_H  = 160;
            var html   = '<div style="display:flex;align-items:flex-end;gap:8px;padding:10px 0 0;overflow-x:auto;">';
            entries.forEach(function (entry) {
                var info = entry[1];
                var barH = maxVal > 0 ? Math.max(Math.round((info.count / maxVal) * BAR_H), 18) : 18;
                html += '<div style="flex:1;min-width:48px;display:flex;flex-direction:column;align-items:center;gap:4px;">' +
                    '<span style="font-size:12px;font-weight:700;color:#1f2937;">' + info.count + '</span>' +
                    '<div style="width:100%;height:' + barH + 'px;background:linear-gradient(180deg,#3b82f6,#1d4ed8);border-radius:6px 6px 0 0;"></div>' +
                    '<span style="font-size:11px;color:#6b7280;white-space:nowrap;">' + info.label + '</span>' +
                '</div>';
            });
            html += '</div>';
            container.innerHTML = html;
        }

        // Botón Actualizar
        var refreshBtn = document.getElementById('refresh-estadisticas-btn');
        if (refreshBtn) refreshBtn.addEventListener('click', loadEstadisticas);

        return { loadEstadisticas: loadEstadisticas };
    }

    return { init: init };
})();
