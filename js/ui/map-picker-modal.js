// Script para manejo del mapa interactivo para seleccionar Lugar
        (function () {
            var mapInstance = null;
            var selectedLatLng = null;
            var marker = null;
            var currentLugarField = null;

            function openMapModal(lugarInputEl) {
                currentLugarField = lugarInputEl;
                selectedLatLng = null;

                var modal = document.getElementById('map-modal');
                if (!modal) {
                    console.error('map-modal element not found');
                    return;
                }

                modal.classList.add('open');

                // Inicializar mapa después de mostrar modal
                setTimeout(function () {
                    try {
                        if (!mapInstance) {
                            initMap();
                        } else {
                            // LIMPIAR TODOS los marcadores del mapa
                            mapInstance.eachLayer(function(layer) {
                                if (layer instanceof L.Marker) {
                                    try { mapInstance.removeLayer(layer); } catch (e) { }
                                }
                            });
                        }
                        mapInstance.invalidateSize();
                        // Resetear vista del mapa a ubicación por defecto
                        mapInstance.setView([19.7470, -99.0125], 15);
                        marker = null;  // Reset global marker reference
                    } catch (e) {
                        console.error('Error initializing map:', e);
                    }
                }, 150);
            }

            function closeMapModal() {
                var modal = document.getElementById('map-modal');
                if (modal) modal.classList.remove('open');
            }

            function initMap() {
                if (mapInstance) return;

                // Coordenadas por defecto (serán sobrescritas por el KML)
                var defaultLat = 19.745;
                var defaultLng = -99.012;

                mapInstance = L.map('map', {
                    center: [defaultLat, defaultLng],
                    zoom: 15,
                    scrollWheelZoom: true
                });

                // Agregar capa de mapa
                // Vista satelital tipo Google Earth (ESRI World Imagery — sin clave API)
                L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
                    attribution: 'Tiles &copy; Esri',
                    maxZoom: 20
                }).addTo(mapInstance);
                // Capa de etiquetas (nombres, calles, referencias) sobre el satélite
                L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', {
                    attribution: '',
                    maxZoom: 20,
                    opacity: 0.9
                }).addTo(mapInstance);

                // Centrar en el aeródromo AIFA
                mapInstance.setView([19.7470, -99.0125], 15);

                // Listener para clicks en el mapa
                mapInstance.on('click', function (e) {
                    selectedLatLng = e.latlng;
                    if (marker) mapInstance.removeLayer(marker);
                    marker = L.marker(e.latlng, {
                        draggable: true
                    }).addTo(mapInstance);

                    // Actualizar info
                    updateMapInfo();
                });
            }

            function updateMapInfo() {
                if (!selectedLatLng) {
                    return;
                }
                var infoEl = document.getElementById('map-info');
                if (infoEl) {
                    var infoText = '<strong>✓ Ubicación seleccionada:</strong><br>' +
                        'Latitud: ' + selectedLatLng.lat.toFixed(6) + '<br>' +
                        'Longitud: ' + selectedLatLng.lng.toFixed(6);
                    infoEl.innerHTML = infoText;
                }
            }

            function useMyLocation() {
                if (!navigator.geolocation) {
                    alert('Tu navegador no soporta geolocalización.');
                    return;
                }
                var gpsBtn = document.getElementById('map-gps-btn');
                var infoEl = document.getElementById('map-info');
                if (gpsBtn) { gpsBtn.disabled = true; gpsBtn.textContent = '⏳ Obteniendo...'; }
                if (infoEl) infoEl.innerHTML = '<em>Obteniendo tu ubicación GPS, por favor espera…</em>';

                navigator.geolocation.getCurrentPosition(
                    function (position) {
                        var lat = position.coords.latitude;
                        var lng = position.coords.longitude;
                        var accuracy = position.coords.accuracy;

                        selectedLatLng = L.latLng(lat, lng);

                        // Colocar / mover marcador
                        if (marker) mapInstance.removeLayer(marker);
                        marker = L.marker(selectedLatLng, { draggable: true }).addTo(mapInstance);
                        marker.on('dragend', function (ev) {
                            selectedLatLng = ev.target.getLatLng();
                            updateMapInfo();
                        });

                        // Centrar mapa en la ubicación real
                        mapInstance.setView(selectedLatLng, 18);

                        // Mostrar info
                        if (infoEl) {
                            infoEl.innerHTML = '<strong>📍 Ubicación GPS obtenida:</strong><br>' +
                                'Latitud: ' + lat.toFixed(6) + ' &nbsp; Longitud: ' + lng.toFixed(6) +
                                '<br><span style="font-size:11px;color:#6b7280">Precisión: ±' + Math.round(accuracy) + ' m &nbsp;·&nbsp; Puedes arrastrar el marcador para ajustar.</span>';
                        }

                        if (gpsBtn) {
                            gpsBtn.disabled = false;
                            gpsBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/><circle cx="12" cy="12" r="9" opacity=".3"/></svg> Mi ubicación actual';
                        }
                    },
                    function (err) {
                        var msg = {
                            1: 'Permiso de ubicación denegado. Por favor permite el acceso en tu navegador.',
                            2: 'No se pudo determinar la posición (señal GPS insuficiente).',
                            3: 'Tiempo de espera agotado. Intenta de nuevo.'
                        }[err.code] || 'Error desconocido al obtener ubicación.';
                        alert(msg);
                        if (infoEl) infoEl.innerHTML = '<strong>❌ ' + msg + '</strong>';
                        if (gpsBtn) {
                            gpsBtn.disabled = false;
                            gpsBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/><circle cx="12" cy="12" r="9" opacity=".3"/></svg> Mi ubicación actual';
                        }
                    },
                    { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
                );
            }

            function confirmLocation() {

                if (!selectedLatLng) {
                    alert('Por favor selecciona una ubicación en el mapa haciendo clic.');
                    return;
                }

                if (!currentLugarField) {
                    alert('Error: no hay campo Lugar seleccionado.');
                    return;
                }

                // ===== PASO 1: LIMPIAR TODOS LOS MARCADORES VIEJOS =====
                if (mapInstance) {
                    var markersOnMap = [];
                    mapInstance.eachLayer(function(layer) {
                        if (layer instanceof L.Marker) {
                            markersOnMap.push(layer);
                        }
                    });
                    
                    markersOnMap.forEach(function(m, idx) {
                        try {
                            mapInstance.removeLayer(m);
                        } catch (e) {
                            console.error('Error eliminando marcador:', e);
                        }
                    });
                    marker = null;  // Reset referencia global
                }

                // ===== PASO 2: CREAR NUEVO MARCADOR CON ESTILO ROJO Y NÚMERO =====
                if (mapInstance) {
                    // Contar cuántos hallazgos hay para numerar el marker
                    var markerNumber = 1;
                    var faunaTypes = ['avistamiento', 'presencia', 'daino'];
                    faunaTypes.forEach(function(type) {
                        var inp = document.querySelector('input[name="fauna_details[' + type + '][lugar]"]');
                        if (inp && inp.dataset.mapImage) markerNumber++;
                    });
                    
                    // Crear marker con estilo rojo y número - MÁS PEQUEÑO
                    var redMarkerIcon = L.divIcon({
                        html: '<div style="background-color:#DC2626;color:white;font-weight:bold;font-size:12px;width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.3);">' + markerNumber + '</div>',
                        iconSize: [22, 22],
                        iconAnchor: [11, 22],
                        popupAnchor: [0, -22],
                        className: 'custom-red-marker'
                    });
                    marker = L.marker(selectedLatLng, { icon: redMarkerIcon }).addTo(mapInstance);
                }

                // ===== PASO 3: GUARDAR COORDENADAS =====
                var locationStr = selectedLatLng.lat.toFixed(6) + ', ' + selectedLatLng.lng.toFixed(6);
                currentLugarField.value = locationStr;
                currentLugarField.dataset.lat = selectedLatLng.lat.toFixed(6);
                currentLugarField.dataset.lng = selectedLatLng.lng.toFixed(6);
                currentLugarField.dataset.mapsUrl = 'https://maps.google.com/maps?q=' + selectedLatLng.lat.toFixed(6) + ',' + selectedLatLng.lng.toFixed(6) + '&t=k&z=17';


                // ===== PASO 4: BAJAR ZOOM =====
                if (mapInstance) {
                    mapInstance.setZoom(14);
                }

                // ===== PASO 5: CAPTURAR MAPA =====
                var mapContainer = document.getElementById('map');
                
                
                // Pequeño delay para que el mapa se re-renderice con el nuevo zoom
                setTimeout(function() {
                    
                    if (mapContainer && window.html2canvas) {
                        html2canvas(mapContainer, {
                            allowTaint: true,
                            useCORS: true,
                            logging: false,
                            scale: 3,
                            backgroundColor: '#ffffff',
                            ignoreElements: function(element) {
                                if (element.classList) {
                                    if (element.classList.contains('leaflet-control')) return true;
                                }
                                return false;
                            }
                        }).then(function(canvas) {
                            
                            try {
                                if (canvas && canvas.width > 0 && canvas.height > 0) {
                                    var imgData = canvas.toDataURL('image/jpeg', 0.98);
                                    
                                    if (imgData && imgData.length > 1000) {
                                        currentLugarField.dataset.mapImage = imgData;
                                    } else {
                                        console.warn('❌ [CAPTURE] imgData muy pequeño:', imgData.length);
                                    }
                                } else {
                                    console.warn('❌ [CAPTURE] Canvas inválido');
                                }
                            } catch (canvasErr) {
                                console.error('❌ [CAPTURE] Error:', canvasErr);
                            }
                        }).catch(function(err) {
                            console.error('❌ [CAPTURE] Error en html2canvas:', err.message);
                        });
                    } else {
                        console.warn('❌ [CAPTURE] html2canvas o mapContainer no disponible');
                    }
                }, 500);

                // Disparar eventos de cambio para persistencia
                try {
                    currentLugarField.dispatchEvent(new Event('input'));
                    currentLugarField.dispatchEvent(new Event('change'));
                } catch (e) { console.error('Error disparando eventos:', e); }

                // Cerrar inmediatamente para no bloquear el avance del usuario
                finalizarConfirmLocation();
                
                function finalizarConfirmLocation() {
                    closeMapModal();
                    selectedLatLng = null;
                    if (marker) {
                        try { mapInstance.removeLayer(marker); } catch (e) { }
                    }
                    marker = null;
                }
            }

            // Wiring botones del modal (con delay para asegurar que DOM esté listo)
            setTimeout(function () {
                var closeBtn = document.getElementById('map-modal-close');
                var confirmBtn = document.getElementById('map-modal-confirm');
                var modal = document.getElementById('map-modal');

                var gpsBtn = document.getElementById('map-gps-btn');
                if (gpsBtn) {
                    gpsBtn.addEventListener('click', function (e) {
                        e.preventDefault();
                        useMyLocation();
                    });
                }

                if (closeBtn) {
                    closeBtn.addEventListener('click', function (e) {
                        e.preventDefault();
                        closeMapModal();
                    });
                }

                if (confirmBtn) {
                    confirmBtn.addEventListener('click', function (e) {
                        e.preventDefault();
                        confirmLocation();
                    });
                }

                if (modal) {
                    modal.addEventListener('click', function (e) {
                        if (e.target === modal) closeMapModal();
                    });
                }
            }, 100);

            // Exponer función para abrir el modal
            window.openMapPicker = openMapModal;
        })();
