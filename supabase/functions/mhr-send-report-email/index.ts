// ============================================================================
// Supabase Edge Function · mhr-send-report-email
//   Envía por Resend un correo (HTML + PDF adjunto) con los datos del reporte
//   a los destinatarios configurados en public.mhr_email_recipients (o a los
//   pasados explícitamente en el body).
//
// Despliegue:
//   supabase functions deploy mhr-send-report-email --no-verify-jwt=false
//
// Secrets requeridos (Supabase → Project Settings → Edge Functions → Secrets):
//   RESEND_API_KEY    Tu API key de Resend (re_xxxxx)
//   MAIL_FROM         (opcional) Remitente; default: 'operaciones@aifanlu.com.mx'
//   MAIL_FROM_NAME    (opcional) Nombre visible; default: 'MHR · Operaciones AIFA'
//
// Body esperado (JSON):
//   {
//     "reportId":    "uuid",                        // requerido
//     "pdfBase64":   "JVBERi0xLjQK...",             // opcional; si viene se adjunta
//     "pdfFilename": "reporte_20260617-143052.pdf", // opcional
//     "to":          ["alguien@x.com"],             // opcional; override de la tabla
//     "asuntoExtra": "string opcional"              // opcional
//   }
// ============================================================================

// deno-lint-ignore-file no-explicit-any

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const RESEND_API_KEY  = Deno.env.get('RESEND_API_KEY')  || '';
const MAIL_FROM       = Deno.env.get('MAIL_FROM')       || 'operaciones@aifanlu.com.mx';
const MAIL_FROM_NAME  = Deno.env.get('MAIL_FROM_NAME')  || 'MHR · Operaciones AIFA';
const SUPABASE_URL    = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY     = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const CORS_HEADERS = {
    'Access-Control-Allow-Origin':  '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

function json(body: any, status = 200) {
    return new Response(JSON.stringify(body), {
        status,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
    });
}

function esc(s: any): string {
    return String(s ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function badgeFor(estatus: string): string {
    const e = String(estatus || '').toLowerCase();
    if (e.includes('atendido') && !e.includes('no'))
        return 'background:#dcfce7;color:#166534;border:1px solid #86efac';
    if (e.includes('no atendido'))
        return 'background:#fee2e2;color:#991b1b;border:1px solid #fca5a5';
    if (e.includes('proceso'))
        return 'background:#fef9c3;color:#854d0e;border:1px solid #fde047';
    return 'background:#f1f5f9;color:#334155;border:1px solid #cbd5e1';
}

function condColor(cond: string): string {
    const c = String(cond || '').toLowerCase();
    if (c.includes('menor') || c === 'satisfactorio') return '#16a34a';
    if (c.includes('mayor'))                          return '#facc15';
    if (c.includes('severo'))                         return '#f97316';
    if (c.includes('catastr') || c === 'no satisfactorio') return '#dc2626';
    return '#3b82f6';
}

function buildHtmlEmail(report: any, items: any[], asuntoExtra?: string): string {
    const estatus = report.estatus || 'No Atendido';
    const fecha   = report.fecha_local || (report.created_at ? new Date(report.created_at).toLocaleString('es-MX') : '-');
    const folio   = report.folio || '-';

    const rowsHtml = (items || [])
        .filter((it: any) => it && it.item_nombre !== '__firmas__')
        .map((it: any) => {
            const color = condColor(it.condicion);
            return `
                <tr>
                    <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;font-size:12px;vertical-align:top;">${esc(it.item_nombre || '-')}</td>
                    <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;font-size:12px;vertical-align:top;">${esc(it.lugar || '-')}</td>
                    <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;font-size:12px;vertical-align:top;">${esc(it.hallazgo || '-')}</td>
                    <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;font-size:12px;vertical-align:top;">
                        <span style="display:inline-block;padding:2px 8px;border-radius:10px;background:${color}22;color:${color};font-weight:600;font-size:11px;">
                            ${esc(it.condicion || '-')}
                        </span>
                    </td>
                    <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;font-size:12px;vertical-align:top;">${esc(it.prioridad || '-')}</td>
                </tr>
            `;
        })
        .join('');

    const itemsTable = rowsHtml
        ? `
            <table cellspacing="0" cellpadding="0" style="width:100%;border-collapse:collapse;margin-top:14px;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
                <thead>
                    <tr style="background:#f1f5f9;">
                        <th style="padding:9px 10px;text-align:left;font-size:11px;color:#475569;text-transform:uppercase;letter-spacing:.4px;">Item</th>
                        <th style="padding:9px 10px;text-align:left;font-size:11px;color:#475569;text-transform:uppercase;letter-spacing:.4px;">Lugar</th>
                        <th style="padding:9px 10px;text-align:left;font-size:11px;color:#475569;text-transform:uppercase;letter-spacing:.4px;">Hallazgo</th>
                        <th style="padding:9px 10px;text-align:left;font-size:11px;color:#475569;text-transform:uppercase;letter-spacing:.4px;">Condición</th>
                        <th style="padding:9px 10px;text-align:left;font-size:11px;color:#475569;text-transform:uppercase;letter-spacing:.4px;">Prioridad</th>
                    </tr>
                </thead>
                <tbody>${rowsHtml}</tbody>
            </table>
        `
        : '<p style="color:#64748b;font-size:12px;margin:14px 0 0;">Sin items registrados.</p>';

    return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><title>Reporte ${esc(folio)}</title></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0f172a;">
    <table role="presentation" cellspacing="0" cellpadding="0" style="width:100%;max-width:720px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 6px 24px rgba(15,23,42,.08);">
        <tr>
            <td style="background:linear-gradient(135deg,#1e3a8a 0%,#2563eb 100%);padding:22px 28px;color:#fff;">
                <div style="font-size:11px;letter-spacing:1.2px;text-transform:uppercase;opacity:.85;">Maintenance Host Report</div>
                <h1 style="margin:6px 0 0;font-size:22px;font-weight:700;">Nuevo reporte de inspección</h1>
                <div style="margin-top:6px;font-size:13px;opacity:.9;">Folio: <strong>${esc(folio)}</strong></div>
            </td>
        </tr>
        <tr>
            <td style="padding:24px 28px;">
                ${asuntoExtra ? `<p style="margin:0 0 14px;color:#1e293b;font-size:13px;background:#fef3c7;border-left:3px solid #f59e0b;padding:10px 12px;border-radius:4px;">${esc(asuntoExtra)}</p>` : ''}
                <table cellspacing="0" cellpadding="0" style="width:100%;font-size:13px;color:#1e293b;">
                    <tr>
                        <td style="padding:4px 0;width:130px;color:#64748b;">Fecha:</td>
                        <td style="padding:4px 0;font-weight:600;">${esc(fecha)}</td>
                    </tr>
                    <tr>
                        <td style="padding:4px 0;color:#64748b;">Tipo:</td>
                        <td style="padding:4px 0;font-weight:600;">${esc(report.tipo_inspeccion || '-')}</td>
                    </tr>
                    <tr>
                        <td style="padding:4px 0;color:#64748b;">Turno:</td>
                        <td style="padding:4px 0;font-weight:600;">${esc(report.turno || '-')}</td>
                    </tr>
                    <tr>
                        <td style="padding:4px 0;color:#64748b;">Pista:</td>
                        <td style="padding:4px 0;font-weight:600;">${esc(report.pista || '-')}</td>
                    </tr>
                    <tr>
                        <td style="padding:4px 0;color:#64748b;">Responsable:</td>
                        <td style="padding:4px 0;font-weight:600;">${esc(report.responsable || '-')}</td>
                    </tr>
                    <tr>
                        <td style="padding:4px 0;color:#64748b;">Estatus:</td>
                        <td style="padding:4px 0;">
                            <span style="display:inline-block;padding:3px 10px;border-radius:12px;font-size:11px;font-weight:700;${badgeFor(estatus)}">${esc(estatus)}</span>
                        </td>
                    </tr>
                </table>

                ${itemsTable}

                ${report.pdf_url ? `
                    <p style="margin:22px 0 0;font-size:13px;color:#334155;">
                        📎 El PDF completo del reporte se adjunta a este correo.<br>
                        También puedes consultarlo en línea:
                        <a href="${esc(report.pdf_url)}" style="color:#2563eb;text-decoration:underline;">abrir PDF</a>
                    </p>
                ` : '<p style="margin:22px 0 0;font-size:13px;color:#334155;">📎 PDF adjunto al correo.</p>'}
            </td>
        </tr>
        <tr>
            <td style="padding:14px 28px 22px;border-top:1px solid #e2e8f0;font-size:11px;color:#94a3b8;">
                Mensaje generado automáticamente por el sistema MHR · Operaciones AIFA. No respondas a este correo.
            </td>
        </tr>
    </table>
</body>
</html>`;
}

async function loadRecipients(supabase: any, override?: string[]): Promise<string[]> {
    if (Array.isArray(override) && override.length) {
        return override
            .map((e: string) => String(e || '').trim().toLowerCase())
            .filter((e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));
    }
    const { data, error } = await supabase
        .from('mhr_email_recipients')
        .select('email')
        .eq('activo', true);
    if (error) throw new Error('No se pudo leer mhr_email_recipients: ' + error.message);
    return (data || [])
        .map((r: any) => String(r.email || '').trim().toLowerCase())
        .filter((e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));
}

async function loadReport(supabase: any, reportId: string) {
    const { data: report, error: rErr } = await supabase
        .from('reports')
        .select('id, folio, fecha_local, created_at, tipo_inspeccion, turno, pista, responsable, cargo, pdf_url, estatus, observacion')
        .eq('id', reportId)
        .maybeSingle();
    if (rErr || !report) throw new Error('Reporte no encontrado: ' + (rErr?.message || reportId));

    const { data: items, error: iErr } = await supabase
        .from('report_inspection_items')
        .select('item_nombre, lugar, hallazgo, condicion, observaciones, prioridad, orden')
        .eq('report_id', reportId)
        .order('orden', { ascending: true });
    if (iErr) throw new Error('Items no disponibles: ' + iErr.message);

    return { report, items: items || [] };
}

serve(async (req: Request) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS });
    if (req.method !== 'POST')    return json({ ok: false, error: 'Method not allowed' }, 405);

    if (!RESEND_API_KEY) return json({ ok: false, error: 'RESEND_API_KEY no configurado' }, 500);

    let body: any;
    try { body = await req.json(); }
    catch { return json({ ok: false, error: 'JSON inválido' }, 400); }

    const reportId    = body?.reportId;
    const pdfBase64   = body?.pdfBase64;
    const pdfFilename = body?.pdfFilename || `reporte_${reportId || 'mhr'}.pdf`;
    const toOverride  = Array.isArray(body?.to) ? body.to : null;
    const asuntoExtra = body?.asuntoExtra || '';

    if (!reportId) return json({ ok: false, error: 'reportId requerido' }, 400);

    const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
        auth: { autoRefreshToken: false, persistSession: false }
    });

    try {
        const recipients = await loadRecipients(supabase, toOverride);
        if (!recipients.length) {
            return json({ ok: false, error: 'Sin destinatarios activos. Configúralos en admin-usuarios → Destinatarios de correo.' }, 400);
        }

        const { report, items } = await loadReport(supabase, reportId);

        const subject = `[MHR] Reporte ${report.folio || reportId} · ${report.tipo_inspeccion || 'Inspección'} · ${report.pista || ''}`.trim();
        const html    = buildHtmlEmail(report, items, asuntoExtra);

        const payload: any = {
            from: `${MAIL_FROM_NAME} <${MAIL_FROM}>`,
            to: recipients,
            subject,
            html
        };

        if (pdfBase64 && typeof pdfBase64 === 'string' && pdfBase64.length > 100) {
            payload.attachments = [{
                filename: pdfFilename,
                content:  pdfBase64
            }];
        }

        const resendResp = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${RESEND_API_KEY}`,
                'Content-Type':  'application/json'
            },
            body: JSON.stringify(payload)
        });

        const resendData = await resendResp.json().catch(() => ({}));
        const resendId   = resendData?.id || null;
        const ok         = resendResp.ok;

        // Log en bitácora — fire-and-forget
        try {
            await supabase.from('mhr_email_log').insert({
                report_id:     reportId,
                folio:         report.folio || null,
                destinatarios: recipients,
                asunto:        subject,
                resend_id:     resendId,
                ok,
                error_msg:     ok ? null : JSON.stringify(resendData).slice(0, 1000)
            });
        } catch (_logErr) { /* no bloquear por log */ }

        if (!ok) {
            return json({ ok: false, error: 'Resend respondió ' + resendResp.status, detail: resendData }, 502);
        }

        return json({ ok: true, id: resendId, recipients });
    } catch (err: any) {
        return json({ ok: false, error: err?.message || String(err) }, 500);
    }
});
