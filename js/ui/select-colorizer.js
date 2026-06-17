(function () {
    var CONDICION_CLASSES = ['cond-ok', 'cond-bad', 'cond-na', 'cond-leve', 'cond-medio', 'cond-alto', 'cond-critico'];
    var condicionClassMap = {
        'Satisfactorio': 'cond-ok',
        'No Satisfactorio': 'cond-bad',
        'N/A': 'cond-na',
        'Daño Menor': 'cond-leve',
        'Daño Mayor': 'cond-medio',
        'Daño Severo': 'cond-alto',
        'Daño Catastrofico': 'cond-critico'
    };

    function applyPriority(sel) {
        try {
            sel.classList.remove('prio-1', 'prio-2', 'prio-3');
            var v = String(sel.value || '');
            if (v === '1' || v === '2' || v === '3') {
                sel.classList.add('prio-' + v);
            }
            sel.style.backgroundColor = '';
        } catch (e) { }
    }

    function applyCondicion(sel) {
        try {
            CONDICION_CLASSES.forEach(function (c) { sel.classList.remove(c); });
            var cls = condicionClassMap[sel.value];
            if (cls) sel.classList.add(cls);
            sel.style.backgroundColor = '';
        } catch (e) { }
    }

    function refreshAll(root) {
        var scope = root && root.querySelectorAll ? root : document;
        scope.querySelectorAll('select.priority-select').forEach(applyPriority);
        scope.querySelectorAll('select.condicion-select').forEach(applyCondicion);
    }

    document.addEventListener('change', function (e) {
        var t = e.target;
        if (!t || t.tagName !== 'SELECT') return;
        if (t.classList.contains('priority-select')) applyPriority(t);
        else if (t.classList.contains('condicion-select')) applyCondicion(t);
    });

    document.addEventListener('DOMContentLoaded', function () {
        refreshAll(document);
        try {
            var observer = new MutationObserver(function (mutations) {
                for (var i = 0; i < mutations.length; i++) {
                    var added = mutations[i].addedNodes;
                    for (var j = 0; j < added.length; j++) {
                        var n = added[j];
                        if (n && n.nodeType === 1) refreshAll(n);
                    }
                }
            });
            observer.observe(document.body, { childList: true, subtree: true });
        } catch (e) { }
    });

    window.MHRSelectColorizer = { refresh: refreshAll, applyPriority: applyPriority, applyCondicion: applyCondicion };
})();
