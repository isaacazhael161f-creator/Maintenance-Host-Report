(function () {
  var STORAGE_KEY = 'mhr_form_state_v1';
  var saveTimer = null;

  function getFieldKey(el) {
    if (el.id) return 'id::' + el.id;
    if (el.name) return 'name::' + el.name;
    return null;
  }

  function collectState() {
    var state = { counters: {}, fields: {} };
    try { if (window.mhr && window.mhr.counters) state.counters = Object.assign({}, window.mhr.counters); } catch (e) {}

    Array.prototype.slice.call(document.querySelectorAll('input,textarea,select')).forEach(function (el) {
      var key = getFieldKey(el);
      if (!key) return;
      var rec = { disabled: !!el.disabled };
      if (el.type === 'checkbox' || el.type === 'radio') rec.checked = !!el.checked;
      else rec.value = el.value;
      state.fields[key] = rec;
    });
    return state;
  }

  function saveState() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(collectState())); }
    catch (e) { console.error('Error guardando estado', e); }
  }

  function saveDebounced() {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(saveState, 300);
  }

  function restoreState() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      var state = JSON.parse(raw);

      if (state.counters && window.mhr && typeof window.mhr.duplicateItem === 'function') {
        Object.keys(state.counters).forEach(function (origId) {
          var count = parseInt(state.counters[origId], 10) || 0;
          try {
            var existingNodes = Array.prototype.slice.call(document.querySelectorAll('input[type="checkbox"][id^="' + origId + '_dup"]'));
            var existing = existingNodes.length;
            if (existing < count) {
              var toCreate = Math.min(20, count - existing);
              for (var i = 0; i < toCreate; i++) { try { window.mhr.duplicateItem(origId); } catch (e) { console.warn('dup failed', origId, e); } }
            } else if (existing > count) {
              var removeCount = existing - count;
              for (var r = 0; r < removeCount; r++) {
                var node = existingNodes.pop();
                if (!node) break;
                try {
                  var id = node.id;
                  var lbl = document.querySelector('label[for="' + id + '"]');
                  if (lbl && lbl.parentNode) lbl.parentNode.removeChild(lbl);
                  ['done_', 'update_', 'dup_', 'clear_'].forEach(function (pref) { var b = document.getElementById(pref + id); if (b && b.parentNode) b.parentNode.removeChild(b); });
                  var det = document.getElementById('details_' + id);
                  if (det && det.parentNode) det.parentNode.removeChild(det);
                  if (node.parentNode) node.parentNode.removeChild(node);
                } catch (e) { console.warn('error removing extra clone', e); }
              }
            }
          } catch (e) { console.warn('error handling counters for', origId, e); }
        });
      }

      if (state.fields) {
        Object.keys(state.fields).forEach(function (k) {
          var rec = state.fields[k];
          if (k.indexOf('id::') === 0) {
            var id = k.slice(4);
            var el = document.getElementById(id);
            if (!el) return;
            try {
              if ('checked' in rec) el.checked = !!rec.checked;
              else if ('value' in rec) el.value = rec.value;
              var _hasVal = ('checked' in rec) ? !!rec.checked : !!(el.value);
              el.disabled = !!rec.disabled && _hasVal;
              el.dispatchEvent(new Event('change', { bubbles: true }));
            } catch (e) {}
          } else if (k.indexOf('name::') === 0) {
            var name = k.slice(6);
            var nodeList = document.querySelectorAll('[name="' + name.replace(/"/g, '\\"') + '"]');
            if (!nodeList || !nodeList.length) return;
            var el0 = nodeList[0];
            try {
              if (el0.type === 'checkbox' || el0.type === 'radio') Array.prototype.slice.call(nodeList).forEach(function (n) { n.checked = !!rec.checked; });
              else nodeList.forEach(function (n) { n.value = rec.value; });
              Array.prototype.slice.call(nodeList).forEach(function (n) { var _hasVal = (el0.type === 'checkbox' || el0.type === 'radio') ? !!rec.checked : !!(n.value); n.disabled = !!rec.disabled && _hasVal; n.dispatchEvent(new Event('change', { bubbles: true })); });
            } catch (e) {}
          }
        });
      }
    } catch (e) { console.error('Error restaurando estado', e); }
  }

  document.addEventListener('input', saveDebounced);
  document.addEventListener('change', saveDebounced);
  document.addEventListener('click', function (e) {
    var t = e.target;
    if (!t) return;
    if (t.classList && (t.classList.contains('item-duplicate') || t.classList.contains('item-done') || t.classList.contains('item-update'))) {
      setTimeout(saveState, 200);
    }
  });

  try { window.saveFormState = saveState; window.restoreFormState = restoreState; } catch (e) {}
  document.addEventListener('DOMContentLoaded', function () { setTimeout(restoreState, 100); });
})();
