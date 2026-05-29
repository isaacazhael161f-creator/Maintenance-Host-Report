window.MHRMainTabsPage = (function () {
  function init(options) {
    options = options || {};
    var cargarCatalogosFauna = options.cargarCatalogosFauna;
    var loadFaunaStatistics = options.loadFaunaStatistics;
    var loadFaunaReports = options.loadFaunaReports;
    var loadEstadisticas = options.loadEstadisticas;

    var tabs = document.querySelectorAll('.sidebar-tab');
    var sections = document.querySelectorAll('.content-section');

    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        var targetTab = this.getAttribute('data-tab');

        tabs.forEach(function (t) { t.classList.remove('active'); });
        this.classList.add('active');

        sections.forEach(function (section) { section.classList.remove('active'); });
        var targetSection = document.getElementById(targetTab + '-section');
        if (targetSection) {
          targetSection.classList.add('active');

          var mainTitle = document.getElementById('main-title');
          if (mainTitle) {
            if (targetTab === 'revision') {
              mainTitle.textContent = 'Formato de Revisión del Área de Movimiento';
            } else if (targetTab === 'fauna') {
              mainTitle.textContent = 'Registro de Impacto o Posible Impacto';
              if (typeof cargarCatalogosFauna === 'function') cargarCatalogosFauna();
            } else if (targetTab === 'historial') {
              mainTitle.textContent = 'Historial de Reportes';
              if (typeof window.resetHistorialFilters === 'function') window.resetHistorialFilters();
            } else if (targetTab === 'estadistica') {
              mainTitle.textContent = 'Estadísticas';
            } else if (targetTab === 'estadistica-fauna') {
              mainTitle.textContent = 'Estadística Fauna';
              if (typeof cargarCatalogosFauna === 'function') cargarCatalogosFauna();
              if (typeof loadFaunaStatistics === 'function') loadFaunaStatistics();
            } else if (targetTab === 'historial-fauna') {
              mainTitle.textContent = 'Historial de Reportes de Fauna';
              if (typeof cargarCatalogosFauna === 'function') cargarCatalogosFauna();
              if (typeof loadFaunaReports === 'function') loadFaunaReports({});
            }
          }

          if (targetTab === 'estadistica' && typeof loadEstadisticas === 'function') {
            loadEstadisticas();
          }
        }

        document.body.classList.add('sidebar-hidden');
      });
    });

    var menuToggleBtn = document.getElementById('menu-toggle-btn');
    if (menuToggleBtn) {
      menuToggleBtn.addEventListener('click', function () {
        document.body.classList.remove('sidebar-hidden');
      });
    }
  }

  return { init: init };
})();
