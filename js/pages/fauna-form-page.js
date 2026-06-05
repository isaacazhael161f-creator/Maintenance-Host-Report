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

    window.MHRFaunaPage.initPistaLock = function(faunaForm){

                var faunaPistaRadios = Array.prototype.slice.call(faunaForm.querySelectorAll('input[name="fauna_pista"]'));
                var faunaPistaChangeBtn = document.getElementById('fauna_pista-change-btn');
                
                function updateFaunaPistaState() {
                    try {
                        var checked = faunaPistaRadios.find(function (r) { return r.checked; });
                        if (checked) {
                            // Bloquear todos los radios
                            faunaPistaRadios.forEach(function (r) {
                                r.disabled = true;
                                var lbl = r.closest('label');
                                if (lbl) lbl.classList.remove('selected');
                            });
                            // Marcar el seleccionado
                            var lbl = checked.closest('label');
                            if (lbl) lbl.classList.add('selected');
                            // Mostrar botón para cambiar
                            if (faunaPistaChangeBtn) faunaPistaChangeBtn.style.display = 'inline-block';
                        } else {
                            // Desbloquear todos
                            faunaPistaRadios.forEach(function (r) {
                                r.disabled = false;
                                var lbl = r.closest('label');
                                if (lbl) lbl.classList.remove('selected');
                            });
                            // Ocultar botón
                            if (faunaPistaChangeBtn) faunaPistaChangeBtn.style.display = 'none';
                        }
                    } catch (e) { }
                }

                faunaPistaRadios.forEach(function (r) {
                    r.addEventListener('change', function () { updateFaunaPistaState(); });
                });

                // Botón para cambiar pista
                if (faunaPistaChangeBtn) {
                    faunaPistaChangeBtn.addEventListener('click', function () {
                        faunaPistaRadios.forEach(function (r) { r.disabled = false; r.checked = false; });
                        faunaPistaChangeBtn.style.display = 'none';
                        faunaPistaRadios.forEach(function (r) {
                            var lbl = r.closest('label');
                            if (lbl) lbl.classList.remove('selected');
                        });
                    });
                }

                updateFaunaPistaState();
            
    };

    window.MHRFaunaPage.initFaseVueloLock = function(faunaForm){

                var faunaFaseVueloRadios = Array.prototype.slice.call(faunaForm.querySelectorAll('input[name="fauna_fase_vuelo"]'));
                var faunaFaseVueloChangeBtn = document.getElementById('fauna_fase_vuelo-change-btn');
                
                function updateFaunaFaseVueloState() {
                    try {
                        var checked = faunaFaseVueloRadios.find(function (r) { return r.checked; });
                        if (checked) {
                            // Bloquear todos los radios
                            faunaFaseVueloRadios.forEach(function (r) {
                                r.disabled = true;
                                var lbl = r.closest('label');
                                if (lbl) lbl.classList.remove('selected');
                            });
                            // Marcar el seleccionado
                            var lbl = checked.closest('label');
                            if (lbl) lbl.classList.add('selected');
                            // Mostrar botón para cambiar
                            if (faunaFaseVueloChangeBtn) faunaFaseVueloChangeBtn.style.display = 'inline-block';
                        } else {
                            // Desbloquear todos
                            faunaFaseVueloRadios.forEach(function (r) {
                                r.disabled = false;
                                var lbl = r.closest('label');
                                if (lbl) lbl.classList.remove('selected');
                            });
                            // Ocultar botón
                            if (faunaFaseVueloChangeBtn) faunaFaseVueloChangeBtn.style.display = 'none';
                        }
                    } catch (e) { }
                }

                faunaFaseVueloRadios.forEach(function (r) {
                    r.addEventListener('change', function () { updateFaunaFaseVueloState(); });
                });

                // Botón para cambiar fase de vuelo
                if (faunaFaseVueloChangeBtn) {
                    faunaFaseVueloChangeBtn.addEventListener('click', function () {
                        faunaFaseVueloRadios.forEach(function (r) { r.disabled = false; r.checked = false; });
                        faunaFaseVueloChangeBtn.style.display = 'none';
                        faunaFaseVueloRadios.forEach(function (r) {
                            var lbl = r.closest('label');
                            if (lbl) lbl.classList.remove('selected');
                        });
                    });
                }

                updateFaunaFaseVueloState();
            
    };

})();
