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
                    // Intentar cargar reportes con items para análisis avanzado
                    if (window.MHRReportService.getReportsWithItemsOrdered) {
                        reports = await window.MHRReportService.getReportsWithItemsOrdered(client);
                    } else {
                        reports = await window.MHRReportService.getReportsOrdered(client);
                    }
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
                // KPIs visibles
                var kpiTotal = document.getElementById('kpi-total-reports');
                var kpiMonth = document.getElementById('kpi-reports-this-month');
                if (kpiTotal) kpiTotal.textContent = totalReports;
                if (kpiMonth) kpiMonth.textContent = reportsThisMonth;
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

                // ── Análisis a nivel ítem: hallazgos activos ─────────────────
                renderHallazgosActivos(reports);
                renderFranjasTable(reports);

                // ── Donut charts (paleta sobria) ─────────────────────────────
                renderDonut('chart-turno', [
                    { label: 'Diurnos', value: diurnos, color: '#0ea5e9' },
                    { label: 'Nocturnos', value: nocturnos, color: '#1e3a8a' }
                ]);
                renderDonut('chart-tipo', [
                    { label: 'Primarios', value: primarios, color: '#0d9488' },
                    { label: 'Secundarios', value: secundarios, color: '#475569' }
                ]);
                var atendidos = 0, enProceso = 0, noAtendidos = 0;
                reports.forEach(function (r) {
                    var st = String(r.estatus || 'No Atendido');
                    if (/atendido/i.test(st) && !/no/i.test(st)) atendidos++;
                    else if (/proceso/i.test(st)) enProceso++;
                    else noAtendidos++;
                });
                renderDonut('chart-estatus', [
                    { label: 'Atendidos', value: atendidos, color: '#16a34a' },
                    { label: 'En Proceso', value: enProceso, color: '#d97706' },
                    { label: 'No Atendidos', value: noAtendidos, color: '#dc2626' }
                ]);

                // Reportes por pista (donut, paleta sobria)
                var pistaPalette = ['#1e40af', '#0d9488', '#7c3aed', '#0369a1', '#475569', '#b45309', '#be123c', '#0891b2'];
                var pistaDonutData = Object.entries(pistaCounts)
                    .sort(function (a, b) { return b[1] - a[1]; })
                    .map(function (entry, i) {
                        return { label: entry[0], value: entry[1], color: pistaPalette[i % pistaPalette.length] };
                    });
                renderDonut('chart-pista', pistaDonutData);

                // ── Mapa de hallazgos ────────────────────────────────────────
                _soReportsCache = reports;
                _populateMapFilters(reports);
                _refreshHallazgosMap();

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

        // ── Helpers de análisis a nivel ítem ──────────────────────────────────
        function _isItemActive(item, parentReport) {
            // Un ítem se considera "activo" si su seguimiento NO está marcado
            // como atendido. Si el reporte completo está marcado como Atendido,
            // todos sus ítems se consideran cerrados.
            if (parentReport && String(parentReport.estatus || '').toLowerCase() === 'atendido') return false;
            try {
                var dx = item.datos_extra || {};
                var fs = String(dx.followup_status || '').toLowerCase();
                if (fs === 'atendido satisfactoriamente' || fs === 'atendido') return false;
            } catch (e) { /* ignore */ }
            return true;
        }

        function _itemHasHallazgo(item) {
            var h = (item.hallazgo || '').toString().trim();
            if (!h) return false;
            return !/^(?:n\/?a|ninguno|sin\s+hallazgo)$/i.test(h);
        }

        function _flatItems(reports) {
            var out = [];
            (reports || []).forEach(function (r) {
                var items = Array.isArray(r.report_inspection_items) ? r.report_inspection_items : [];
                items.forEach(function (it) {
                    if (it && it.item_nombre === '__firmas__') return;
                    out.push({ item: it, report: r });
                });
            });
            return out;
        }

        function renderHallazgosActivos(reports) {
            var elOq      = document.getElementById('stat-oquedades');
            var elOqDet   = document.getElementById('stat-oquedades-detail');
            var elLuces   = document.getElementById('stat-luces-fos');
            var elLucesP  = document.getElementById('stat-luces-pct');
            var elTotal   = document.getElementById('stat-hallazgos-activos');
            var elTotalD  = document.getElementById('stat-hallazgos-detail');
            if (!elOq && !elLuces && !elTotal) return; // estadística no presente

            var pares = _flatItems(reports);

            var oqAct = 0, oqTot = 0;
            var lucesAct = 0, lucesTot = 0;
            var totalAct = 0, totalCon = 0;

            pares.forEach(function (p) {
                if (!_itemHasHallazgo(p.item)) return;
                var h    = (p.item.hallazgo || '').toString();
                var name = (p.item.item_nombre || '').toString();
                var active = _isItemActive(p.item, p.report);

                totalCon++;
                if (active) totalAct++;

                if (/oquedad/i.test(h)) {
                    oqTot++;
                    if (active) oqAct++;
                }
                if (/iluminaci|luces|luminari/i.test(name) || /luz|luces|luminar/i.test(h)) {
                    lucesTot++;
                    if (active) lucesAct++;
                }
            });

            if (elOq)     elOq.textContent = oqAct;
            if (elOqDet)  elOqDet.textContent = (oqTot ? (oqAct + ' de ' + oqTot + ' reportadas') : 'Sin reportes');
            if (elLuces)  elLuces.textContent = lucesAct;
            if (elLucesP) {
                if (lucesTot > 0) {
                    var pct = Math.round((lucesAct / lucesTot) * 100);
                    elLucesP.textContent = pct + '% activas (' + lucesTot + ' reportadas)';
                } else {
                    elLucesP.textContent = 'Sin reportes';
                }
            }
            if (elTotal)  elTotal.textContent = totalAct;
            if (elTotalD) elTotalD.textContent = 'de ' + totalCon + ' totales';
        }

        function renderFranjasTable(reports) {
            var tbody = document.getElementById('franjas-table-body');
            if (!tbody) return;

            var pares = _flatItems(reports);
            var counts = {}; // { hallazgo: { active, total } }

            pares.forEach(function (p) {
                var name = (p.item.item_nombre || '').toString();
                if (!/franja/i.test(name)) return;
                if (!_itemHasHallazgo(p.item)) return;
                var h = (p.item.hallazgo || '').toString().trim();
                if (!counts[h]) counts[h] = { active: 0, total: 0 };
                counts[h].total++;
                if (_isItemActive(p.item, p.report)) counts[h].active++;
            });

            var entries = Object.entries(counts).sort(function (a, b) {
                return b[1].active - a[1].active || b[1].total - a[1].total;
            });

            if (entries.length === 0) {
                tbody.innerHTML = '<tr><td colspan="3" style="padding:14px;text-align:center;color:#6b7280;">Sin hallazgos en franjas registrados.</td></tr>';
                return;
            }

            var totalActive = entries.reduce(function (acc, e) { return acc + e[1].active; }, 0);

            var html = '';
            entries.forEach(function (e) {
                var name = e[0], stat = e[1];
                var pct = totalActive > 0 ? Math.round((stat.active / totalActive) * 100) : 0;
                var barW = Math.max(pct, stat.active > 0 ? 4 : 0);
                html += '<tr>' +
                    '<td style="padding:10px 10px;border-bottom:1px solid #e5e7eb;color:#1f2937;font-weight:600;">' +
                        _esc(name) +
                        '<div style="margin-top:4px;background:#e5e7eb;border-radius:4px;height:6px;overflow:hidden;">' +
                            '<div style="height:100%;width:' + barW + '%;background:linear-gradient(90deg,#0ea5e9,#0369a1);"></div>' +
                        '</div>' +
                        '<div style="font-size:11px;color:#6b7280;margin-top:3px;">Total reportadas: ' + stat.total + '</div>' +
                    '</td>' +
                    '<td style="padding:10px;border-bottom:1px solid #e5e7eb;text-align:right;font-weight:800;color:' + (stat.active > 0 ? '#dc2626' : '#16a34a') + ';font-size:18px;">' + stat.active + '</td>' +
                    '<td style="padding:10px;border-bottom:1px solid #e5e7eb;text-align:right;color:#6b7280;font-weight:600;">' + pct + '%</td>' +
                '</tr>';
            });
            // Fila total
            html += '<tr style="background:#f1f5f9;">' +
                '<td style="padding:10px;font-weight:700;color:#0f172a;">TOTAL ACTIVOS</td>' +
                '<td style="padding:10px;text-align:right;font-weight:800;color:#0f172a;">' + totalActive + '</td>' +
                '<td style="padding:10px;text-align:right;color:#0f172a;font-weight:700;">100%</td>' +
            '</tr>';
            tbody.innerHTML = html;
        }

        function _esc(s) {
            return String(s == null ? '' : s)
                .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
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

        // ── Donut chart SVG ──────────────────────────────────────────────────
        function renderDonut(containerId, data) {
            var container = document.getElementById(containerId);
            if (!container) return;
            var total = data.reduce(function (a, d) { return a + (d.value || 0); }, 0);
            if (total === 0) {
                container.innerHTML = '<p style="color:#94a3b8;font-size:12px;margin:auto;">Sin datos</p>';
                return;
            }
            var size = 96, stroke = 16, r = (size - stroke) / 2, cx = size / 2, cy = size / 2;
            var circumference = 2 * Math.PI * r;
            var offset = 0;
            var segments = '';
            data.forEach(function (d) {
                var v = d.value || 0;
                if (v <= 0) return;
                var dash = (v / total) * circumference;
                segments += '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="none" ' +
                    'stroke="' + d.color + '" stroke-width="' + stroke + '" ' +
                    'stroke-dasharray="' + dash + ' ' + (circumference - dash) + '" ' +
                    'stroke-dashoffset="' + (-offset) + '" ' +
                    'transform="rotate(-90 ' + cx + ' ' + cy + ')"></circle>';
                offset += dash;
            });
            var svg = '<svg viewBox="0 0 ' + size + ' ' + size + '" width="' + size + '" height="' + size + '" style="overflow:visible;flex-shrink:0;">' +
                '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="none" stroke="#e2e8f0" stroke-width="' + stroke + '"></circle>' +
                segments +
                '<text x="' + cx + '" y="' + (cy - 1) + '" text-anchor="middle" font-size="18" font-weight="800" fill="#0f172a">' + total + '</text>' +
                '<text x="' + cx + '" y="' + (cy + 12) + '" text-anchor="middle" font-size="8" fill="#64748b" letter-spacing=".5">total</text>' +
            '</svg>';
            var legend = '<div style="display:flex;flex-direction:column;gap:4px;flex:1;min-width:0;">';
            data.forEach(function (d) {
                var pct = total > 0 ? Math.round(((d.value || 0) / total) * 100) : 0;
                legend += '<div style="display:flex;align-items:center;gap:6px;font-size:11.5px;color:#334155;line-height:1.2;">' +
                    '<span style="width:9px;height:9px;border-radius:2px;background:' + d.color + ';display:inline-block;flex-shrink:0;"></span>' +
                    '<span style="font-weight:600;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + _esc(d.label) + '</span>' +
                    '<span style="color:#0f172a;font-weight:700;">' + (d.value || 0) + '</span>' +
                    '<span style="color:#94a3b8;font-size:10.5px;">(' + pct + '%)</span>' +
                '</div>';
            });
            legend += '</div>';
            container.innerHTML = svg + legend;
        }

        // ── Mapa de hallazgos en tiempo real ─────────────────────────────────
        var _soReportsCache = [];
        var _soMap = null;
        var _soMapLayer = null;
        var _soMapWired = false;
        var _soMonthNames = ['Todos los meses', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

        function _parseLatLng(s) {
            if (!s) return null;
            var m = String(s).match(/(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)/);
            if (!m) return null;
            var lat = parseFloat(m[1]), lng = parseFloat(m[2]);
            if (!isFinite(lat) || !isFinite(lng)) return null;
            return { lat: lat, lng: lng };
        }

        function _populateMapFilters(reports) {
            var yearSel  = document.getElementById('so-map-year');
            var monthSel = document.getElementById('so-map-month');
            var pistaSel = document.getElementById('so-map-pista');
            if (!yearSel || !monthSel || !pistaSel) return;

            // Años (de los created_at)
            var years = {};
            reports.forEach(function (r) {
                var d = new Date(r.created_at);
                if (!isNaN(d.getTime())) years[d.getFullYear()] = true;
            });
            var prevYear = yearSel.value;
            var yearList = Object.keys(years).sort(function (a, b) { return Number(b) - Number(a); });
            yearSel.innerHTML = '<option value="">Todos los años</option>';
            yearList.forEach(function (y) {
                var op = document.createElement('option');
                op.value = y; op.textContent = y;
                yearSel.appendChild(op);
            });
            yearSel.value = prevYear || '';

            // Meses
            if (monthSel.options.length <= 1) {
                monthSel.innerHTML = '';
                for (var i = 0; i <= 12; i++) {
                    var op = document.createElement('option');
                    op.value = i === 0 ? '' : String(i).padStart(2, '0');
                    op.textContent = _soMonthNames[i];
                    monthSel.appendChild(op);
                }
            }

            // Pistas
            var pistaSet = {};
            reports.forEach(function (r) {
                var p = (r.pista || '').toString().trim();
                if (p) pistaSet[p] = true;
            });
            var prevPista = pistaSel.value;
            pistaSel.innerHTML = '<option value="">Todas las pistas</option>';
            Object.keys(pistaSet).sort().forEach(function (p) {
                var op = document.createElement('option');
                op.value = p; op.textContent = p;
                pistaSel.appendChild(op);
            });
            pistaSel.value = prevPista || '';

            if (!_soMapWired) {
                _soMapWired = true;
                ['so-map-year', 'so-map-month', 'so-map-pista', 'so-map-estatus', 'so-map-color-by'].forEach(function (id) {
                    var el = document.getElementById(id);
                    if (el) el.addEventListener('change', _refreshHallazgosMap);
                });
            }
        }

        function _ensureSoMap() {
            if (_soMap || !window.L) return;
            var el = document.getElementById('so-hallazgos-map');
            if (!el) return;
            _soMap = window.L.map('so-hallazgos-map', {
                center: [19.7470, -99.0125],
                zoom: 14,
                scrollWheelZoom: true
            });
            // Capa satélite Google
            window.L.tileLayer('https://mt{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
                attribution: '&copy; Google Maps',
                subdomains: ['0', '1', '2', '3'],
                maxZoom: 21
            }).addTo(_soMap);
            _soMapLayer = window.L.layerGroup().addTo(_soMap);

            // Inyectar CSS de pulso para hallazgos activos (una sola vez)
            if (!document.getElementById('so-pulse-css')) {
                var st = document.createElement('style');
                st.id = 'so-pulse-css';
                st.textContent =
                    '@keyframes soPulse {' +
                    '  0%   { box-shadow: 0 0 0 0  rgba(var(--pulse-rgb,220,38,38), .75), 0 0 0 2px #fff; }' +
                    '  70%  { box-shadow: 0 0 0 14px rgba(var(--pulse-rgb,220,38,38), 0),   0 0 0 2px #fff; }' +
                    '  100% { box-shadow: 0 0 0 0  rgba(var(--pulse-rgb,220,38,38), 0),     0 0 0 2px #fff; }' +
                    '}' +
                    '.so-pulse-marker {' +
                    '  width:16px;height:16px;border-radius:50%;' +
                    '  border:2px solid #fff;' +
                    '  animation: soPulse 1.4s ease-out infinite;' +
                    '}';
                document.head.appendChild(st);
            }
        }

        function _condColor(val) {
            var v = String(val || '').toLowerCase();
            if (v === 'satisfactorio') return '#16a34a';
            if (v === 'no satisfactorio') return '#dc2626';
            if (v === 'n/a') return '#6b7280';
            if (v.indexOf('menor') !== -1) return '#16a34a';
            if (v.indexOf('mayor') !== -1) return '#facc15';
            if (v.indexOf('severo') !== -1) return '#f97316';
            if (v.indexOf('catastr') !== -1) return '#dc2626';
            return '#3b82f6';
        }

        function _prioColor(val) {
            var v = String(val || '');
            if (v === '1') return '#16a34a';
            if (v === '2') return '#facc15';
            if (v === '3') return '#dc2626';
            return '#6b7280';
        }

        function _estatusColor(active) {
            return active ? '#dc2626' : '#16a34a';
        }

        function _hexToRgb(hex) {
            var h = String(hex || '').replace('#', '').trim();
            if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
            if (!/^[0-9a-fA-F]{6}$/.test(h)) return '220,38,38';
            var n = parseInt(h, 16);
            return ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255);
        }

        function _renderLegend(colorBy) {
            var el = document.getElementById('so-map-legend');
            if (!el) return;
            var items = [];
            if (colorBy === 'prioridad') {
                items = [
                    { c: '#16a34a', t: 'Baja' },
                    { c: '#facc15', t: 'Media' },
                    { c: '#dc2626', t: 'Alta' }
                ];
            } else if (colorBy === 'estatus') {
                items = [
                    { c: '#dc2626', t: 'Activo' },
                    { c: '#16a34a', t: 'Atendido' }
                ];
            } else {
                items = [
                    { c: '#16a34a', t: 'Satisfactorio / Daño Menor' },
                    { c: '#facc15', t: 'Daño Mayor' },
                    { c: '#f97316', t: 'Daño Severo' },
                    { c: '#dc2626', t: 'No Satis. / Catastrófico' },
                    { c: '#6b7280', t: 'N/A' }
                ];
            }
            el.innerHTML = items.map(function (i) {
                return '<span style="display:inline-flex;align-items:center;gap:5px;font-size:11px;color:#475569;">' +
                    '<span style="width:10px;height:10px;border-radius:50%;background:' + i.c + ';display:inline-block;border:1.5px solid #fff;box-shadow:0 0 0 1px ' + i.c + ';"></span>' +
                    _esc(i.t) +
                '</span>';
            }).join('');
        }

        function _refreshHallazgosMap() {
            _ensureSoMap();
            if (!_soMap || !_soMapLayer) return;
            // Necesario si el contenedor estaba oculto al inicializar
            setTimeout(function () { try { _soMap.invalidateSize(); } catch (e) { } }, 50);

            var yearSel    = document.getElementById('so-map-year');
            var monthSel   = document.getElementById('so-map-month');
            var pistaSel   = document.getElementById('so-map-pista');
            var estatusSel = document.getElementById('so-map-estatus');
            var colorBySel = document.getElementById('so-map-color-by');
            var countEl    = document.getElementById('so-map-count');

            var year    = yearSel ? yearSel.value : '';
            var month   = monthSel ? monthSel.value : '';
            var pista   = pistaSel ? pistaSel.value : '';
            var estatus = estatusSel ? estatusSel.value : '';
            var colorBy = colorBySel ? colorBySel.value : 'condicion';

            _renderLegend(colorBy);
            _soMapLayer.clearLayers();

            var bounds = [];
            var added = 0;

            (_soReportsCache || []).forEach(function (r) {
                // Filtros a nivel reporte
                var d = new Date(r.created_at);
                if (year && (isNaN(d.getTime()) || String(d.getFullYear()) !== String(year))) return;
                if (month && (isNaN(d.getTime()) || String(d.getMonth() + 1).padStart(2, '0') !== String(month))) return;
                if (pista && String(r.pista || '').trim() !== pista) return;

                var items = Array.isArray(r.report_inspection_items) ? r.report_inspection_items : [];
                items.forEach(function (it) {
                    if (!it || it.item_nombre === '__firmas__') return;
                    var coords = _parseLatLng(it.lugar);
                    if (!coords) return;

                    var active = _isItemActive(it, r);
                    if (estatus === 'Activos' && !active) return;
                    if (estatus === 'Atendido' && active) return;

                    var color;
                    if (colorBy === 'prioridad')      color = _prioColor(it.prioridad);
                    else if (colorBy === 'estatus')   color = _estatusColor(active);
                    else                              color = _condColor(it.condicion);

                    var fechaStr = isNaN(d.getTime()) ? '-' : (d.toLocaleDateString('es-MX') + ' ' + d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }));

                    var popup = '<div style="font-family:Inter,Arial,sans-serif;font-size:12px;min-width:220px;">' +
                        '<div style="font-weight:700;color:#0f172a;margin-bottom:4px;">' + _esc(it.item_nombre || 'Item') + '</div>' +
                        '<div><strong>Folio:</strong> ' + _esc(r.folio || '-') + '</div>' +
                        '<div><strong>Fecha:</strong> ' + _esc(fechaStr) + '</div>' +
                        '<div><strong>Pista:</strong> ' + _esc(r.pista || '-') + '</div>' +
                        (it.hallazgo ? '<div><strong>Hallazgo:</strong> ' + _esc(it.hallazgo) + '</div>' : '') +
                        (it.condicion ? '<div><strong>Condición:</strong> ' + _esc(it.condicion) + '</div>' : '') +
                        (it.prioridad ? '<div><strong>Prioridad:</strong> ' + _esc(it.prioridad) + '</div>' : '') +
                        '<div style="margin-top:4px;"><strong>Estatus:</strong> ' +
                            '<span style="color:' + (active ? '#dc2626' : '#16a34a') + ';font-weight:700;">' + (active ? 'Activo' : 'Atendido') + '</span>' +
                        '</div>' +
                        '<div style="margin-top:6px;">' +
                            '<a href="https://www.google.com/maps?q=' + coords.lat + ',' + coords.lng + '" target="_blank" rel="noopener" style="color:#1d4ed8;text-decoration:underline;">📍 Abrir en Google Maps</a>' +
                        '</div>' +
                    '</div>';

                    window.L.circleMarker([coords.lat, coords.lng], {
                        radius: 8,
                        color: '#ffffff',
                        weight: 2,
                        fillColor: color,
                        fillOpacity: 0.95
                    }).bindPopup(popup)
                      .bindTooltip((it.item_nombre || 'Item') + (it.hallazgo ? ' · ' + it.hallazgo : ''), { direction: 'top', offset: [0, -8], opacity: 0.95 })
                      .addTo(_soMapLayer);

                    // Si el hallazgo está activo, superponer un divIcon con pulso para
                    // que destaque visualmente como "vivo / pendiente". El color del
                    // pulso (--pulse-rgb) se hereda del color de la condición/estatus/prioridad.
                    if (active) {
                        var rgb = _hexToRgb(color);
                        var pulseIcon = window.L.divIcon({
                            className: '',
                            html: '<div class="so-pulse-marker" style="background:' + color + ';--pulse-rgb:' + rgb + ';"></div>',
                            iconSize: [16, 16],
                            iconAnchor: [8, 8]
                        });
                        window.L.marker([coords.lat, coords.lng], { icon: pulseIcon, interactive: false, keyboard: false })
                            .addTo(_soMapLayer);
                    }

                    bounds.push([coords.lat, coords.lng]);
                    added++;
                });
            });

            if (countEl) countEl.textContent = added + (added === 1 ? ' hallazgo' : ' hallazgos') + ' en mapa';

            if (bounds.length > 0) {
                try { _soMap.fitBounds(bounds, { padding: [30, 30], maxZoom: 18 }); } catch (e) { }
            } else {
                _soMap.setView([19.7470, -99.0125], 14);
            }
        }

        // Botón Actualizar
        var refreshBtn = document.getElementById('refresh-estadisticas-btn');
        if (refreshBtn) refreshBtn.addEventListener('click', loadEstadisticas);

        // Sub-tabs Resumen / Mapa
        var tabResumen = document.getElementById('eso-tab-resumen');
        var tabMapa    = document.getElementById('eso-tab-mapa');
        var paneResumen = document.getElementById('eso-pane-resumen');
        var paneMapa    = document.getElementById('eso-pane-mapa');

        function _setEsoTab(which) {
            var activeStyle   = 'border-bottom:3px solid #2563eb;color:#2563eb;';
            var inactiveStyle = 'border-bottom:3px solid transparent;color:#64748b;';
            if (tabResumen) tabResumen.setAttribute('style',
                'padding:9px 22px;font-size:13.5px;font-weight:600;background:none;border:none;cursor:pointer;transition:all .15s;margin-bottom:-2px;' +
                (which === 'resumen' ? activeStyle : inactiveStyle));
            if (tabMapa) tabMapa.setAttribute('style',
                'padding:9px 22px;font-size:13.5px;font-weight:600;background:none;border:none;cursor:pointer;transition:all .15s;margin-bottom:-2px;' +
                (which === 'mapa' ? activeStyle : inactiveStyle));
            if (paneResumen) paneResumen.style.display = which === 'resumen' ? '' : 'none';
            if (paneMapa)    paneMapa.style.display    = which === 'mapa' ? '' : 'none';

            // Ensanchar el panel cuando estamos en Mapa para aprovechar el viewport
            var panel = document.getElementById('estadisticas-panel');
            if (panel) {
                panel.style.maxWidth = which === 'mapa' ? '98vw' : '1200px';
            }

            if (which === 'mapa') {
                // Asegurarnos de que el mapa renderee correctamente al mostrar
                setTimeout(function () {
                    if (typeof _refreshHallazgosMap === 'function') _refreshHallazgosMap();
                }, 30);
            }
        }
        if (tabResumen) tabResumen.addEventListener('click', function () { _setEsoTab('resumen'); });
        if (tabMapa)    tabMapa.addEventListener('click', function () { _setEsoTab('mapa'); });

        return { loadEstadisticas: loadEstadisticas };
    }

    return { init: init };
})();
