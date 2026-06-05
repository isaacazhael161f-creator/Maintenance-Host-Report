(function () {
  (function () {
    var itemIds = [
      'tipo_area_movimiento', 'tipo_franjas', 'tipo_iluminacion', 'tipo_marcas', 'tipo_ayudas',
      'tipo_obstaculos', 'tipo_combustibles', 'tipo_construccion', 'tipo_ssei', 'tipo_vehiculos',
      'tipo_fauna', 'tipo_proteccion'
    ];

    var tipoEls = itemIds.map(function (id) { return document.getElementById(id); }).filter(Boolean);
    if (!tipoEls.length) return;

    itemIds.forEach(function (id) {
      var chk = document.getElementById(id);
      var doneBtn = document.getElementById('done_' + id);
      var updateBtn = document.getElementById('update_' + id);
      if (!chk) return;

      function refresh() {
        if (chk.disabled) {
          if (doneBtn) doneBtn.style.display = 'none';
          if (updateBtn) updateBtn.style.display = 'inline-block';
        } else {
          if (chk.checked) { if (doneBtn) doneBtn.style.display = 'inline-block'; }
          else { if (doneBtn) doneBtn.style.display = 'none'; }
          if (updateBtn) updateBtn.style.display = 'none';
        }
      }

      chk.addEventListener('change', function () { refresh(); });

      if (doneBtn) {
        doneBtn.addEventListener('click', function () {
          if (chk.checked) {
            chk.disabled = true;
            var det = document.getElementById('details_' + id);
            if (det) {
              Array.prototype.slice.call(det.querySelectorAll('input, textarea, select')).forEach(function (el) {
                try { el.disabled = true; } catch (e) {}
              });
            }
          }
          refresh();
        });
      }

      if (updateBtn) {
        updateBtn.addEventListener('click', function () {
          chk.disabled = false;
          var det = document.getElementById('details_' + id);
          if (det) {
            Array.prototype.slice.call(det.querySelectorAll('input, textarea, select')).forEach(function (el) {
              try { el.disabled = false; } catch (e) {}
            });
          }
          refresh();
        });
      }

      refresh();
    });
  })();
})();
