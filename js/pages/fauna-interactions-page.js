(function () {
  window.MHRFaunaInteractionsPage = window.MHRFaunaInteractionsPage || {};

  window.MHRFaunaInteractionsPage.init = function initFaunaInteractions(options) {
    options = options || {};
    var faunaForm = document.getElementById('fauna-form');
    if (!faunaForm) return;

    if (window.MHRFaunaPage && typeof window.MHRFaunaPage.initTipoReporteLock === 'function') window.MHRFaunaPage.initTipoReporteLock(faunaForm);
    if (window.MHRFaunaPage && typeof window.MHRFaunaPage.initTurnoVisibility === 'function') window.MHRFaunaPage.initTurnoVisibility(faunaForm);
    if (window.MHRFaunaPage && typeof window.MHRFaunaPage.initPistaLock === 'function') window.MHRFaunaPage.initPistaLock(faunaForm);
    if (window.MHRFaunaPage && typeof window.MHRFaunaPage.initFaseVueloLock === 'function') window.MHRFaunaPage.initFaseVueloLock(faunaForm);

    (function () {
      var itemIds = ['fauna_avistamiento'];
      itemIds.forEach(function (id) {
        var chk = faunaForm.querySelector('input#' + id);
        var det = faunaForm.querySelector('div#' + id.replace(/^fauna_/, 'fauna_details_'));
        if (!chk || !det) return;
        if (id === 'fauna_avistamiento') { chk.checked = true; det.style.display = 'block'; }
        chk.addEventListener('change', function () {
          if (id === 'fauna_avistamiento') { chk.checked = true; det.style.display = 'block'; return; }
          if (chk.checked) det.style.display = 'block'; else {
            det.style.display = 'none';
            Array.prototype.slice.call(det.querySelectorAll('input, textarea, select')).forEach(function (el) {
              try { if (el.type === 'checkbox' || el.type === 'radio') el.checked = false; else { el.value = ''; if (el.classList && el.classList.contains('priority-select')) el.style.backgroundColor = ''; if (el.classList && el.classList.contains('condicion-select')) el.style.backgroundColor = ''; } } catch (e) {}
            });
          }
        });
      });
    })();

    (function () {
      try {
        var prioSelects = faunaForm.querySelectorAll('select.priority-select');
        var condSelects = faunaForm.querySelectorAll('select.condicion-select');
        Array.prototype.forEach.call(prioSelects, function (sel) { sel.addEventListener('change', function () { var colorMap = { '1': '#28a745', '2': '#ffc107', '3': '#ff8c00' }; sel.style.backgroundColor = colorMap[sel.value] || ''; }); });
        Array.prototype.forEach.call(condSelects, function (sel) { sel.addEventListener('change', function () { var condMap = { 'Daño Menor': '#28a745', 'Daño Mayor': '#ffc107', 'Daño Severo': '#ff8c00', 'Daño Catastrofico': '#dc3545', 'Satisfactorio': '#28a745', 'No Satisfactorio': '#dc3545', 'N/A': '#6c757d' }; sel.style.backgroundColor = condMap[sel.value] || ''; }); });
      } catch (e) {}
    })();

    setTimeout(function () {
      try {
        var lugarInputs = faunaForm.querySelectorAll('input[name*="[lugar]"]');
        Array.prototype.forEach.call(lugarInputs, function (input) {
          input.addEventListener('click', function (e) { e.preventDefault(); if (window.openMapPicker) window.openMapPicker(input); });
          input.style.cursor = 'pointer'; input.setAttribute('placeholder', 'Click para seleccionar en mapa'); input.style.pointerEvents = 'auto';
        });
      } catch (e) { console.error('Error wiring map picker for fauna', e); }
    }, 100);

    (function () {
      var especieSelects = faunaForm.querySelectorAll('select.fauna-especie-select');
      Array.prototype.forEach.call(especieSelects, function (sel) {
        var especieOtherInput = sel.closest('label').parentElement.querySelector('input[name*="[especie_otra]"]');
        function updateEspecieVisibility() { if (sel.value === 'Otra' && especieOtherInput) especieOtherInput.style.display = 'block'; else if (especieOtherInput) { especieOtherInput.style.display = 'none'; especieOtherInput.value = ''; } }
        sel.addEventListener('change', updateEspecieVisibility); updateEspecieVisibility();
      });
    })();

    if (typeof options.cargarCatalogosFauna === 'function') {
      options.cargarCatalogosFauna().catch(function (err) { console.warn('No se pudieron cargar catálogos fauna:', err); });
    }
  };
})();
