(function () {
  window.MHROfflineSyncPage = window.MHROfflineSyncPage || {};

  window.MHROfflineSyncPage.init = function initOfflineSyncPage(options) {
    options = options || {};
    var showOfflineBanner = options.showOfflineBanner;
    var hideOfflineBanner = options.hideOfflineBanner;
    var getPendingReports = options.getPendingReports;

    window.addEventListener('online', function () {
      if (typeof hideOfflineBanner === 'function') hideOfflineBanner();
      if (typeof window.syncPendingReports === 'function') window.syncPendingReports();
    });

    window.addEventListener('offline', function () {
      if (typeof showOfflineBanner === 'function') {
        showOfflineBanner('📡 Sin conexión a Internet', 'offline');
      }
    });

    if (!navigator.onLine && typeof showOfflineBanner === 'function') {
      showOfflineBanner('📡 Sin conexión — los reportes se guardarán localmente', 'offline');
    }

    if (typeof window.updatePendingBadge === 'function') window.updatePendingBadge();

    if (navigator.onLine && typeof getPendingReports === 'function') {
      getPendingReports().then(function (list) {
        if (list && list.length > 0 && typeof window.syncPendingReports === 'function') {
          setTimeout(window.syncPendingReports, 800);
        }
      }).catch(function () {});
    }
  };
})();
