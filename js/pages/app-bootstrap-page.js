(function () {
  document.addEventListener('DOMContentLoaded', function () {
    if (window.MHRDashboardUI && typeof window.MHRDashboardUI.init === 'function') {
      window.MHRDashboardUI.init();
    }

    if (window.MHRRevisionPage && typeof window.MHRRevisionPage.init === 'function') {
      window.MHRRevisionPage.init();
    }
  });
})();
