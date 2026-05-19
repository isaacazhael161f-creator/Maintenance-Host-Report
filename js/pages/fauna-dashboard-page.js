window.MHRFaunaDashboardPage = (function () {
  function init(ctx) {
            (function () {
                const faunaTabs = document.querySelectorAll('.fauna-tab');
                const faunaContents = document.querySelectorAll('.fauna-tab-content');

                faunaTabs.forEach(tab => {
                    tab.addEventListener('click', function () {
                        const targetTab = this.getAttribute('data-fauna-tab');
                        const faunaTitle = this.getAttribute('data-fauna-title');

                        // Remove active class from all fauna tabs
                        faunaTabs.forEach(t => t.classList.remove('active'));
                        // Add active class to clicked tab
                        this.classList.add('active');

                        // Hide all fauna tab contents
                        faunaContents.forEach(content => content.classList.remove('active'));
                        // Show target fauna tab content
                        const targetContent = document.querySelector('.fauna-tab-content[data-fauna-tab-content="' + targetTab + '"]');
                        if (targetContent) {
                            targetContent.classList.add('active');
                        }

                        // Update main title when fauna tab changes
                        const mainTitle = document.getElementById('main-title');
                        if (mainTitle && faunaTitle) {
                            mainTitle.textContent = faunaTitle;
                        }

                        // Mostrar/ocultar sección de Pista según la pestaña
                        const pistaSection = document.getElementById('fauna_pista-section');
                        if (pistaSection) {
                            if (targetTab === 'rescate') {
                                pistaSection.style.display = 'none';
                            } else {
                                pistaSection.style.display = 'block';
                            }
                        }
                    });
                });
            })();

            // Fauna Rescate Fotos Handler
            (function () {
                const fotosInputGaleria = document.getElementById('fauna_rescate_fotos_galeria');
                const fotosInputCamara = document.getElementById('fauna_rescate_fotos_camara');
                const fotosPreview = document.getElementById('fauna_rescate_fotos_preview');
                const galeriaBtn = document.getElementById('fauna_rescate_galeria_btn');
                const camaraBtn = document.getElementById('fauna_rescate_camara_btn');
                
                if ((fotosInputGaleria || fotosInputCamara) && fotosPreview) {
                    window.faunaRescateFotos = window.faunaRescateFotos || [];
                    
                    // Button click handlers
                    if (galeriaBtn) {
                        galeriaBtn.addEventListener('click', function (e) {
                            e.preventDefault();
                            fotosInputGaleria.click();
                        });
                    }
                    
                    if (camaraBtn) {
                        camaraBtn.addEventListener('click', function (e) {
                            e.preventDefault();
                            fotosInputCamara.click();
                        });
                    }
                    
                    function setupFotosListener(inputElement) {
                        if (inputElement) {
                            inputElement.addEventListener('change', function (e) {
                                const files = Array.from(this.files || []);
                                
                                files.forEach(file => {
                                    const reader = new FileReader();
                                    reader.onload = function (event) {
                                        window.faunaRescateFotos.push({
                                            name: file.name,
                                            dataURL: event.target.result
                                        });
                                        renderFotosPreview();
                                        inputElement.value = ''; // Reset input
                                    };
                                    reader.readAsDataURL(file);
                                });
                            });
                        }
                    }
                    
                    setupFotosListener(fotosInputGaleria);
                    setupFotosListener(fotosInputCamara);
                    
                    function renderFotosPreview() {
                        fotosPreview.innerHTML = '';
                        window.faunaRescateFotos.forEach((foto, idx) => {
                            const wrapper = document.createElement('div');
                            wrapper.style.cssText = 'position:relative; width:100px; height:100px; border-radius:8px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.1);';
                            
                            const img = document.createElement('img');
                            img.src = foto.dataURL;
                            img.style.cssText = 'width:100%; height:100%; object-fit:cover;';
                            
                            const removeBtn = document.createElement('button');
                            removeBtn.type = 'button';
                            removeBtn.className = 'photo-thumb-remove';
                            removeBtn.style.cssText = 'position:absolute; top:2px; right:2px; width:24px; height:24px; padding:0; background:#ef4444; color:white; border:none; border-radius:50%; cursor:pointer; font-weight:bold; display:flex; align-items:center; justify-content:center;';
                            removeBtn.textContent = '×';
                            removeBtn.title = 'Eliminar foto';
                            removeBtn.onclick = function (e) {
                                e.preventDefault();
                                window.faunaRescateFotos.splice(idx, 1);
                                renderFotosPreview();
                            };
                            
                            wrapper.appendChild(img);
                            wrapper.appendChild(removeBtn);
                            fotosPreview.appendChild(wrapper);
                        });
                    }
                }
            })();

            // Fauna Rescate Clase Handler
            (function () {
                const claseSelect = document.getElementById('fauna_rescate_clase');
                const claseOtroInput = document.getElementById('fauna_rescate_clase_otro');
                
                if (claseSelect && claseOtroInput) {
                    claseSelect.addEventListener('change', function () {
                        if (this.value === 'Otro') {
                            claseOtroInput.style.display = 'block';
                        } else {
                            claseOtroInput.style.display = 'none';
                            claseOtroInput.value = '';
                        }
                    });
                }
            })();

            // Fauna Items (Impacto) Fotos Handler - Avistamiento, Presencia, Daño
            (function () {
                window.faunaItemPhotos = window.faunaItemPhotos || {
                    avistamiento: [],
                    presencia: [],
                    daino: []
                };

                // Configurar handlers para cada tipo de fauna
                ['avistamiento', 'presencia', 'daino'].forEach(function(faunaType) {
                    var gateriaBtn = document.querySelector('.fauna-fotos-galeria-btn[data-fauna="' + faunaType + '"]');
                    var camaraBtn = document.querySelector('.fauna-fotos-camara-btn[data-fauna="' + faunaType + '"]');
                    var fileInput = document.querySelector('.fauna-fotos-input[data-fauna="' + faunaType + '"]');
                    var preview = document.querySelector('.fauna-fotos-preview[data-fauna="' + faunaType + '"]');

                    if (!fileInput) return;

                    // Handlers para botones
                    if (gateriaBtn) {
                        gateriaBtn.addEventListener('click', function(e) {
                            e.preventDefault();
                            fileInput.click();
                        });
                    }

                    if (camaraBtn) {
                        camaraBtn.addEventListener('click', function(e) {
                            e.preventDefault();
                            var cameraInput = document.createElement('input');
                            cameraInput.type = 'file';
                            cameraInput.accept = 'image/*';
                            cameraInput.capture = 'environment';
                            cameraInput.onchange = function(e) {
                                handleFaunaPhotoSelect(faunaType, e.target.files);
                            };
                            cameraInput.click();
                        });
                    }

                    // Handler para cambio de archivo
                    fileInput.addEventListener('change', function(e) {
                        handleFaunaPhotoSelect(faunaType, e.target.files);
                        this.value = ''; // Reset
                    });

                    function handleFaunaPhotoSelect(type, files) {
                        Array.from(files || []).forEach(function(file) {
                            var reader = new FileReader();
                            reader.onload = function(event) {
                                window.faunaItemPhotos[type].push({
                                    name: file.name,
                                    dataURL: event.target.result
                                });
                                renderFaunaPhotoPreview(type);
                            };
                            reader.readAsDataURL(file);
                        });
                    }

                    function renderFaunaPhotoPreview(type) {
                        var previw = document.querySelector('.fauna-fotos-preview[data-fauna="' + type + '"]');
                        if (!previw) return;

                        previw.innerHTML = '';
                        window.faunaItemPhotos[type].forEach(function(foto, idx) {
                            var wrapper = document.createElement('div');
                            wrapper.style.cssText = 'position:relative; width:80px; height:80px; border-radius:6px; overflow:hidden; box-shadow:0 2px 6px rgba(0,0,0,0.15);';

                            var img = document.createElement('img');
                            img.src = foto.dataURL;
                            img.style.cssText = 'width:100%; height:100%; object-fit:cover;';

                            var removeBtn = document.createElement('button');
                            removeBtn.type = 'button';
                            removeBtn.style.cssText = 'position:absolute; top:0; right:0; width:20px; height:20px; padding:0; background:#ef4444; color:white; border:none; cursor:pointer; font-weight:bold; font-size:12px;';
                            removeBtn.textContent = '×';
                            removeBtn.onclick = function(e) {
                                e.preventDefault();
                                window.faunaItemPhotos[type].splice(idx, 1);
                                renderFaunaPhotoPreview(type);
                            };

                            wrapper.appendChild(img);
                            wrapper.appendChild(removeBtn);
                            previw.appendChild(wrapper);
                        });
                    }
                });
            })();

            async function cargarCatalogosFauna() {
                var client = window.supabaseClient;
                var svc = window.MHRFaunaCatalogService;
                if (!client || !svc) return;

                await Promise.all([
                    svc.cargarCatalogoSelect(client, 'catalogo_clase', document.getElementById('fauna_rescate_clase'), '-- Seleccionar Clase --'),
                    svc.cargarCatalogoSelect(client, 'catalogo_destino', document.getElementById('fauna_rescate_sitio_reubicacion'), '-- Seleccionar Sitio de Reubicación --'),
                    svc.cargarCatalogoSelect(client, 'catalogo_clase', document.getElementById('filter-fauna-clase'), 'Todas las clases'),
                    svc.cargarCatalogoSelect(client, 'catalogo_especie', document.getElementById('filter-fauna-especie'), 'Todas las especies')
                ]);

                await Promise.all([
                    svc.cargarEspeciesPorClase(client, document.getElementById('fauna_rescate_clase'), document.getElementById('fauna_rescate_especie'), '-- Seleccionar Especie --'),
                    svc.cargarEspeciesPorClase(client, document.getElementById('filter-fauna-clase'), document.getElementById('filter-fauna-especie'), 'Todas las especies')
                ]);

                var claseSelectRescate = document.getElementById('fauna_rescate_clase');
                var especieSelectRescate = document.getElementById('fauna_rescate_especie');
                if (claseSelectRescate && especieSelectRescate && claseSelectRescate.dataset.catalogoWired !== '1') {
                    claseSelectRescate.dataset.catalogoWired = '1';
                    claseSelectRescate.addEventListener('change', function () {
                        svc.cargarEspeciesPorClase(client, claseSelectRescate, especieSelectRescate, '-- Seleccionar Especie --');
                    });
                }

                var claseSelectFiltro = document.getElementById('filter-fauna-clase');
                var especieSelectFiltro = document.getElementById('filter-fauna-especie');
                if (claseSelectFiltro && especieSelectFiltro && claseSelectFiltro.dataset.catalogoWired !== '1') {
                    claseSelectFiltro.dataset.catalogoWired = '1';
                    claseSelectFiltro.addEventListener('change', function () {
                        svc.cargarEspeciesPorClase(client, claseSelectFiltro, especieSelectFiltro, 'Todas las especies');
                    });
                }
            }

            // Función para cargar estadísticas
            async function loadEstadisticas() {
                const client = window.supabaseClient;
                if (!client) {
                    console.error('Supabase client not ready');
                    return;
                }

                // Mostrar estado de carga
                ['inspection-types-chart','monthly-reports-chart'].forEach(function(id){
                    var el = document.getElementById(id);
                    if (el) el.innerHTML = '<p style="color:#6b7280;text-align:center;padding:20px">Cargando datos...</p>';
                });

                try {
                    let reports;
                    try {
                        reports = await window.MHRReportService.getReportsOrdered(client);
                    } catch (error) {
                        console.error('Error loading statistics:', error);
                        ['inspection-types-chart','monthly-reports-chart'].forEach(function(id){
                            var el = document.getElementById(id);
                            if (el) el.innerHTML = '<p style="color:#ef4444;text-align:center;padding:20px">Error al cargar datos: ' + error.message + '</p>';
                        });
                        return;
                    }

                    const totalReports = reports.length;
                    const currentMonth = new Date().getMonth();
                    const currentYear = new Date().getFullYear();

                    const reportsThisMonth = reports.filter(function(r) {
                        const d = new Date(r.created_at);
                        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
                    }).length;

                    // Prioridad promedio
                    let totalPriority = 0, priorityCount = 0;
                    reports.forEach(function(report) {
                        if (report.details) {
                            Object.values(report.details).forEach(function(detail) {
                                if (detail.prioridad && detail.prioridad !== 'N/A') {
                                    totalPriority += parseInt(detail.prioridad) || 0;
                                    priorityCount++;
                                }
                            });
                        }
                    });
                    const avgPriority = priorityCount > 0 ? (totalPriority / priorityCount).toFixed(1) : '—';

                    // Tasa de completitud
                    const completedReports = reports.filter(function(r){ return r.pdf_url; }).length;
                    const completionRate = totalReports > 0 ? Math.round((completedReports / totalReports) * 100) : 0;

                    // Contar por turno
                    const diurnos = reports.filter(function(r) {
                        return r.turno && r.turno.toString().toLowerCase().includes('diurna');
                    }).length;
                    const nocturnos = reports.filter(function(r) {
                        return r.turno && r.turno.toString().toLowerCase().includes('noct');
                    }).length;

                    // Contar por tipo de inspección
                    const primarios = reports.filter(function(r) {
                        return r.tipo_inspeccion && r.tipo_inspeccion.toString().toLowerCase().includes('primaria');
                    }).length;
                    const secundarios = reports.filter(function(r) {
                        return r.tipo_inspeccion && r.tipo_inspeccion.toString().toLowerCase().includes('secundaria');
                    }).length;

                    // Contar por pista (rwys)
                    const pistaCounts = {};
                    reports.forEach(function(r) {
                        var p = (r.pista || '').toString().trim();
                        if (!p) return;
                        pistaCounts[p] = (pistaCounts[p] || 0) + 1;
                    });
                    var pistaDisplay = '-';
                    if (Object.keys(pistaCounts).length > 0) {
                        pistaDisplay = Object.entries(pistaCounts)
                            .sort(function(a,b){ return b[1] - a[1]; })
                            .map(function(entry){ return entry[0] + ': ' + entry[1]; })
                            .slice(0, 3)
                            .join(' · ');
                    }

                    // Actualizar tarjetas de resumen
                    var elTotal = document.getElementById('total-reports');
                    var elMonth = document.getElementById('reports-this-month');
                    var elDiurnos = document.getElementById('report-diurnos');
                    var elNocturnos = document.getElementById('report-nocturnos');
                    var elPrimarios = document.getElementById('report-primarios');
                    var elSecundarios = document.getElementById('report-secundarios');
                    var elPistaCards = document.getElementById('report-pista-cards');
                    var elAvg   = document.getElementById('avg-priority');
                    var elRate  = document.getElementById('completion-rate');
                    if (elTotal) elTotal.textContent = totalReports;
                    if (elMonth) elMonth.textContent = reportsThisMonth;
                    if (elDiurnos) elDiurnos.textContent = diurnos;
                    if (elNocturnos) elNocturnos.textContent = nocturnos;
                    if (elPrimarios) elPrimarios.textContent = primarios;
                    if (elSecundarios) elSecundarios.textContent = secundarios;
                    if (elAvg)   elAvg.textContent   = avgPriority;
                    if (elRate)  elRate.textContent   = completionRate + '%';

                    if (elPistaCards) {
                        elPistaCards.innerHTML = '';
                        var entries = Object.entries(pistaCounts).sort(function(a,b){ return b[1]-a[1]; });
                        if (entries.length === 0) {
                            elPistaCards.innerHTML = '<span style="font-size:13px;color:rgba(255,255,255,0.85);">Sin datos</span>';
                        } else {
                            entries.forEach(function(entry) {
                                var label = entry[0];
                                var count = entry[1];
                                var card = document.createElement('div');
                                card.style.padding = '6px 10px';
                                card.style.borderRadius = '999px';
                                card.style.background = 'rgba(255,255,255,0.18)';
                                card.style.color = '#fff';
                                card.style.fontWeight = '700';
                                card.style.fontSize = '13px';
                                card.style.display = 'inline-flex';
                                card.style.alignItems = 'center';
                                card.style.gap = '8px';
                                card.textContent = label + ':';
                                var badge = document.createElement('span');
                                badge.textContent = count;
                                badge.style.background = 'rgba(0,0,0,0.25)';
                                badge.style.borderRadius = '999px';
                                badge.style.padding = '2px 8px';
                                badge.style.fontSize = '12px';
                                badge.style.fontWeight = '700';
                                card.appendChild(badge);
                                elPistaCards.appendChild(card);
                            });
                        }
                    }

                    // Tabla de responsables (conteo)
                    var responsableTable = document.getElementById('responsable-table-body');
                    if (responsableTable) {
                        var counts = {};
                        reports.forEach(function(r) {
                            var name = (r.responsable || '').toString().trim() || 'Sin responsable';
                            counts[name] = (counts[name] || 0) + 1;
                        });
                        var entries = Object.entries(counts).sort(function(a,b){ return b[1]-a[1]; });
                        if (entries.length === 0) {
                            responsableTable.innerHTML = '<tr><td colspan="2" style="padding:12px;color:#6b7280;text-align:center;">Sin datos</td></tr>';
                        } else {
                            responsableTable.innerHTML = '';
                            entries.forEach(function(entry) {
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

            // ── Gráfico de Tipos de Inspección (barras horizontales) ──────────────────
            function createInspectionTypesChart(reports) {
                const container = document.getElementById('inspection-types-chart');
                if (!container) return;

                const types = {};
                reports.forEach(function(r) {
                    if (Array.isArray(r.tipo_inspeccion)) {
                        r.tipo_inspeccion.forEach(function(t){ types[t] = (types[t] || 0) + 1; });
                    } else if (r.tipo_inspeccion && typeof r.tipo_inspeccion === 'string') {
                        types[r.tipo_inspeccion] = (types[r.tipo_inspeccion] || 0) + 1;
                    }
                });

                const entries = Object.entries(types).sort(function(a,b){ return b[1]-a[1]; });
                if (entries.length === 0) {
                    container.innerHTML = '<p style="color:#6b7280;text-align:center;padding:30px">Sin datos de tipo de inspección aún.</p>';
                    return;
                }

                const maxVal = entries[0][1];
                const colors = ['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#ec4899'];

                let html = '<div style="padding:10px 0;">';
                entries.forEach(function([type, count], i) {
                    const pct = maxVal > 0 ? Math.round((count / maxVal) * 100) : 0;
                    const color = colors[i % colors.length];
                    const totalPct = reports.length > 0 ? Math.round((count / reports.length) * 100) : 0;
                    html += '<div style="margin-bottom:14px;">' +
                        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">' +
                            '<span style="font-size:13px;font-weight:600;color:#1f2937;max-width:65%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + type + '</span>' +
                            '<span style="font-size:13px;color:#6b7280;">' + count + ' (' + totalPct + '%)</span>' +
                        '</div>' +
                        '<div style="background:#e5e7eb;border-radius:6px;height:14px;overflow:hidden;">' +
                            '<div style="height:100%;width:' + pct + '%;background:' + color + ';border-radius:6px;transition:width 0.6s ease;"></div>' +
                        '</div>' +
                    '</div>';
                });
                html += '</div>';
                container.innerHTML = html;
            }

            // ── Gráfico de Reportes por Mes (barras verticales) ───────────────────────
            function createMonthlyReportsChart(reports) {
                const container = document.getElementById('monthly-reports-chart');
                if (!container) return;

                const monthlyData = {};
                const monthNames = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
                reports.forEach(function(r) {
                    const d = new Date(r.created_at);
                    const key = d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0');
                    monthlyData[key] = { count: (monthlyData[key] ? monthlyData[key].count : 0) + 1, label: monthNames[d.getMonth()] + ' ' + String(d.getFullYear()).slice(2) };
                });

                const entries = Object.entries(monthlyData).sort(function(a,b){ return a[0].localeCompare(b[0]); }).slice(-8);
                if (entries.length === 0) {
                    container.innerHTML = '<p style="color:#6b7280;text-align:center;padding:30px">Sin reportes registrados aún.</p>';
                    return;
                }

                const maxVal = Math.max.apply(null, entries.map(function(e){ return e[1].count; }));
                const BAR_H = 160; // px altura máxima barra

                let html = '<div style="display:flex;align-items:flex-end;gap:8px;padding:10px 0 0;overflow-x:auto;">';
                entries.forEach(function([key, info]) {
                    const barH = maxVal > 0 ? Math.max(Math.round((info.count / maxVal) * BAR_H), 18) : 18;
                    html += '<div style="flex:1;min-width:48px;display:flex;flex-direction:column;align-items:center;gap:4px;">' +
                        '<span style="font-size:12px;font-weight:700;color:#1f2937;">' + info.count + '</span>' +
                        '<div style="width:100%;height:' + barH + 'px;background:linear-gradient(180deg,#3b82f6,#1d4ed8);border-radius:6px 6px 0 0;"></div>' +
                        '<span style="font-size:11px;color:#6b7280;white-space:nowrap;">' + info.label + '</span>' +
                    '</div>';
                });
                html += '</div>';
                container.innerHTML = html;
            }

            // Event listener para el botón de actualizar estadísticas
            document.getElementById('refresh-estadisticas-btn')?.addEventListener('click', loadEstadisticas);

            // Función para cargar estadísticas de fauna desde Supabase
            async function loadFaunaStatistics() {
                const client = window.supabaseClient;
                if (!client) {
                    console.error('Supabase client not ready');
                    return;
                }

                // Mostrar estado de carga
                ['impactos-tipo-table-body', 'especies-rescatadas-table-body', 'estadisticas-diarias-table-body'].forEach(function(id){
                    var el = document.getElementById(id);
                    if (el) el.innerHTML = '<tr><td colspan="3" style="padding:12px;color:#6b7280;text-align:center;">Cargando datos...</td></tr>';
                });

                try {
                    const faunaData = await window.MHRFaunaReportService.getAllFaunaReports(client);

                    var impactData = (faunaData || []).filter(function(r){ return r.tipo_reporte !== 'Rescate'; });
                    var rescateData = (faunaData || []).filter(function(r){ return r.tipo_reporte === 'Rescate'; });
                    var impactosTipoCount = {};
                    impactData.forEach(function(r){
                        var key = (r.evento || r.tipo_reporte || 'Impacto');
                        impactosTipoCount[key] = (impactosTipoCount[key] || 0) + 1;
                    });
                    var impactosTipo = Object.keys(impactosTipoCount).map(function(k){
                        return { tipo_item: k, total: impactosTipoCount[k] };
                    }).sort(function(a, b){ return b.total - a.total; });

                    var especiesIndex = {};
                    rescateData.forEach(function(r){
                        var key = (r.clase || 'N/A') + '||' + (r.especie || 'N/A');
                        especiesIndex[key] = especiesIndex[key] || { clase: r.clase || 'N/A', especie: r.especie || 'N/A', total_rescates: 0 };
                        especiesIndex[key].total_rescates += 1;
                    });
                    var especiesRescatadas = Object.values(especiesIndex).sort(function(a, b){ return b.total_rescates - a.total_rescates; });

                    var dailyIndex = {};
                    (faunaData || []).forEach(function(r){
                        var key = r.fecha_reporte || null;
                        if (!key) return;
                        dailyIndex[key] = (dailyIndex[key] || 0) + (r.estado === 'pendiente' ? 1 : 0);
                    });
                    var estadisticasDiarias = Object.keys(dailyIndex).sort().map(function(fecha){
                        return { fecha_reporte: fecha, reportes_pendientes: dailyIndex[fecha] };
                    });

                    // Actualizar tarjetas de resumen
                    var totalImpactos = impactData ? impactData.length : 0;
                    var totalRescates = rescateData ? rescateData.length : 0;

                    var elTotalImpactos = document.getElementById('total-impactos-fauna');
                    var elTotalRescates = document.getElementById('total-rescates-fauna');
                    if (elTotalImpactos) elTotalImpactos.textContent = totalImpactos;
                    if (elTotalRescates) elTotalRescates.textContent = totalRescates;

                    // Encontrar especie más rescatada
                    var especieMasRescatada = '-';
                    if (especiesRescatadas && especiesRescatadas.length > 0) {
                        especieMasRescatada = especiesRescatadas[0].especie || '-';
                    }
                    var elEspecieMas = document.getElementById('especie-más-rescatada');
                    if (elEspecieMas) elEspecieMas.textContent = especieMasRescatada;

                    // Encontrar clase más rescatada
                    var claseMasRescatada = '-';
                    if (rescateData && rescateData.length > 0) {
                        var claseCounts = {};
                        rescateData.forEach(function(r){
                            if (r.clase) {
                                claseCounts[r.clase] = (claseCounts[r.clase] || 0) + 1;
                            }
                        });
                        if (Object.keys(claseCounts).length > 0) {
                            claseMasRescatada = Object.entries(claseCounts).sort(function(a,b){ return b[1]-a[1]; })[0][0];
                        }
                    }
                    var elClaseMas = document.getElementById('clase-más-rescatada');
                    if (elClaseMas) elClaseMas.textContent = claseMasRescatada;

                    // Tabla de impactos por tipo
                    var impactosTable = document.getElementById('impactos-tipo-table-body');
                    if (impactosTable) {
                        if (!impactosTipo || impactosTipo.length === 0) {
                            impactosTable.innerHTML = '<tr><td colspan="2" style="padding:12px;color:#6b7280;text-align:center;">Sin datos</td></tr>';
                        } else {
                            impactosTable.innerHTML = '';
                            impactosTipo.forEach(function(item) {
                                var tr = document.createElement('tr');
                                tr.innerHTML = '<td style="padding:10px;border-bottom:1px solid #e5e7eb;">' + (item.tipo_item || 'N/A') + '</td>' +
                                               '<td style="padding:10px;border-bottom:1px solid #e5e7eb;text-align:right;font-weight:600;">' + (item.total || 0) + '</td>';
                                impactosTable.appendChild(tr);
                            });
                        }
                    }

                    // Tabla de especies rescatadas
                    var especiesTable = document.getElementById('especies-rescatadas-table-body');
                    if (especiesTable) {
                        if (!especiesRescatadas || especiesRescatadas.length === 0) {
                            especiesTable.innerHTML = '<tr><td colspan="3" style="padding:12px;color:#6b7280;text-align:center;">Sin datos</td></tr>';
                        } else {
                            especiesTable.innerHTML = '';
                            especiesRescatadas.forEach(function(item) {
                                var tr = document.createElement('tr');
                                tr.innerHTML = '<td style="padding:10px;border-bottom:1px solid #e5e7eb;">' + (item.clase || 'N/A') + '</td>' +
                                               '<td style="padding:10px;border-bottom:1px solid #e5e7eb;">' + (item.especie || 'N/A') + '</td>' +
                                               '<td style="padding:10px;border-bottom:1px solid #e5e7eb;text-align:right;font-weight:600;">' + (item.total_rescates || 0) + '</td>';
                                especiesTable.appendChild(tr);
                            });
                        }
                    }

                    // Tabla de estadísticas diarias
                    var diariaTable = document.getElementById('estadisticas-diarias-table-body');
                    if (diariaTable) {
                        if (!estadisticasDiarias || estadisticasDiarias.length === 0) {
                            diariaTable.innerHTML = '<tr><td colspan="2" style="padding:12px;color:#6b7280;text-align:center;">Sin datos</td></tr>';
                        } else {
                            diariaTable.innerHTML = '';
                            estadisticasDiarias.forEach(function(item) {
                                var tr = document.createElement('tr');
                                var fecha = item.fecha_reporte ? new Date(item.fecha_reporte).toLocaleDateString('es-ES') : 'N/A';
                                tr.innerHTML = '<td style="padding:10px;border-bottom:1px solid #e5e7eb;">' + fecha + '</td>' +
                                               '<td style="padding:10px;border-bottom:1px solid #e5e7eb;text-align:right;font-weight:600;">' + (item.reportes_pendientes || 0) + '</td>';
                                diariaTable.appendChild(tr);
                            });
                        }
                    }

                } catch (err) {
                    console.error('Error in loadFaunaStatistics:', err);
                }
            }

            // Función para cargar reportes de fauna desde Supabase
            async function loadFaunaReports(filters) {
                const client = window.supabaseClient;
                if (!client) {
                    console.error('Supabase client not ready');
                    return;
                }

                const reportsList = document.getElementById('fauna-reports-list');
                const reportsCount = document.getElementById('fauna-reports-count');
                
                if (reportsList) {
                    reportsList.innerHTML = '<tr><td colspan="7" style="padding:20px;text-align:center;color:#6b7280;">Cargando reportes...</td></tr>';
                }

                try {
                    const faunaData = await window.MHRFaunaReportService.getFaunaReportsByFilters(client, {
                        fechaDesde: filters.fechaDesde,
                        fechaHasta: filters.fechaHasta,
                        clase: filters.clase && filters.clase !== '' ? filters.clase : '',
                        especie: filters.especie && filters.especie !== '' ? filters.especie : ''
                    });

                    // Combinar reportes según filtro de tipo
                    let allReports = (faunaData || []).filter(function(report) {
                        if (filters.tipo === 'impacto') return report.tipo_reporte !== 'Rescate';
                        if (filters.tipo === 'rescate') return report.tipo_reporte === 'Rescate';
                        return true;
                    });


                    // Renderizar tabla
                    if (reportsList) {
                        if (allReports.length === 0) {
                            reportsList.innerHTML = '<tr><td colspan="7" style="padding:20px;text-align:center;color:#6b7280;">No hay reportes que coincidan con los filtros</td></tr>';
                        } else {
                            reportsList.innerHTML = '';
                            var faunaRows = [];
                            allReports.forEach(function(report) {
                                let fechaReporte = report.fecha_reporte ? new Date(report.fecha_reporte).toLocaleDateString('es-ES') : '-';
                                
                                // Extraer hora: primero intentar del folio, luego de created_at
                                let horaExtraida = null;
                                
                                // Intentar extraer hora del folio (formato: YYYYMMDD-HHMMSS)
                                if (report.folio) {
                                    const folioParts = report.folio.split('-');
                                    if (folioParts.length === 2 && folioParts[1] && folioParts[1].length === 6) {
                                        const hh = folioParts[1].substring(0, 2);
                                        const mm = folioParts[1].substring(2, 4);
                                        const ss = folioParts[1].substring(4, 6);
                                        horaExtraida = hh + ':' + mm + ':' + ss;
                                    }
                                }
                                
                                // Si no hay hora del folio, intentar del created_at
                                if (!horaExtraida && report.created_at) {
                                    try {
                                        const fecha = new Date(report.created_at);
                                        const hh = fecha.getHours().toString().padStart(2, '0');
                                        const mm = fecha.getMinutes().toString().padStart(2, '0');
                                        const ss = fecha.getSeconds().toString().padStart(2, '0');
                                        horaExtraida = hh + ':' + mm + ':' + ss;
                                    } catch (e) {
                                        horaExtraida = null;
                                    }
                                }
                                
                                if (horaExtraida) {
                                    fechaReporte = fechaReporte + ' ' + horaExtraida;
                                }
                                
                                const especie = report.especie || '-';
                                const ubicacion = report.ubicacion_texto || report.zona || '-';
                                const responsable = report.responsable || '-';
                                const estado = report.estado || 'pendiente';
                                
                                // Usar tipo_reporte del campo de base de datos directamente
                                let tipoReporte = report.tipo_reporte || report.tipoReporte || '-';
                                
                                // Fallback por datos disponibles si no hay tipo_reporte
                                if (tipoReporte === '-' || !tipoReporte) {
                                    if (report.evento) {
                                        tipoReporte = report.evento || 'Impacto';
                                    } else if (report.clase || report.sitio_reubicacion) {
                                        tipoReporte = 'Rescate';
                                    }
                                }
                                

                                const tr = document.createElement('tr');
                                tr.style.borderBottom = '1px solid #e5e7eb';
                                
                                // Crear link de PDF si existe
                                let pdfLink = '<a href="#" style="color:#6b7280;text-decoration:none;font-size:12px;">-</a>';
                                if (report.pdf_url && report.pdf_url.trim() !== '') {
                                    pdfLink = '<a href="' + report.pdf_url + '" target="_blank" style="color:#3b82f6;text-decoration:none;font-size:12px;font-weight:600;">📄 Ver PDF</a>';
                                } else {
                                    console.warn('⚠️ Sin PDF para folio', report.folio, '- pdf_url:', report.pdf_url);
                                }
                                
                                tr.innerHTML = '<td style="padding:12px;">' + fechaReporte + '</td>' +
                                               '<td style="padding:12px;"><span style="display:inline-block;padding:4px 8px;border-radius:4px;font-size:12px;font-weight:600;background:' + 
                                               (tipoReporte === 'Impacto' || tipoReporte === 'Posible Impacto' ? '#fee2e2;color:#991b1b' : '#dcfce7;color:#166534') + ';">' + tipoReporte + '</span></td>' +
                                               '<td style="padding:12px;">' + especie + '</td>' +
                                               '<td style="padding:12px;">' + ubicacion + '</td>' +
                                               '<td style="padding:12px;">' + responsable + '</td>' +
                                               '<td style="padding:12px;"><span style="display:inline-block;padding:4px 8px;border-radius:4px;font-size:12px;font-weight:600;background:' + 
                                               (estado === 'pendiente' ? '#fef3c7;color:#92400e' : '#dbeafe;color:#1e40af') + ';">' + estado + '</span></td>' +
                                               '<td style="padding:12px;text-align:center;">' + pdfLink + '</td>';
                                faunaRows.push(tr);
                            });
                            if (window.MHRUtils && typeof window.MHRUtils.renderRows === 'function') {
                                window.MHRUtils.renderRows(reportsList, faunaRows);
                            } else {
                                var faunaRowsFragment = document.createDocumentFragment();
                                faunaRows.forEach(function (row) { faunaRowsFragment.appendChild(row); });
                                reportsList.appendChild(faunaRowsFragment);
                            }
                        }
                    }

                    if (reportsCount) {
                        reportsCount.textContent = 'Total de reportes: ' + allReports.length;
                    }

                } catch (err) {
                    console.error('Error in loadFaunaReports:', err);
                    if (reportsList) {
                        reportsList.innerHTML = '<tr><td colspan="7" style="padding:20px;text-align:center;color:#ef4444;">Error al cargar reportes</td></tr>';
                    }
                }
            }

            // Configurar filtros de fauna
            var currentFaunaFilters = {};
            var debouncedLoadFaunaReports = (window.MHRUtils && typeof window.MHRUtils.debounce === 'function')
                ? window.MHRUtils.debounce(function (filters) { loadFaunaReports(filters); }, 250)
                : function (filters) { loadFaunaReports(filters); };

            function readFaunaFilters() {
                return {
                    fechaDesde: document.getElementById('filter-fauna-fecha-desde')?.value || '',
                    fechaHasta: document.getElementById('filter-fauna-fecha-hasta')?.value || '',
                    clase: document.getElementById('filter-fauna-clase')?.value || '',
                    especie: document.getElementById('filter-fauna-especie')?.value || '',
                    tipo: document.getElementById('filter-fauna-tipo')?.value || ''
                };
            }

            // Event listeners para filtros
            document.getElementById('fauna-filter-apply-btn')?.addEventListener('click', function() {
                currentFaunaFilters = readFaunaFilters();
                debouncedLoadFaunaReports(currentFaunaFilters);
            });

            document.getElementById('fauna-filter-clear-btn')?.addEventListener('click', function() {
                document.getElementById('filter-fauna-fecha-desde').value = '';
                document.getElementById('filter-fauna-fecha-hasta').value = '';
                document.getElementById('filter-fauna-clase').value = '';
                document.getElementById('filter-fauna-especie').value = '';
                document.getElementById('filter-fauna-tipo').value = '';
                currentFaunaFilters = {};
                debouncedLoadFaunaReports({});
            });

            document.getElementById('fauna-refresh-btn')?.addEventListener('click', function() {
                debouncedLoadFaunaReports(currentFaunaFilters);
            });

            // ─── Mapa de hallazgos en Estadística Fauna ─────────────────────────
            var faunaMapModal = document.getElementById('fauna-hallazgos-map-modal');
            var openFaunaMapBtn = document.getElementById('open-fauna-hallazgos-map-btn');
            var closeFaunaMapBtn = document.getElementById('close-fauna-hallazgos-map-btn');
            var faunaHistoricoResumen = document.getElementById('fauna-hallazgos-historico-resumen');
            var faunaExportPdfBtn = document.getElementById('export-fauna-hallazgos-pdf-btn');
            var faunaYearSelect = document.getElementById('fauna-hallazgos-year');
            var faunaMonthSelect = document.getElementById('fauna-hallazgos-month');
            var faunaClaseSelect = document.getElementById('fauna-hallazgos-clase');
            var faunaEspecieSelect = document.getElementById('fauna-hallazgos-especie');
            var faunaHallazgosMap = null;
            var faunaHallazgosMarkersLayer = null;
            var faunaHallazgosYears = [];
            var faunaMapBusy = false;
            var faunaMonthNames = ['Todos los meses', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

            function renderMonthOptions() {
                if (!faunaMonthSelect) return;
                var prev = faunaMonthSelect.value || '';
                faunaMonthSelect.innerHTML = '';
                for (var i = 0; i <= 12; i++) {
                    var op = document.createElement('option');
                    op.value = i === 0 ? '' : String(i).padStart(2, '0');
                    op.textContent = faunaMonthNames[i];
                    faunaMonthSelect.appendChild(op);
                }
                faunaMonthSelect.value = prev;
            }

            async function loadFaunaHallazgosYears() {
                if (!window.supabaseClient || !faunaYearSelect) return;
                var years = await window.MHRFaunaReportService.getHallazgosYears(window.supabaseClient);
                faunaHallazgosYears = years;
                faunaYearSelect.innerHTML = '';
                var allOption = document.createElement('option');
                allOption.value = '';
                allOption.textContent = 'Todos los años';
                faunaYearSelect.appendChild(allOption);
                years.forEach(function (y) {
                    var op = document.createElement('option');
                    op.value = y;
                    op.textContent = y;
                    faunaYearSelect.appendChild(op);
                });
            }

            async function loadFaunaHallazgosClaseEspecieCombos() {
                await cargarCatalogoSelect('catalogo_clase', faunaClaseSelect, 'Todas las clases');
                await cargarEspeciesPorClase(faunaClaseSelect, faunaEspecieSelect, 'Todas las especies');
            }

            function formatFaunaHistorico(resumenMap) {
                var entries = Object.entries(resumenMap || {});
                if (!entries.length) return 'Sin datos de rescates con coordenadas para el período seleccionado.';
                return entries
                    .sort(function (a, b) { return b[1] - a[1]; })
                    .map(function (entry) { return '• ' + entry[0] + ': ' + entry[1]; })
                    .join('<br>');
            }

            function getFaunaClaseMarkerColor(claseNombre) {
                var claseNorm = normalizarTextoCatalogo(claseNombre);
                if (claseNorm === 'reptil') return '#16a34a'; // verde
                if (claseNorm === 'mamifero') return '#8b5a2b'; // cafe
                if (claseNorm === 'ave') return '#2563eb'; // azul
                return '#64748b'; // default gris-azulado
            }

            async function loadFaunaHallazgosMapData() {
                if (!window.supabaseClient || !faunaHistoricoResumen || !faunaHallazgosMap) return;
                var selectedYear = faunaYearSelect ? faunaYearSelect.value : '';
                var selectedMonth = faunaMonthSelect ? faunaMonthSelect.value : '';
                var selectedClase = faunaClaseSelect ? faunaClaseSelect.value : '';
                var selectedEspecie = faunaEspecieSelect ? faunaEspecieSelect.value : '';

                var data = await window.MHRFaunaReportService.getHallazgosMapData(window.supabaseClient, {
                    year: selectedYear,
                    month: selectedMonth,
                    clase: selectedClase,
                    especie: selectedEspecie
                });

                if (!faunaHallazgosMarkersLayer) faunaHallazgosMarkersLayer = L.layerGroup().addTo(faunaHallazgosMap);
                faunaHallazgosMarkersLayer.clearLayers();
                var bounds = [];
                var resumen = {};
                (data || []).forEach(function (row) {
                    var lat = Number(row.ubicacion_lat);
                    var lng = Number(row.ubicacion_lng);
                    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
                    bounds.push([lat, lng]);
                    var clase = row.clase || 'Sin clase';
                    var especie = row.especie || 'Sin especie';
                    var key = clase + ' / ' + especie;
                    resumen[key] = (resumen[key] || 0) + 1;
                    var markerColor = getFaunaClaseMarkerColor(clase);
                    L.circleMarker([lat, lng], {
                        radius: 8,
                        color: '#ffffff',
                        weight: 2,
                        fillColor: markerColor,
                        fillOpacity: 0.95
                    }).bindPopup(
                        '<strong>Folio:</strong> ' + (row.folio || '-') + '<br>' +
                        '<strong>Fecha:</strong> ' + (row.fecha_reporte || '-') + '<br>' +
                        '<strong>Clase:</strong> ' + clase + '<br>' +
                        '<strong>Especie:</strong> ' + especie + '<br>' +
                        '<strong>Ubicación:</strong> ' + (row.ubicacion_texto || 'N/D')
                    ).bindTooltip(
                        '<strong>Especie:</strong> ' + especie + '<br><strong>Fecha:</strong> ' + (row.fecha_reporte || '-'),
                        { direction: 'top', offset: [0, -8], opacity: 0.95 }
                    ).addTo(faunaHallazgosMarkersLayer);
                });
                if (bounds.length) {
                    faunaHallazgosMap.fitBounds(bounds, { padding: [24, 24] });
                } else {
                    faunaHallazgosMap.setView([19.7470, -99.0125], 15);
                }
            }

            async function ensureFaunaSkeletonMap() {
                if (faunaHallazgosMap) return;
                faunaHallazgosMap = L.map('fauna-hallazgos-map', {
                    center: [19.7470, -99.0125],
                    zoom: 15,
                    scrollWheelZoom: true
                });
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '&copy; OpenStreetMap contributors',
                    maxZoom: 20
                }).addTo(faunaHallazgosMap);
                faunaHallazgosMap.setView([19.7470, -99.0125], 15);
            }

            openFaunaMapBtn?.addEventListener('click', async function () {
                if (!faunaMapModal) return;
                if (faunaMapBusy) return;
                faunaMapBusy = true;
                faunaMapModal.style.display = 'block';
                setTimeout(async function () {
                    try {
                        await ensureFaunaSkeletonMap();
                        renderMonthOptions();
                        await loadFaunaHallazgosClaseEspecieCombos();
                        await loadFaunaHallazgosYears();
                        if (faunaYearSelect && faunaHallazgosYears.length) faunaYearSelect.value = faunaHallazgosYears[0];
                        await loadFaunaHallazgosMapData();
                        if (faunaHallazgosMap) faunaHallazgosMap.invalidateSize();
                    } catch (mapErr) {
                        console.error('Error cargando mapa de hallazgos fauna:', mapErr);
                        if (faunaHistoricoResumen) faunaHistoricoResumen.innerHTML = 'No se pudo cargar el histórico de ubicaciones.';
                    } finally {
                        faunaMapBusy = false;
                    }
                }, 0);
            });

            faunaYearSelect?.addEventListener('change', function () { loadFaunaHallazgosMapData(); });
            faunaMonthSelect?.addEventListener('change', function () { loadFaunaHallazgosMapData(); });
            faunaClaseSelect?.addEventListener('change', async function () {
                await cargarEspeciesPorClase(faunaClaseSelect, faunaEspecieSelect, 'Todas las especies');
                loadFaunaHallazgosMapData();
            });
            faunaEspecieSelect?.addEventListener('change', function () { loadFaunaHallazgosMapData(); });

            closeFaunaMapBtn?.addEventListener('click', function () {
                if (faunaMapModal) faunaMapModal.style.display = 'none';
            });

            faunaMapModal?.addEventListener('click', function (e) {
                if (e.target === faunaMapModal) faunaMapModal.style.display = 'none';
            });

            faunaExportPdfBtn?.addEventListener('click', function () {
                if (typeof html2pdf === 'undefined') {
                    alert('html2pdf no disponible');
                    return;
                }
                var area = document.getElementById('fauna-map-export-area');
                if (!area) return;
                var opt = {
                    margin: 8,
                    filename: 'mapa_hallazgos_fauna.pdf',
                    image: { type: 'jpeg', quality: 0.95 },
                    html2canvas: { scale: 2, useCORS: true },
                    jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
                };
                html2pdf().set(opt).from(area).save();
            });

            // Event listener para el botón de actualizar estadísticas de fauna
            document.getElementById('refresh-estadisticas-fauna-btn')?.addEventListener('click', loadFaunaStatistics);
  }
  return { init: init };
})();
