(function () {
  (function () {
    var itemIds = [
      'tipo_area_movimiento', 'tipo_franjas', 'tipo_iluminacion', 'tipo_marcas', 'tipo_ayudas',
      'tipo_obstaculos', 'tipo_combustibles', 'tipo_construccion', 'tipo_ssei', 'tipo_vehiculos',
      'tipo_fauna', 'tipo_proteccion'
    ];

    itemIds.forEach(function (id) {
      var sel = document.getElementById('hallazgo_' + id);
      var other = document.getElementById('hallazgo_other_' + id);
      if (!sel || !other) return;

      function update() {
        if (sel.value === 'Otro') other.style.display = 'block';
        else { other.style.display = 'none'; other.value = ''; }
      }

      sel.addEventListener('change', update);
      update();
    });

    itemIds.forEach(function (id) {
      var other = document.getElementById('hallazgo_other_' + id);
      if (!chk || !other) return;
      chk.addEventListener('change', function () {
        if (!chk.checked) { other.style.display = 'none'; other.value = ''; }
      });
    });
  })();
})();
