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
              try { if (el.type === 'checkbox' || el.type === 'radio') el.checked = false; else { el.value = ''; if (el.classList && el.classList.contains('priority-select')) { el.style.backgroundColor = ''; el.classList.remove('prio-1','prio-2','prio-3'); } if (el.classList && el.classList.contains('condicion-select')) { el.style.backgroundColor = ''; el.classList.remove('cond-ok','cond-bad','cond-na','cond-leve','cond-medio','cond-alto','cond-critico'); } } } catch (e) {}
            });
          }
        });
      });
    })();

    (function () {
      try {
        if (window.MHRSelectColorizer && typeof window.MHRSelectColorizer.refresh === 'function') {
          window.MHRSelectColorizer.refresh(faunaForm);
        }
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

    // Combo inteligente de aerolíneas (catálogo + frecuencia histórica)
    (function () {
      var aerolineaInput = faunaForm.querySelector('#fauna_report-aerolinea');
      var aerolineaDataList = faunaForm.querySelector('#fauna_report-aerolinea-options');
      var aerolineaTopHint = faunaForm.querySelector('#fauna_report-aerolinea-top');
      if (!aerolineaInput || !aerolineaDataList) return;

      function normalizeText(v) {
        return (v || '').toString().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
      }

      async function loadAirlineSmartOptions() {
        var client = window.supabaseClient;
        if (!client || !window.MHRCatalogService) return;
        var airlinesMap = new Map();
        var frequencyMap = new Map();

        function splitCodeAndName(rawValue) {
          var raw = (rawValue || '').trim();
          var match = raw.match(/^([A-Z0-9]{2,3})\s*-\s*(.+)$/i);
          if (match) return { code: match[1].toUpperCase(), name: match[2].trim() };
          return { code: '', name: raw };
        }

        function upsertAirline(rawValue, preferredCode) {
          var parts = splitCodeAndName(rawValue);
          var name = parts.name;
          if (!name) return;
          var key = normalizeText(name);
          var current = airlinesMap.get(key);
          var code = (preferredCode || parts.code || '').trim().toUpperCase();
          if (!current) { airlinesMap.set(key, { key: key, name: name, code: code }); return; }
          if (!current.code && code) current.code = code;
        }

        var catalogRows = await window.MHRCatalogService.getCatalogoAerolineas(client);
        if (Array.isArray(catalogRows)) {
          catalogRows.forEach(function (row) { upsertAirline((row.nombre_aerolinea || '').trim(), (row.codigo_iata || '').trim()); });
        }

        var usageRows = await window.MHRCatalogService.getUsoAerolineas(client);
        if (Array.isArray(usageRows)) {
          usageRows.forEach(function (row) {
            var rawAirline = (row.aerolinea || '').trim();
            var parsed = splitCodeAndName(rawAirline);
            var freqKey = normalizeText(parsed.name);
            if (!freqKey) return;
            frequencyMap.set(freqKey, (frequencyMap.get(freqKey) || 0) + 1);
            upsertAirline(rawAirline, parsed.code);
          });
        }

        var items = Array.from(airlinesMap.values()).map(function (item) {
          var label = item.code ? (item.code + ' - ' + item.name) : item.name;
          return { label: label, key: item.key };
        });

        items.sort(function (a, b) {
          var aFreq = frequencyMap.get(a.key) || 0;
          var bFreq = frequencyMap.get(b.key) || 0;
          if (bFreq !== aFreq) return bFreq - aFreq;
          return a.label.localeCompare(b.label, 'es');
        });

        aerolineaDataList.innerHTML = '';
        items.forEach(function (item) {
          var option = document.createElement('option');
          option.value = item.label;
          aerolineaDataList.appendChild(option);
        });

        var topAirlines = items.slice(0, 5).map(function (item) { return item.label; });
        if (aerolineaTopHint) {
          aerolineaTopHint.textContent = topAirlines.length ? ('Más usadas: ' + topAirlines.join(' · ')) : 'Sin historial de frecuencia todavía.';
        }
      }

      loadAirlineSmartOptions().catch(function (err) {
        console.warn('No se pudo cargar el combo inteligente de aerolíneas:', err);
      });

      aerolineaInput.addEventListener('input', function () {
        var typed = normalizeText(aerolineaInput.value);
        if (!typed) return;
        var options = Array.from(aerolineaDataList.options || []);
        var match = options.some(function (opt) { return normalizeText(opt.value).includes(typed); });
        if (!match && aerolineaTopHint) aerolineaTopHint.textContent = 'Sin coincidencias exactas, puedes capturar una nueva aerolínea.';
      });
    })();

    // Parte del avión impactada (solo para evento = Impacto)
    (function () {
      var eventoInputs = faunaForm.querySelectorAll('input[name="fauna_report_evento"]');
      var parteWrap = document.getElementById('fauna_impacto_parte_avion_wrap');
      var parteSelect = document.getElementById('fauna_report-parte-avion');
      var parteHint = document.getElementById('fauna_report-parte-avion-hint');
      if (!eventoInputs.length || !parteWrap || !parteSelect) return;

      function getEventoValue() {
        var checked = faunaForm.querySelector('input[name="fauna_report_evento"]:checked');
        return checked ? checked.value : '';
      }

      function updateParteVisibility() {
        var show = getEventoValue() === 'Impacto';
        parteSelect.disabled = !show;
        parteSelect.style.opacity = show ? '1' : '0.65';
        if (parteHint) parteHint.textContent = show ? 'Selecciona la parte del avión afectada.' : 'Selecciona primero el evento "Impacto" para habilitar este campo.';
        if (!show) parteSelect.value = '';
      }

      async function loadPartesAvion() {
        var client = window.supabaseClient;
        if (!client || !window.MHRCatalogService) return;
        var rows = await window.MHRCatalogService.getPartesAvionActivas(client);
        if (!Array.isArray(rows)) return;
        rows.forEach(function (row) {
          var nombre = (row.nombre || '').trim();
          if (!nombre) return;
          var opt = document.createElement('option');
          opt.value = nombre;
          opt.textContent = nombre;
          parteSelect.appendChild(opt);
        });
      }

      eventoInputs.forEach(function (radio) { radio.addEventListener('change', updateParteVisibility); });
      updateParteVisibility();
      loadPartesAvion().catch(function (err) { console.warn('No se pudo cargar catálogo de partes de avión:', err); });
    })();
  };
})();
