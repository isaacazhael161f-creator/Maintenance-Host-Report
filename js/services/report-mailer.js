// ============================================================================
// MHR · Cliente front para envío de correos de reporte
//   Expone window.MHRReportMailer con:
//     - sendReportEmail({ reportId, blob, to, asuntoExtra })  → invoca Edge Fn
//     - blobToBase64(blob)                                    → util
// ============================================================================
(function () {
    'use strict';

    var FUNCTION_NAME = 'mhr-send-report-email';

    function blobToBase64(blob) {
        return new Promise(function (resolve, reject) {
            if (!blob) { resolve(null); return; }
            try {
                var reader = new FileReader();
                reader.onload = function () {
                    // result = "data:application/pdf;base64,JVBERi0..."
                    var s = String(reader.result || '');
                    var idx = s.indexOf(',');
                    resolve(idx >= 0 ? s.slice(idx + 1) : s);
                };
                reader.onerror = function () { reject(reader.error || new Error('FileReader error')); };
                reader.readAsDataURL(blob);
            } catch (e) { reject(e); }
        });
    }

    async function sendReportEmail(opts) {
        opts = opts || {};
        if (!window.supabaseClient) return { ok: false, error: 'supabaseClient no disponible' };
        if (!opts.reportId)         return { ok: false, error: 'reportId requerido' };

        var pdfBase64 = null;
        if (opts.blob) {
            try { pdfBase64 = await blobToBase64(opts.blob); }
            catch (e) { console.warn('[MHRReportMailer] No se pudo convertir PDF a base64:', e); }
        }

        var body = {
            reportId:    opts.reportId,
            pdfBase64:   pdfBase64,
            pdfFilename: opts.pdfFilename || ('reporte_' + opts.reportId + '.pdf')
        };
        if (Array.isArray(opts.to) && opts.to.length) body.to = opts.to;
        if (opts.asuntoExtra)                          body.asuntoExtra = opts.asuntoExtra;

        try {
            var resp = await window.supabaseClient.functions.invoke(FUNCTION_NAME, { body: body });
            if (resp.error) {
                console.error('[MHRReportMailer] Edge Function error:', resp.error);
                return { ok: false, error: resp.error.message || 'Edge Function error' };
            }
            if (resp.data && resp.data.ok === false) {
                console.error('[MHRReportMailer] Function devolvió error:', resp.data);
                return { ok: false, error: resp.data.error || 'Función devolvió ok=false', detail: resp.data };
            }
            return { ok: true, data: resp.data };
        } catch (e) {
            console.error('[MHRReportMailer] Excepción al invocar:', e);
            return { ok: false, error: e && e.message ? e.message : String(e) };
        }
    }

    window.MHRReportMailer = {
        sendReportEmail: sendReportEmail,
        blobToBase64:    blobToBase64
    };
})();
