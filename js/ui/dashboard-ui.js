/**
 * js/ui/dashboard-ui.js
 * Encapsula la inicialización de la interfaz global, relojes y precarga de assets.
 */
window.MHRDashboardUI = (function () {
    var dateTimeIntervalId = null;

    function renderDateTime() {
        var utils = window.MHRUtils || {
            pad2: function (n) { return n.toString().padStart(2, '0'); }
        };
        var d = new Date();
        var localDate = utils.pad2(d.getDate()) + '/' + utils.pad2(d.getMonth() + 1) + '/' + d.getFullYear();
        var localTime = utils.pad2(d.getHours()) + ':' + utils.pad2(d.getMinutes()) + ':' + utils.pad2(d.getSeconds());
        var localDateTime = localDate + ' ' + localTime;

        ['report-date', 'report-date-historial', 'report-date-estadistica'].forEach(function (id) {
            var el = document.getElementById(id);
            if (el) {
                el.textContent = localDateTime;
            }
        });

        var utcHours = utils.pad2(d.getUTCHours());
        var utcMins = utils.pad2(d.getUTCMinutes());
        var utcSecs = utils.pad2(d.getUTCSeconds());
        var utcTime = utcHours + ':' + utcMins + ':' + utcSecs;
        var utcDate = utils.pad2(d.getUTCDate()) + '/' + utils.pad2(d.getUTCMonth() + 1) + '/' + d.getUTCFullYear();

        ['report-utc', 'report-utc-historial', 'report-utc-estadistica'].forEach(function (id) {
            var el = document.getElementById(id);
            if (el) {
                el.textContent = utcDate + ' ' + utcTime + ' UTC';
            }
        });
    }
    
    function initDateTime() {
        if (dateTimeIntervalId) {
            clearInterval(dateTimeIntervalId);
        }
        renderDateTime();
        dateTimeIntervalId = setInterval(renderDateTime, 1000);
    }

    function initLogoPreload() {
        window.logoBase64 = null;
        var logoImg = document.querySelector('.report-header .left img');
        if (logoImg && logoImg.src) {
            var img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = function() {
                try {
                    var canvas = document.createElement('canvas');
                    canvas.width = img.width || 200;
                    canvas.height = img.height || 100;
                    var ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0);
                    window.logoBase64 = canvas.toDataURL('image/png');
                    console.log('✓ Logo convertido a base64 correctamente. Tamaño:', window.logoBase64.length, 'bytes');
                } catch (e) {
                    console.warn('Error al convertir logo a canvas:', e);
                }
            };
            img.onerror = function() {
                console.warn('⚠️ No se pudo cargar logo desde:', img.src);
            };
            img.src = logoImg.src;
            
            // Fallback Blob
            setTimeout(function() {
                if (!window.logoBase64) {
                    console.warn('Intentando carga alternativa de logo...');
                    var xhr = new XMLHttpRequest();
                    xhr.responseType = 'blob';
                    xhr.onload = function() {
                        var reader = new FileReader();
                        reader.onloadend = function() {
                            window.logoBase64 = reader.result;
                            console.log('✓ Logo cargado como blob base64');
                        };
                        reader.readAsDataURL(xhr.response);
                    };
                    xhr.onerror = function() { console.warn('No se pudo cargar logo como blob'); };
                    try { xhr.open('GET', logoImg.src, true); xhr.send(); } catch (e) { }
                }
            }, 2000);
        }
    }

    function initFormInteractions() {
        var utils = window.MHRUtils || { pad2: function(){}, bindLockSelect: function(){}, bindTurnoVisibility: function(){} };

        var cargoSelect = document.getElementById('report-role');
        var resetButton = document.getElementById('report-role-reset');
        if (cargoSelect && resetButton) utils.bindLockSelect(cargoSelect, resetButton, { clearOnReset: false });

        utils.bindTurnoVisibility('tipo_inspeccion', 'turno-section', 'turno');

        var areaRepSelect = document.getElementById('report-area-rep');
        var areaRepNameInput = document.getElementById('report-area-rep-name');
        if (areaRepSelect && areaRepNameInput) {
            areaRepSelect.addEventListener('change', function () {
                if (this.value && this.value !== 'N/A') {
                    areaRepNameInput.style.display = 'block';
                } else {
                    areaRepNameInput.style.display = 'none';
                    areaRepNameInput.value = '';
                }
            });
        }

        setTimeout(function () {
            try {
                document.querySelectorAll('input[name*="lugar"]').forEach(function (input) {
                    input.addEventListener('click', function (e) {
                        e.preventDefault();
                        if (window.openMapPicker) window.openMapPicker(input);
                    });
                    input.style.cursor = 'pointer';
                    input.setAttribute('placeholder', 'Click para seleccionar en mapa');
                    input.style.pointerEvents = 'auto';
                });
            } catch (e) { console.error('Error wiring map picker', e); }
        }, 500);
    }

    return {
        init: function () {
            initDateTime();
            initLogoPreload();
            initFormInteractions();
        }
    };
})();
