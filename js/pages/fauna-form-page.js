(function(){
    window.MHRFaunaPage = window.MHRFaunaPage || {};
    window.MHRFaunaPage.initTipoReporteLock = function(faunaForm){

                var faunaRadios = Array.prototype.slice.call(faunaForm.querySelectorAll('input[name="fauna_tipo_reporte_inspeccion"]'));
                var faunaChangeBtn = document.getElementById('fauna_tipo_reporte-change-btn');
                
                function updateFaunaReporteState() {
                    try {
                        var checked = faunaRadios.find(function (r) { return r.checked; });
                        if (checked) {
                            // Bloquear todos los radios
                            faunaRadios.forEach(function (r) {
                                r.disabled = true;
                                var lbl = r.closest('label');
                                if (lbl) lbl.classList.remove('selected');
                            });
                            // Marcar el seleccionado
                            var lbl = checked.closest('label');
                            if (lbl) lbl.classList.add('selected');
                            // Mostrar botón para cambiar
                            if (faunaChangeBtn) faunaChangeBtn.style.display = 'inline-block';
                        } else {
                            // Desbloquear todos
                            faunaRadios.forEach(function (r) {
                                r.disabled = false;
                                var lbl = r.closest('label');
                                if (lbl) lbl.classList.remove('selected');
                            });
                            // Ocultar botón
                            if (faunaChangeBtn) faunaChangeBtn.style.display = 'none';
                        }
                    } catch (e) { }
                }

                faunaRadios.forEach(function (r) {
                    r.addEventListener('change', function () { updateFaunaReporteState(); });
                });

                // Botón para cambiar tipo de reporte
                if (faunaChangeBtn) {
                    faunaChangeBtn.addEventListener('click', function () {
                        faunaRadios.forEach(function (r) { r.disabled = false; r.checked = false; });
                        faunaChangeBtn.style.display = 'none';
                        faunaRadios.forEach(function (r) {
                            var lbl = r.closest('label');
                            if (lbl) lbl.classList.remove('selected');
                        });
                    });
                }

                updateFaunaReporteState();
            
    };
    window.MHRFaunaPage.initTurnoVisibility = function(faunaForm){

                var faunaTypeRadios = faunaForm.querySelectorAll('input[name="fauna_tipo_reporte_inspeccion"]');
                var turnoSection = faunaForm.querySelector('#fauna_turno-section');
                if (!faunaTypeRadios || !turnoSection) return;
                
                function updateTurnoVisibility() {
                    var anyChecked = Array.prototype.slice.call(faunaTypeRadios).some(function (r) { return r.checked; });
                    turnoSection.style.display = anyChecked ? 'block' : 'none';
                    if (!anyChecked) {
                        var turnoInputs = faunaForm.querySelectorAll('input[name="fauna_turno"]');
                        Array.prototype.slice.call(turnoInputs).forEach(function (r) { r.checked = false; });
                    }
                }
                
                Array.prototype.slice.call(faunaTypeRadios).forEach(function (r) {
                    r.addEventListener('change', updateTurnoVisibility);
                });
                updateTurnoVisibility();
            
    };

})();
