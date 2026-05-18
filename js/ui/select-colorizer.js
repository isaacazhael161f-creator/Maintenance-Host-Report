(function () {
    var priorityMap = { '1': '#28a745', '2': '#ffc107', '3': '#dc3545' };
    var condicionMap = { 'Satisfactorio': '#28a745', 'No Satisfactorio': '#dc3545', 'N/A': '#6c757d' };

    function applyColor(sel, map) {
        try {
            var v = sel.value;
            sel.style.backgroundColor = map[v] || '';
        } catch (e) { }
    }

    function initPriority() {
        var prios = document.querySelectorAll('select.priority-select');
        prios.forEach(function (s) {
            s.addEventListener('change', function () { applyColor(s, priorityMap); });
            applyColor(s, priorityMap);
        });
    }

    function initCondicion() {
        var conds = document.querySelectorAll('select.condicion-select');
        conds.forEach(function (s) {
            s.addEventListener('change', function () { applyColor(s, condicionMap); });
            applyColor(s, condicionMap);
        });
    }

    document.addEventListener('DOMContentLoaded', function () {
        initPriority();
        initCondicion();
    });
})();
