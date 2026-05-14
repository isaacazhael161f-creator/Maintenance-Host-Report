(function () {
  document.addEventListener('DOMContentLoaded', function () {
    var btn = document.getElementById('clear-saved-btn');
    if (!btn) return;

    btn.addEventListener('click', function () {
      if (!confirm('¿Borrar el estado guardado de la sección actual?')) return;
      try {
        var revisionSection = document.getElementById('revision-section');
        var faunaSection = document.getElementById('fauna-section');
        var isRevisionActive = revisionSection && revisionSection.classList.contains('active');
        var isFaunaActive = faunaSection && faunaSection.classList.contains('active');

        if (isRevisionActive) {
          var form = document.getElementById('report-form');
          if (form) {
            Array.prototype.slice.call(form.querySelectorAll('input, textarea, select')).forEach(function (el) {
              try {
                if (el.tagName === 'BUTTON' || (el.type && (el.type === 'submit' || el.type === 'button'))) return;
                if (el.type === 'checkbox' || el.type === 'radio') el.checked = false;
                else el.value = '';
              } catch (e) {}
            });
          }

          Array.prototype.slice.call(document.querySelectorAll('input[type="checkbox"][id^="tipo_"]')).forEach(function (chk) {
            chk.checked = false;
            var det = document.getElementById('details_' + chk.id);
            if (det) det.style.display = 'none';
          });
        } else if (isFaunaActive) {
          var faunaForm = document.getElementById('fauna-form');
          if (faunaForm) {
            Array.prototype.slice.call(faunaForm.querySelectorAll('input, textarea, select')).forEach(function (el) {
              try {
                if (el.tagName === 'BUTTON' || (el.type && (el.type === 'submit' || el.type === 'button'))) return;
                if (el.type === 'checkbox' || el.type === 'radio') el.checked = false;
                else el.value = '';
              } catch (e) {}
            });
          }
          window.faunaRescateFotos = [];
          var fotosPreview = document.getElementById('fauna_rescate_fotos_preview');
          if (fotosPreview) fotosPreview.innerHTML = '';
        }

        if (window.saveFormState) window.saveFormState();
        alert('Sección limpiada correctamente.');
      } catch (e) {
        console.error('Error al limpiar', e);
        alert('Ocurrió un error al limpiar. Revisa la consola.');
      }
    });
  });
})();
