window.MHRFaunaSubmitPage = (function () {
  function init(ctx) {
    var supabase = ctx && ctx.supabase;
            var faunaForm = document.getElementById('fauna-form');
            if (faunaForm) {
                faunaForm.addEventListener('submit', async function (e) {
                    e.preventDefault();

                    // Feedback visual
                    var submitBtn = faunaForm.querySelector('input[type="submit"]');
                    if (submitBtn) {
                        submitBtn.disabled = true;
                        submitBtn.value = 'Generando PDF...';
                    }

                    try {
                        // Recopilar datos de fauna
                        function pad(n) { return n.toString().padStart(2, '0'); }
                        var now = new Date();
                        var fechaLocal = pad(now.getDate()) + '/' + pad(now.getMonth() + 1) + '/' + now.getFullYear() + ' ' + pad(now.getHours()) + ':' + pad(now.getMinutes()) + ':' + pad(now.getSeconds());
                        var folio = now.getFullYear().toString() + pad(now.getMonth() + 1) + pad(now.getDate()) + '-' + pad(now.getHours()) + pad(now.getMinutes()) + pad(now.getSeconds());

                        // ═════════════════ DETECTAR PESTAÑA ACTIVA ═════════════════
                        var impactoTab = document.querySelector('.fauna-tab-content[data-fauna-tab-content="impacto"]');
                        var rescateTab = document.querySelector('.fauna-tab-content[data-fauna-tab-content="rescate"]');
                        var isImpacto = impactoTab && impactoTab.classList.contains('active');
                        var isRescate = rescateTab && rescateTab.classList.contains('active');
                        

                        var client = window.supabaseClient;
                        if (!client) {
                            alert('Error: No hay conexión con Supabase');
                            submitBtn.disabled = false;
                            submitBtn.value = 'Generar reporte';
                            return;
                        }

                        function parseCoordsFromText(rawText) {
                            if (!rawText || typeof rawText !== 'string') return { lat: null, lng: null };
                            var txt = rawText.trim();
                            var match = txt.match(/(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)/);
                            if (!match) return { lat: null, lng: null };
                            var lat = parseFloat(match[1]);
                            var lng = parseFloat(match[2]);
                            if (isNaN(lat) || isNaN(lng)) return { lat: null, lng: null };
                            return { lat: lat, lng: lng };
                        }

                        // ═════════════════════════════════════════════════════════
                        // GUARDAR IMPACTO
                        // ═════════════════════════════════════════════════════════
                        if (isImpacto) {
                            var evento = faunaForm.querySelector('input[name="fauna_report_evento"]:checked')?.value || '';
                            var faseVuelo = faunaForm.querySelector('input[name="fauna_report_fase_vuelo"]:checked')?.value || '';
                            var pista = faunaForm.querySelector('input[name="fauna_pista"]:checked')?.value || '';
                            var responsableSelect = document.getElementById('fauna_report-authors-select');
                            var responsable = responsableSelect ? responsableSelect.value : '';
                            var cargoSelect = document.getElementById('fauna_report-role');
                            var cargo = cargoSelect ? cargoSelect.value : '';
                            var aerolinea = faunaForm.querySelector('input[name="fauna_report_aerolinea"]')?.value || '';
                            var parteAvion = faunaForm.querySelector('select[name="fauna_report_parte_avion"]')?.value || '';
                            var zona = faunaForm.querySelector('select[name="fauna_report_ubicacion"]')?.value || '';

                            var impactPayload = {
                                folio: folio,
                                fecha_reporte: new Date().toISOString().split('T')[0],
                                evento: evento,
                                fase_vuelo: faseVuelo,
                                pista: pista,
                                responsable: responsable,
                                cargo: cargo,
                                aerolinea: aerolinea,
                                parte_avion: parteAvion,
                                zona: zona,
                                ubicacion_texto: null,
                                ubicacion_lat: null,
                                ubicacion_lng: null,
                                detalle_items: [],
                                estado: 'completado',
                                tipo_reporte: evento || 'Impacto',
                                pdf_url: null
                            };


                            // Obtener logo del header o usar base64 precargado
                            var logoSrc = '';
                            if (window.logoBase64) {
                                logoSrc = window.logoBase64;
                            } else {
                                try { 
                                    var logoEl = document.querySelector('.report-header .left img'); 
                                    if (logoEl) {
                                        var src = logoEl.getAttribute('src');
                                        if (src && !src.startsWith('http') && !src.startsWith('data:')) {
                                            var baseUrl = window.location.origin + window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/'));
                                            logoSrc = baseUrl + '/' + src;
                                        } else {
                                            logoSrc = src;
                                        }
                                    }
                                } catch (e) { }
                            }
                            
                            // Fallback logo
                            var inlineLogo = '<svg xmlns="http://www.w3.org/2000/svg" width="180" height="70" viewBox="0 0 180 70" style="display:block;margin:0 auto;">' +
                                '<rect width="100%" height="100%" fill="#0b66c3" rx="6" />' +
                                '<g transform="translate(12,10)">' +
                                '<circle cx="20" cy="20" r="16" fill="#fff" />' +
                                '<path d="M 20 8 L 28 20 L 24 20 L 24 28 L 16 28 L 16 20 L 12 20 Z" fill="#0b66c3"/>' +
                                '</g>' +
                                '<text x="95" y="28" font-family="Arial, sans-serif" font-size="18" fill="#ffffff" font-weight="bold">Fauna</text>' +
                                '<text x="95" y="48" font-family="Arial, sans-serif" font-size="11" fill="#e8f1f8">Control Aeródromo</text>' +
                                '</svg>';

                            // Generar HTML del reporte impacto para PDF con formato profesional (similar a revisión)
                            var impactoReportSummary = document.createElement('div');
                            var impactoHtml = '<div style="font-family:Arial,Helvetica,sans-serif;color:#0f1724;max-width:210mm;margin:0 auto;padding:12mm;">';
                            
                            // Obtener membrete (similar a revisión)
                            var membreteLines = [];
                            try {
                                document.querySelectorAll('.report-header .meta > div').forEach(function(d) {
                                    if (d.querySelector && d.querySelector('#report-date')) return;
                                    if (d.querySelector && d.querySelector('button')) return;
                                    var txt = d.textContent.trim(); if (txt) membreteLines.push(txt);
                                });
                            } catch (e) { }

                            // Header: membrete izquierda, logo+titulo centrado, folio derecha (estilo revisión)
                            impactoHtml += '<div style="display:flex;justify-content:space-between;align-items:center;">';
                            // membrete (izq)
                            impactoHtml += '<div style="min-width:180px;">';
                            if (membreteLines.length) { 
                                impactoHtml += '<div style="font-size:12px;color:#1f2937;line-height:1.1">'; 
                                membreteLines.forEach(function (line) { impactoHtml += '<div>' + line + '</div>'; }); 
                                impactoHtml += '</div>'; 
                            }
                            impactoHtml += '</div>';

                            // centro: logo sobre título (centrado)
                            impactoHtml += '<div style="flex:1;text-align:center;padding:0 12px">';
                            if (logoSrc) { 
                                impactoHtml += '<img src="' + logoSrc + '" style="height:120px;display:block;margin:0 auto 6px">'; 
                            } else { 
                                impactoHtml += inlineLogo; 
                            }
                            impactoHtml += '<h2 style="color:#0b66c3;margin:0;font-size:20px;">Reporte de Control de Fauna</h2>';
                            impactoHtml += '<div style="margin-top:6px;font-size:14px;color:#111;font-weight:700;">Impacto Faunístico</div>';
                            impactoHtml += '</div>';

                            // derecha: UTC time (hora) con fecha debajo, y folio
                            impactoHtml += '<div style="text-align:right;color:#6b7280;font-size:12px;min-width:120px">';
                            impactoHtml += '<div><strong>' + folio + '</strong></div>';
                            impactoHtml += '<div style="font-size:12px;color:#6b7280;margin-top:6px">' + (new Date().toISOString().split('T')[0]) + '</div>';
                            impactoHtml += '</div>';
                            impactoHtml += '</div>';

                            // Mostrar Evento, Fase, Pista, Responsable, Cargo distribuidos horizontalmente (flex)
                            impactoHtml += '<div style="display:flex;justify-content:center;gap:18px;flex-wrap:wrap;margin-top:12px;align-items:center">';
                            var sep = '<div style="width:1px;height:28px;background:#e6eef9;margin:0 8px;display:inline-block;vertical-align:middle"></div>';
                            impactoHtml += '<div style="min-width:140px;text-align:center;font-size:13px;color:#374151">Tipo de Evento<br><strong>' + (evento || '-') + '</strong></div>';
                            impactoHtml += sep;
                            impactoHtml += '<div style="min-width:120px;text-align:center;font-size:13px;color:#374151">Fase de Vuelo<br><strong>' + (faseVuelo || '-') + '</strong></div>';
                            impactoHtml += sep;
                            impactoHtml += '<div style="min-width:100px;text-align:center;font-size:13px;color:#374151">Pista<br><strong>' + (pista || '-') + '</strong></div>';
                            impactoHtml += sep;
                            impactoHtml += '<div style="min-width:140px;text-align:center;font-size:13px;color:#374151">Responsable<br><strong>' + (responsable || '-') + '</strong></div>';
                            impactoHtml += sep;
                            impactoHtml += '<div style="min-width:140px;text-align:center;font-size:13px;color:#374151">Cargo<br><strong>' + (cargo || '-') + '</strong></div>';
                            impactoHtml += '</div>';
                            impactoHtml += '<hr style="border:none;border-top:1px solid #e6eef9;margin:12px 0">';

                            // Tabla de información detallada
                            impactoHtml += '<table style="width:100%;border-collapse:collapse;font-size:13px;">';
                            impactoHtml += '<thead><tr>' +
                                '<th style="text-align:left;padding:8px;border-bottom:1px solid #e6eef9;width:30%">Concepto</th>' +
                                '<th style="text-align:left;padding:8px;border-bottom:1px solid #e6eef9;width:70%">Valor</th>' +
                                '</tr></thead>';
                            impactoHtml += '<tbody>';
                            impactoHtml += '<tr>' +
                                '<td style="vertical-align:top;padding:10px;border-bottom:1px solid #f0f6ff;font-weight:600;background:#f5f8fc">Aerolínea</td>' +
                                '<td style="vertical-align:top;padding:10px;border-bottom:1px solid #f0f6ff">' + (aerolinea || '-') + '</td>' +
                                '</tr>';
                            impactoHtml += '<tr>' +
                                '<td style="vertical-align:top;padding:10px;border-bottom:1px solid #f0f6ff;font-weight:600;background:#f5f8fc">Parte del avión</td>' +
                                '<td style="vertical-align:top;padding:10px;border-bottom:1px solid #f0f6ff">' + (parteAvion || '-') + '</td>' +
                                '</tr>';
                            impactoHtml += '<tr>' +
                                '<td style="vertical-align:top;padding:10px;border-bottom:1px solid #f0f6ff;font-weight:600;background:#f5f8fc">Zona</td>' +
                                '<td style="vertical-align:top;padding:10px;border-bottom:1px solid #f0f6ff">' + (zona || '-') + '</td>' +
                                '</tr>';
                            impactoHtml += '</tbody></table>';

                            // ═════ RECOPILAR ITEMS COMPLETADOS DE FAUNA (IMPACTO) ═════
                            impactoHtml += '<h3 style="color:#0b66c3;margin-top:20px;font-size:16px;margin-bottom:10px;">Detalles del Reporte de Fauna</h3>';
                            
                            // Recopilar items de fauna completados
                            var faunaItems = [];
                            [{
                                value: 'Otro evento',
                                detailsId: 'fauna_details_avistamiento'
                            }].forEach(function (itemCfg) {
                                var itemValue = itemCfg.value;
                                var detailsDiv = document.getElementById(itemCfg.detailsId);
                                
                                if (detailsDiv) {
                                    var itemFields = [];
                                    var inputs = detailsDiv.querySelectorAll('input, textarea, select');
                                    
                                    inputs.forEach(function(el) {
                                        if (!el || !el.name) return;
                                        var val = '';
                                        
                                        // Obtener valor según tipo
                                        if (el.type === 'checkbox' || el.type === 'radio') {
                                            if (!el.checked) return;
                                            val = el.value || 'Seleccionado';
                                        } else {
                                            val = (el.value || '').toString().trim();
                                        }
                                        
                                        if (val === '') return;
                                        
                                        // Extraer nombre legible del campo
                                        var fieldName = el.name;
                                        if (fieldName.includes('[')) {
                                            fieldName = fieldName.split('[')[2].replace(']', ''); // ej: fauna_details[avistamiento][lugar] -> lugar
                                        }
                                        
                                        // Mapeo de nombres de campos más visuales
                                        var fieldLabels = {
                                            'lugar': 'Ubicación',
                                            'especie': 'Especie',
                                            'especie_otra': 'Otra Especie',
                                            'cantidad': 'Cantidad',
                                            'condicion': 'Condición del Daño',
                                            'observaciones': 'Observaciones',
                                            'prioridad': 'Prioridad',
                                            'tipo_animal': 'Tipo de Animal',
                                            'riesgo': 'Riesgo/Amenaza',
                                            'descripcion': 'Descripción del Daño',
                                            'severidad': 'Severidad'
                                        };
                                        
                                        // Usar etiqueta personalizada si existe
                                        fieldName = fieldLabels[fieldName] || fieldName.replace(/_/g, ' ').replace(/^\w/, function(c) { return c.toUpperCase(); });
                                        
                                        // Mapeo de valores para mostrar en español
                                        var valueLabels = {
                                            '1': 'Baja',
                                            '2': 'Media',
                                            '3': 'Alta'
                                        };
                                        val = valueLabels[val] || val;
                                        
                                        itemFields.push({ key: fieldName, value: val });
                                    });
                                    
                                    if (itemFields.length > 0) {
                                        faunaItems.push({ type: itemValue, fields: itemFields });
                                    }
                                }
                            });
                            
                            // Helper: construir HTML para mostrar ubicación con mapa e imagen
                            function buildFaunaLugarHtml(itemType, lugarVal) {
                                if (!lugarVal) return '<div style="color:#9ca3af;">-</div>';
                                var h = '<div style="font-size:12px;font-weight:600;margin-bottom:8px;">' + lugarVal + '</div>';
                                try {
                                    // Buscar el input de ubicación para este tipo de fauna
                                    var inp = document.querySelector('input[name="fauna_details[' + itemType + '][lugar]"]');
                                    
                                    if (inp) {
                                        
                                        if (inp.dataset.mapImage) {
                                            h += '<img src="' + inp.dataset.mapImage + '" style="width:100%;max-height:120px;border-radius:4px;object-fit:cover;border:1px solid #d1dbe9;">';
                                        } else {
                                        }
                                    } else {
                                    }
                                } catch (ex) { console.warn('Error mostrando mapa fauna:', ex); }
                                return h;
                            }

                            // Helper: construir HTML para mostrar fotos adjuntas
                            function buildFaunaPhotosHtml(itemType) {
                                var photos = (window.faunaItemPhotos && window.faunaItemPhotos[itemType]) || [];
                                if (!photos || photos.length === 0) return '';
                                
                                var h = '<div style="margin-top:8px;padding-top:8px;border-top:1px solid #e5e7eb;">';
                                h += '<strong style="font-size:11px;color:#1f2937;">📸 Fotos adjuntas (' + photos.length + '):</strong><br>';
                                h += '<div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:6px;">';
                                
                                photos.forEach(function(photo, idx) {
                                    h += '<img src="' + photo.dataURL + '" style="width:80px;height:80px;border-radius:4px;border:1px solid #d1dbe9;object-fit:cover;" title="' + photo.name + '">';
                                });
                                
                                h += '</div></div>';
                                return h;
                            }

                            // Mostrar items en tabla
                            if (faunaItems.length > 0) {
                                impactPayload.detalle_items = faunaItems;
                                for (var i = 0; i < faunaItems.length; i++) {
                                    var fields = faunaItems[i].fields || [];
                                    for (var j = 0; j < fields.length; j++) {
                                        if (fields[j].key === 'Ubicación' && fields[j].value) {
                                            impactPayload.ubicacion_texto = fields[j].value;
                                            var parsedImpactCoords = parseCoordsFromText(fields[j].value);
                                            impactPayload.ubicacion_lat = parsedImpactCoords.lat;
                                            impactPayload.ubicacion_lng = parsedImpactCoords.lng;
                                            break;
                                        }
                                    }
                                    if (impactPayload.ubicacion_texto) break;
                                }
                                impactoHtml += '<table style="width:100%;border-collapse:collapse;font-size:12px;margin-top:10px;">';
                                impactoHtml += '<tbody>';
                                
                                faunaItems.forEach(function(item, idx) {
                                    // Encabezado del item
                                    impactoHtml += '<tr><td colspan="2" style="background:#0b66c3;color:#fff;padding:8px;font-weight:bold;border:1px solid #d1dbe9;">' + (idx + 1) + '. ' + item.type + '</td></tr>';
                                    
                                    // Detalles del item
                                    item.fields.forEach(function(field, fieldIdx) {
                                        var bgColor = fieldIdx % 2 === 0 ? '#f5f8fc' : '#ffffff';
                                        var cellValue = field.value || '-';
                                        
                                        // Si es el campo "Ubicación", construir HTML especial con mapa
                                        if (field.key === 'Ubicación' && item.type) {
                                            // Extraer el tipo de fauna (ej: "avistamiento" de "Avistamiento de Aves")
                                            var faunaType = '';
                                            if (item.type === 'Avistamiento de Aves') faunaType = 'avistamiento';
                                            else if (item.type === 'Presencia de Animales') faunaType = 'presencia';
                                            else if (item.type === 'Daño a Infraestructura') faunaType = 'daino';
                                            
                                            cellValue = buildFaunaLugarHtml(faunaType, cellValue);
                                        }
                                        
                                        impactoHtml += '<tr>' +
                                            '<td style="padding:8px;font-weight:600;width:35%;background:' + bgColor + ';border:1px solid #d1dbe9;vertical-align:top;">' + field.key + '</td>' +
                                            '<td style="padding:8px;width:65%;background:' + bgColor + ';border:1px solid #d1dbe9;vertical-align:top;">' + cellValue + '</td>' +
                                            '</tr>';
                                    });
                                    
                                    // Agregar sección de fotos si existen
                                    var faunaType = '';
                                    if (item.type === 'Avistamiento de Aves') faunaType = 'avistamiento';
                                    else if (item.type === 'Presencia de Animales') faunaType = 'presencia';
                                    else if (item.type === 'Daño a Infraestructura') faunaType = 'daino';
                                    
                                    var photosHtml = buildFaunaPhotosHtml(faunaType);
                                    if (photosHtml) {
                                        impactoHtml += '<tr><td colspan="2" style="padding:10px;border:1px solid #d1dbe9;background:#fafbfc;">' + photosHtml + '</td></tr>';
                                    }
                                });
                                
                                impactoHtml += '</tbody></table>';
                            } else {
                                impactoHtml += '<p style="color:#6b7280;font-style:italic;margin-top:10px;">No hay detalles adicionales registrados.</p>';
                            }

                            impactoHtml += '<div style="text-align:center;color:#6b7280;font-size:10px;margin-top:20px;padding-top:12px;border-top:1px solid #e5e7eb;">' +
                                'Reporte generado automáticamente • ' + new Date().toLocaleString('es-ES') +
                                '</div>';
                            
                            impactoHtml += '</div>';
                            impactoReportSummary.innerHTML = impactoHtml;

                            var filename = 'Reporte-Fauna-' + folio + '.pdf';
                            var opt = {
                                margin: [5, 5, 5, 5],
                                filename: filename,
                                image: { type: 'jpeg', quality: 0.98 },
                                html2canvas: { scale: 2, logging: false, useCORS: true, allowTaint: true },
                                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait', compress: true }
                            };

                            // Generar PDF - toPdf() retorna promesa
                            html2pdf().set(opt).from(impactoReportSummary).toPdf().get('pdf').then(async function(pdf) {
                                
                                try {
                                    // ═══ Agregar páginas de mapas capturados ═══
                                    var mapaPageCounter = 0;
                                    var mapTypes = ['avistamiento', 'presencia', 'daino'];
                                    
                                    
                                    // Recopilar todas las imágenes de mapas de los items de fauna
                                    mapTypes.forEach(function(faunaType) {
                                        var inp = document.querySelector('input[name="fauna_details[' + faunaType + '][lugar]"]');
                                        
                                        if (inp) {
                                        }
                                        
                                        if (inp && inp.dataset.mapImage) {
                                            try {
                                                mapaPageCounter++;
                                                pdf.addPage([297, 210], 'l'); // A4 apaisado (landscape)
                                                
                                                var mapImgData = inp.dataset.mapImage;
                                                // Dibujar la imagen del mapa ocupando casi toda la página
                                                pdf.addImage(mapImgData, 'JPEG', 8, 8, 281, 194);
                                                
                                                // Agregar número de página y título
                                                pdf.setFontSize(10);
                                                pdf.setTextColor(100, 100, 100);
                                                pdf.text('Mapa - ' + (faunaType === 'avistamiento' ? 'Avistamiento de Aves' : 
                                                                     faunaType === 'presencia' ? 'Presencia de Animales' : 
                                                                     'Daño a Infraestructura'), 8, 206);
                                                
                                                var pdfPageCount = pdf.getNumberOfPages();
                                                pdf.text('Página ' + pdfPageCount, 270, 206, { align: 'right' });
                                                
                                            } catch (mapPageErr) {
                                                console.warn('Error agregando página de mapa para ' + faunaType + ':', mapPageErr);
                                            }
                                        }
                                    });
                                    
                                    
                                    // ═══ Agregar página final con links de Google Maps ═══
                                    var linkCounter = 0;
                                    var faunaTypeLabels = {
                                        'avistamiento': 'Avistamiento de Aves',
                                        'presencia': 'Presencia de Animales',
                                        'daino': 'Daño a Infraestructura'
                                    };
                                    
                                    var linksData = [];
                                    mapTypes.forEach(function(faunaType) {
                                        var inp = document.querySelector('input[name="fauna_details[' + faunaType + '][lugar]"]');
                                        if (inp && inp.dataset.mapsUrl) {
                                            linkCounter++;
                                            linksData.push({
                                                number: linkCounter,
                                                type: faunaType,
                                                label: faunaTypeLabels[faunaType],
                                                coords: inp.value || 'Coordenadas no disponibles',
                                                url: inp.dataset.mapsUrl
                                            });
                                        }
                                    });
                                    
                                    if (linksData.length > 0) {
                                        try {
                                            // Agregar nueva página
                                            pdf.addPage();
                                            
                                            // Título
                                            pdf.setFontSize(16);
                                            pdf.setTextColor(0, 61, 153);
                                            pdf.setFont(undefined, 'bold');
                                            pdf.text('Ubicaciones de Hallazgos', 20, 25);
                                            
                                            // Línea separadora
                                            pdf.setDrawColor(0, 61, 153);
                                            pdf.setLineWidth(1);
                                            pdf.line(20, 28, 190, 28);
                                            
                                            // Descripción
                                            pdf.setFontSize(11);
                                            pdf.setTextColor(100, 100, 100);
                                            pdf.setFont(undefined, 'normal');
                                            pdf.text('Haga clic en cada enlace para ver la ubicación exacta en Google Maps', 20, 37);
                                            pdf.text('(vista satelital)', 20, 42);
                                            
                                            // Contenido de links
                                            var yPosition = 55;                                            linksData.forEach(function(link, idx) {
                                                // Circunferencia del número
                                                pdf.setFillColor(220, 38, 38); // Rojo
                                                pdf.circle(25, yPosition - 1, 2.5, 'F');
                                                pdf.setTextColor(255, 255, 255);
                                                pdf.setFont(undefined, 'bold');
                                                pdf.setFontSize(9);
                                                pdf.text(link.number.toString(), 25, yPosition + 0.5, { align: 'center' });
                                                
                                                // Título del hallazgo
                                                pdf.setTextColor(0, 61, 153);
                                                pdf.setFont(undefined, 'bold');  
                                                pdf.setFontSize(11);
                                                pdf.text(link.label, 35, yPosition);
                                                
                                                yPosition += 8;
                                                
                                                // Coordenadas
                                                pdf.setTextColor(100, 100, 100);
                                                pdf.setFont(undefined, 'normal');
                                                pdf.setFontSize(10);
                                                pdf.text('Coordenadas: ' + link.coords, 35, yPosition);
                                                
                                                yPosition += 8;
                                                
                                                // URL clickeable
                                                pdf.setTextColor(0, 85, 165);
                                                pdf.setFont(undefined, 'underline');
                                                pdf.setFontSize(9);
                                                pdf.textWithLink('🌐 Ver en Google Maps', 35, yPosition, {pageNumber: 0, x: 0, y: 0});
                                                
                                                // Agregar la URL como enlace de PDF
                                                var urlText = link.url;
                                                pdf.setTextColor(150, 150, 150);
                                                pdf.setFont(undefined, 'italic');
                                                pdf.setFontSize(8);
                                                var urlWrapped = pdf.splitTextToSize(urlText, 150);
                                                pdf.text(urlWrapped, 35, yPosition + 5);
                                                
                                                yPosition += 18;
                                            });
                                            
                                        } catch (linksErr) {
                                            console.warn('Error agregando página de links:', linksErr);
                                        }
                                    }
                                    
                                    // Obtener blob del PDF
                                    var pdfBlob = pdf.output('blob');
                                    
                                    // Mostrar preview en iframe
                                    var previewContainer = document.getElementById('pdf-preview-container');
                                    var previewFrame = document.getElementById('pdf-preview-frame');
                                    var spinner = document.getElementById('pdf-spinner');
                                    
                                    if (previewContainer && previewFrame) {
                                        var blobUrl = URL.createObjectURL(pdfBlob);
                                        previewFrame.src = blobUrl;
                                        previewContainer.style.display = 'flex';
                                        if (spinner) spinner.style.display = 'none';
                                        
                                        // Wire download button
                                        var downloadBtn = document.getElementById('pdf-download-btn');
                                        if (downloadBtn) {
                                            downloadBtn.onclick = function() {
                                                pdf.save(filename);
                                            };
                                        }
                                        
                                        // Wire close button
                                        var closeBtn = document.getElementById('pdf-preview-close');
                                        if (closeBtn) {
                                            closeBtn.onclick = function() {
                                                previewContainer.style.display = 'none';
                                                URL.revokeObjectURL(blobUrl);
                                            };
                                        }
                                    }
                                    
                                    // Upload PDF a bucket fauna-reports (si falla, continuar sin PDF)
                                    var pdfPath = 'fauna/' + Date.now() + '-' + folio + '.pdf';
                                    var { data: uploadData, error: uploadError } = await client.storage
                                        .from('fauna-reports')
                                        .upload(pdfPath, pdfBlob, { contentType: 'application/pdf' });
                                    
                                    var pdfUrl = null;
                                    if (uploadError) {
                                        console.warn('⚠️ No se pudo subir PDF (continuará guardado en BD sin URL):', uploadError);
                                        if ((uploadError.message || '').toLowerCase().indexOf('row-level security') !== -1) {
                                            alert('⚠️ El PDF no se pudo subir por políticas RLS de Storage, pero el reporte SÍ se guardará en la base de datos sin PDF adjunto.');
                                        }
                                    } else {
                                    }
                                    
                                    if (uploadData && !uploadError) {
                                        try {
                                            var { data: signedUrlData, error: signedUrlError } = await client.storage
                                                .from('fauna-reports')
                                                .createSignedUrl(pdfPath, 7 * 24 * 60 * 60);
                                            
                                            if (signedUrlError) {
                                                console.warn('⚠️ Error generando Signed URL. Se guardará sin pdf_url:', signedUrlError);
                                            } else if (signedUrlData && signedUrlData.signedUrl) {
                                                pdfUrl = signedUrlData.signedUrl;
                                            } else {
                                                console.warn('⚠️ signedUrlData sin signedUrl. Se guardará sin pdf_url:', signedUrlData);
                                            }
                                        } catch (e) {
                                            console.warn('⚠️ Excepción al generar URL. Se guardará sin pdf_url:', e);
                                        }
                                    } else {
                                        console.warn('⚠️ Sin uploadData; continuando guardado en BD sin URL de PDF.');
                                    }
                                    
                                    // Actualizar payload con PDF URL
                                    impactPayload.pdf_url = pdfUrl;

                                    var impactData;
                                    try {
                                        impactData = await window.MHRFaunaReportService.insertFaunaReport(client, impactPayload);
                                    } catch (impactError) {
                                        console.error('❌ Error guardando impacto en BD:', impactError);
                                        alert('❌ Error al guardar reporte: ' + impactError.message);
                                        submitBtn.disabled = false;
                                        submitBtn.value = 'Generar reporte';
                                        return;
                                    }

                                    if (impactData && impactData.length > 0 && impactData[0].pdf_url) {
                                    } else {
                                        console.warn('⚠️ ADVERTENCIA: El reporte se guardó pero sin pdf_url');
                                    }
                                    alert('✓ Reporte de impacto generado y guardado exitosamente.');
                                    faunaForm.reset();
                                    
                                    // Recargar historial
                                    setTimeout(loadFaunaReports, 500);

                                    submitBtn.disabled = false;
                                    submitBtn.value = 'Generar reporte';
                                    
                                } catch (err) {
                                    console.error('Error en impacto:', err);
                                    alert('Error: ' + err.message);
                                    submitBtn.disabled = false;
                                    submitBtn.value = 'Generar reporte';
                                }
                            }).catch(function (err) {
                                console.error('Error generando PDF impacto:', err);
                                alert('Error al generar el PDF: ' + err.message);
                                submitBtn.disabled = false;
                                submitBtn.value = 'Generar reporte';
                            });
                            return;
                        }

                        // ═════════════════════════════════════════════════════════
                        // GUARDAR RESCATE
                        // ═════════════════════════════════════════════════════════
                        // Responsable
                        var responsableSelect = document.getElementById('fauna_report-authors-select-rescate');
                        var responsable = responsableSelect ? (responsableSelect.options[responsableSelect.selectedIndex] || {}).text || responsableSelect.value : '-';

                        // Cargo
                        var cargoSelect = document.getElementById('fauna_report-role-rescate');
                        var cargo = cargoSelect ? (cargoSelect.options[cargoSelect.selectedIndex] || {}).text || cargoSelect.value : '-';

                        // Institución
                        var institucion = faunaForm.querySelector('input[name="fauna_rescate[institucion_responsable]"]')?.value || '-';

                        // Sitio de Rescate
                        var sitioRescate = faunaForm.querySelector('input[name="fauna_rescate[lugar]"]')?.value || '-';

                        // Clase
                        var claseSelect = faunaForm.querySelector('select[name="fauna_rescate[clase]"]');
                        var clase = claseSelect ? claseSelect.value : '-';

                        // Especie
                        var especieSelect = faunaForm.querySelector('select[name="fauna_rescate[especie]"]');
                        var especie = especieSelect ? especieSelect.value : '-';

                        // Sitio Reubicación
                        var sitioReubicacion = faunaForm.querySelector('select[name="fauna_rescate[sitio_reubicacion]"]')?.value || '-';

                        // Observaciones
                        var observaciones = faunaForm.querySelector('textarea[name="fauna_rescate[observaciones]"]')?.value || '';

                        // Crear contenedor visible para el reporte
                        var reportSummary = document.getElementById('fauna-report-summary');
                        if (!reportSummary) {
                            reportSummary = document.createElement('div');
                            reportSummary.id = 'fauna-report-summary';
                            reportSummary.style.display = 'none';
                            document.body.appendChild(reportSummary);
                        }

                        // Construir HTML del reporte con formato profesional (similar a revisión)
                        reportSummary.innerHTML = '<div style="font-family:Arial,Helvetica,sans-serif;color:#0f1724;max-width:210mm;margin:0 auto;padding:12mm;">' +
                            
                            // Obtener membrete (similar a revisión)
                            (function() {
                                var membreteHtml = '';
                                try {
                                    var membreteLines = [];
                                    document.querySelectorAll('.report-header .meta > div').forEach(function(d) {
                                        if (d.querySelector && d.querySelector('#report-date')) return;
                                        if (d.querySelector && d.querySelector('button')) return;
                                        var txt = d.textContent.trim(); if (txt) membreteLines.push(txt);
                                    });
                                    
                                    if (membreteLines.length) {
                                        membreteHtml = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">' +
                                            '<div style="min-width:180px;font-size:12px;color:#1f2937;line-height:1.1">';
                                        membreteLines.forEach(function (line) { membreteHtml += '<div>' + line + '</div>'; });
                                        membreteHtml += '</div>' +
                                            '<div style="flex:1;text-align:center;padding:0 12px">';
                                        
                                        var logoSrc = '';
                                        if (window.logoBase64) {
                                            logoSrc = window.logoBase64;
                                        } else {
                                            try { 
                                                var logoEl = document.querySelector('.report-header .left img'); 
                                                if (logoEl) {
                                                    var src = logoEl.getAttribute('src');
                                                    if (src && !src.startsWith('http') && !src.startsWith('data:')) {
                                                        var baseUrl = window.location.origin + window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/'));
                                                        logoSrc = baseUrl + '/' + src;
                                                    } else {
                                                        logoSrc = src;
                                                    }
                                                }
                                            } catch (e) { }
                                        }
                                        if (logoSrc) {
                                            membreteHtml += '<img src="' + logoSrc + '" style="height:120px;display:block;margin:0 auto 6px">';
                                        } else {
                                            membreteHtml += '<svg xmlns="http://www.w3.org/2000/svg" width="180" height="70" viewBox="0 0 180 70" style="display:block;margin:0 auto;">' +
                                                '<rect width="100%" height="100%" fill="#0b66c3" rx="6" />' +
                                                '<g transform="translate(12,10)">' +
                                                '<circle cx="20" cy="20" r="16" fill="#fff" />' +
                                                '<path d="M 20 8 L 28 20 L 24 20 L 24 28 L 16 28 L 16 20 L 12 20 Z" fill="#0b66c3"/>' +
                                                '</g>' +
                                                '<text x="95" y="28" font-family="Arial, sans-serif" font-size="18" fill="#ffffff" font-weight="bold">Fauna</text>' +
                                                '<text x="95" y="48" font-family="Arial, sans-serif" font-size="11" fill="#e8f1f8">Rescate</text>' +
                                                '</svg>';
                                        }
                                        
                                        membreteHtml += '<h2 style="color:#0b66c3;margin:0;font-size:20px;">Reporte de Control de Fauna</h2>' +
                                            '<div style="margin-top:6px;font-size:14px;color:#111;font-weight:700;">Rescate y Reubicación</div>' +
                                            '</div>' +
                                            '<div style="text-align:right;color:#6b7280;font-size:12px;min-width:120px">' +
                                            '<div><strong>' + folio + '</strong></div>' +
                                            '<div style="font-size:12px;color:#6b7280;margin-top:6px">' + fechaLocal.split(' ')[0] + '</div>' +
                                            '</div>' +
                                            '</div>';
                                    }
                                return membreteHtml;
                            })() +
                            
                            '<hr style="border:none;border-top:1px solid #e6eef9;margin:12px 0">' +
                            
                            '<div style="display:flex;justify-content:center;gap:18px;flex-wrap:wrap;margin-top:12px;align-items:center">' +
                                '<div style="min-width:140px;text-align:center;font-size:13px;color:#374151">Responsable<br><strong>' + (responsable || '-') + '</strong></div>' +
                                '<div style="width:1px;height:28px;background:#e6eef9;margin:0 8px;display:inline-block;vertical-align:middle"></div>' +
                                '<div style="min-width:140px;text-align:center;font-size:13px;color:#374151">Cargo<br><strong>' + (cargo || '-') + '</strong></div>' +
                                '<div style="width:1px;height:28px;background:#e6eef9;margin:0 8px;display:inline-block;vertical-align:middle"></div>' +
                                '<div style="min-width:140px;text-align:center;font-size:13px;color:#374151">Institución<br><strong>' + (institucion || '-') + '</strong></div>' +
                            '</div>' +
                            '<hr style="border:none;border-top:1px solid #e6eef9;margin:12px 0">' +
                            
                            '<table style="width:100%;border-collapse:collapse;font-size:13px;">' +
                                '<thead><tr>' +
                                    '<th style="text-align:left;padding:8px;border-bottom:1px solid #e6eef9;width:35%">Concepto</th>' +
                                    '<th style="text-align:left;padding:8px;border-bottom:1px solid #e6eef9;width:65%">Detalle</th>' +
                                '</tr></thead>' +
                                '<tbody>' +
                                    '<tr><td style="vertical-align:top;padding:10px;border-bottom:1px solid #f0f6ff;font-weight:600;background:#f5f8fc">Sitio de Rescate</td>' +
                                        '<td style="vertical-align:top;padding:10px;border-bottom:1px solid #f0f6ff">' + (sitioRescate || '-') + '</td></tr>' +
                                    '<tr><td style="vertical-align:top;padding:10px;border-bottom:1px solid #f0f6ff;font-weight:600;background:#f5f8fc">Clase de Animal</td>' +
                                        '<td style="vertical-align:top;padding:10px;border-bottom:1px solid #f0f6ff">' + (clase || '-') + '</td></tr>' +
                                    '<tr><td style="vertical-align:top;padding:10px;border-bottom:1px solid #f0f6ff;font-weight:600;background:#f5f8fc">Especie</td>' +
                                        '<td style="vertical-align:top;padding:10px;border-bottom:1px solid #f0f6ff">' + (especie || '-') + '</td></tr>' +
                                    '<tr><td style="vertical-align:top;padding:10px;border-bottom:1px solid #f0f6ff;font-weight:600;background:#f5f8fc">Sitio de Reubicación</td>' +
                                        '<td style="vertical-align:top;padding:10px;border-bottom:1px solid #f0f6ff">' + (sitioReubicacion || '-') + '</td></tr>' +
                                '</tbody>' +
                            '</table>' +
                            
                            '<h3 style="color:#0b66c3;font-size:13px;margin:16px 0 8px 0;border-bottom:1.5px solid #0b66c3;padding-bottom:4px;">Observaciones</h3>' +
                            '<div style="padding:10px;border:1px solid #e6eef9;background:#fafbfc;font-size:12px;line-height:1.6;min-height:50px;white-space:pre-wrap">' + (observaciones || 'N/A') + '</div>' +
                            
                            '<div style="margin-top:60px;padding-top:20px;border-top:2px solid #e6eef9;">' +
                                '<table style="width:100%;margin-top:40px;">' +
                                    '<tr><td style="text-align:center;width:50%;"><div style="border-top:1px solid #1f2937;padding-top:40px;font-size:11px;"><strong>Firma - AIFA</strong><br>(Responsable)</div></td>' +
                                        '<td style="text-align:center;width:50%;"><div style="border-top:1px solid #1f2937;padding-top:40px;font-size:11px;"><strong>Firma - AFAC</strong><br>(Supervisor)</div></td></tr>' +
                                '</table>' +
                            '</div>' +
                            
                            '<div style="text-align:center;color:#6b7280;font-size:10px;margin-top:20px;padding-top:12px;border-top:1px solid #e5e7eb;">' +
                                'Reporte generado automáticamente • ' + new Date().toLocaleString('es-ES') +
                            '</div>' +
                        '</div>';

                        // Configurar html2pdf
                        var filename = 'Reporte-Fauna-' + folio + '.pdf';
                        var opt = {
                            margin: [5, 5, 5, 5],
                            filename: filename,
                            image: { type: 'jpeg', quality: 0.98 },
                            html2canvas: { scale: 2, logging: false, useCORS: true, allowTaint: true },
                            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait', compress: true }
                        };

                        // Generar PDF - toPdf() retorna promesa
                        html2pdf().set(opt).from(reportSummary).toPdf().get('pdf').then(async function(pdf) {
                            
                            try {
                                // Obtener blob del PDF
                                var pdfBlob = pdf.output('blob');
                                
                                // Mostrar preview en iframe
                                var previewContainer = document.getElementById('pdf-preview-container');
                                var previewFrame = document.getElementById('pdf-preview-frame');
                                var spinner = document.getElementById('pdf-spinner');
                                
                                if (previewContainer && previewFrame) {
                                    var blobUrl = URL.createObjectURL(pdfBlob);
                                    previewFrame.src = blobUrl;
                                    previewContainer.style.display = 'flex';
                                    if (spinner) spinner.style.display = 'none';
                                    
                                    // Wire download button
                                    var downloadBtn = document.getElementById('pdf-download-btn');
                                    if (downloadBtn) {
                                        downloadBtn.onclick = function() {
                                            pdf.save(filename);
                                        };
                                    }
                                    
                                    // Wire close button
                                    var closeBtn = document.getElementById('pdf-preview-close');
                                    if (closeBtn) {
                                        closeBtn.onclick = function() {
                                            previewContainer.style.display = 'none';
                                            URL.revokeObjectURL(blobUrl);
                                        };
                                    }
                                }
                                
                                // Ahora guardar en Supabase
                                var client = window.supabaseClient;
                                if (!client) {
                                    alert('✓ PDF generado. Notificación: Sin conexión para guardar en BD.');
                                    if (submitBtn) {
                                        submitBtn.disabled = false;
                                        submitBtn.value = 'Generar reporte';
                                    }
                                    return;
                                }

                                var { data: { session } } = await client.auth.getSession();
                                if (!session) {
                                    alert('✓ PDF generado. Notificación: No estás en sesión para guardar en BD.');
                                    if (submitBtn) {
                                        submitBtn.disabled = false;
                                        submitBtn.value = 'Generar reporte';
                                    }
                                    return;
                                }

                                
                                // Upload PDF a storage
                                var pdfPath = 'fauna/' + Date.now() + '-' + folio + '.pdf';
                                var { data: uploadData, error: uploadError } = await client.storage
                                    .from('fauna-reports')
                                    .upload(pdfPath, pdfBlob, { contentType: 'application/pdf' });
                                
                                if (uploadError) {
                                    console.warn('Warning subiendo PDF:', uploadError);
                                    // Continuar sin URL
                                }
                                
                                var pdfUrl = null;
                                if (uploadData && !uploadError) {
                                    var { data: { publicUrl } } = client.storage
                                        .from('fauna-reports')
                                        .getPublicUrl(pdfPath);
                                    pdfUrl = publicUrl;
                                }

                                // Guardar reporte de rescate
                                var rescateCoords = parseCoordsFromText(sitioRescate);
                                var rescatePayload = {
                                    fecha_reporte: new Date().toISOString().split('T')[0],
                                    folio: folio,
                                    responsable: responsable,
                                    cargo: cargo,
                                    institucion_responsable: institucion,
                                    ubicacion_texto: sitioRescate,
                                    ubicacion_lat: rescateCoords.lat,
                                    ubicacion_lng: rescateCoords.lng,
                                    clase: clase,
                                    especie: especie,
                                    sitio_reubicacion: sitioReubicacion,
                                    observaciones: observaciones,
                                    estado: 'completado',
                                    tipo_reporte: 'Rescate',
                                    pdf_url: pdfUrl
                                };

                                var rescateData;
                                try {
                                    rescateData = await window.MHRFaunaReportService.insertFaunaReport(client, rescatePayload);
                                } catch (rescateError) {
                                    console.error('Error guardando rescate:', rescateError);
                                    alert('Error: ' + rescateError.message);
                                    if (submitBtn) {
                                        submitBtn.disabled = false;
                                        submitBtn.value = 'Generar reporte';
                                    }
                                    return;
                                }

                                alert('✓ Reporte generado y guardado exitosamente.');

                                // Limpiar formulario
                                faunaForm.reset();
                                
                                // Recargar historial
                                setTimeout(loadFaunaReports, 500);

                                if (submitBtn) {
                                    submitBtn.disabled = false;
                                    submitBtn.value = 'Generar reporte';
                                }

                            } catch (err) {
                                console.error('Error en guardado:', err);
                                alert('Error: ' + err.message);
                                if (submitBtn) {
                                    submitBtn.disabled = false;
                                    submitBtn.value = 'Generar reporte';
                                }
                            }
                        }).catch(function (err) {
                            console.error('Error generando PDF:', err);
                            alert('Error al generar el PDF: ' + err.message);
                            if (submitBtn) {
                                submitBtn.disabled = false;
                                submitBtn.value = 'Generar reporte';
                            }
                        });

                    } catch (error) {
                        console.error('Error en generación de PDF:', error);
                        alert('Error: ' + error.message);
                        if (submitBtn) {
                            submitBtn.disabled = false;
                            submitBtn.value = 'Generar reporte';
                        }
                    }
                });
            }

            // Fauna Tabs switching functionality

  }
  return { init: init };
})();
