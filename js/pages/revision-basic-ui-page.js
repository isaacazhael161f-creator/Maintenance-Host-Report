(function () {
  var itemIds = [
    'tipo_area_movimiento', 'tipo_franjas', 'tipo_iluminacion', 'tipo_marcas', 'tipo_ayudas',
    'tipo_obstaculos', 'tipo_combustibles', 'tipo_construccion', 'tipo_ssei', 'tipo_vehiculos',
    'tipo_fauna', 'tipo_proteccion'
  ];

  function init() {
    var utils = window.MHRUtils || {};
    if (typeof utils.bindTurnoVisibility === 'function') {
      utils.bindTurnoVisibility('tipo_inspeccion', 'turno-section', 'turno');
    }

    var authorSelect = document.getElementById('report-authors-select');
    var resetBtn = document.getElementById('report-authors-reset');
    if (typeof utils.bindLockSelect === 'function') {
      utils.bindLockSelect(authorSelect, resetBtn, { clearOnReset: true });
    }

    itemIds.forEach(function (id) {
      var chk = document.getElementById(id);
      var det = document.getElementById('details_' + id);
      if (!chk || !det) return;
      chk.addEventListener('change', function () {
        if (chk.checked) {
          det.style.display = 'block';
        } else {
          det.style.display = 'none';
          Array.prototype.slice.call(det.querySelectorAll('input, textarea, select')).forEach(function (el) {
            if (el.type === 'checkbox' || el.type === 'radio') {
              el.checked = false;
            } else {
              el.value = '';
              try {
                if (el.classList && el.classList.contains('priority-select')) el.style.backgroundColor = '';
                if (el.classList && el.classList.contains('condicion-select')) el.style.backgroundColor = '';
              } catch (e) { }
            }
          });
        }
      });
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
