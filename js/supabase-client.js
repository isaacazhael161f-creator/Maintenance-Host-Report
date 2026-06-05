(function () {
    // Configuración de Supabase (solo cliente público, sin service role en frontend)
    var RUNTIME_CONFIG = window.__MHR_CONFIG || {};
    var APP_CONFIG = {
        supabaseUrl: RUNTIME_CONFIG.supabaseUrl || 'https://fgstncvuuhpgyzmjceyr.supabase.co',
        supabaseAnonKey: RUNTIME_CONFIG.supabaseAnonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZnc3RuY3Z1dWhwZ3l6bWpjZXlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4NzQ0NDQsImV4cCI6MjA4MTQ1MDQ0NH0.YEDIKuWt5iKUEI0BAvidINUz0aZBvQM0h6XRJ-uslB8',
        // Opcional para producción: Edge Function que devuelva { signedUrl }
        signedUrlFunction: RUNTIME_CONFIG.signedUrlFunction || 'mhr-signed-url',
        signedUrlExpiresIn: Number(RUNTIME_CONFIG.signedUrlExpiresIn || 3600)
    };

    var supabase = null;
    try {
        supabase = window.supabase.createClient(APP_CONFIG.supabaseUrl, APP_CONFIG.supabaseAnonKey);
        window.supabaseClient = supabase; // Exponer cliente globalmente
    } catch (e) {
        console.error('Error inicializando Supabase:', e);
        return;
    }

    function isSafeStoragePath(path) {
        if (!path || typeof path !== 'string') return false;
        if (path.includes('..') || path.includes('\\') || path.startsWith('/')) return false;
        return true;
    }

    async function resolvePdfUrl(bucketName, filePath, ttlSeconds) {
        if (!filePath || !isSafeStoragePath(filePath)) return null;

        var expiresIn = Number(ttlSeconds || APP_CONFIG.signedUrlExpiresIn || 3600);
        if (!Number.isFinite(expiresIn) || expiresIn <= 0) expiresIn = 3600;

        // 1) Estrategia recomendada: Edge Function (backend) para generar signed URLs.
        try {
            if (APP_CONFIG.signedUrlFunction) {
                var fnResp = await supabase.functions.invoke(APP_CONFIG.signedUrlFunction, {
                    body: { bucket: bucketName, path: filePath, expiresIn: expiresIn }
                });
                if (!fnResp.error && fnResp.data && fnResp.data.signedUrl) return fnResp.data.signedUrl;
            }
        } catch (e) { }

        // 2) Fallback: Signed URL con cliente autenticado (requiere políticas RLS adecuadas).
        try {
            var signedResp = await supabase.storage.from(bucketName).createSignedUrl(filePath, expiresIn);
            if (!signedResp.error && signedResp.data && signedResp.data.signedUrl) return signedResp.data.signedUrl;
        } catch (e) { }

        // 3) Último fallback: URL pública si el bucket es público.
        try {
            var publicResp = supabase.storage.from(bucketName).getPublicUrl(filePath);
            if (publicResp && publicResp.data && publicResp.data.publicUrl) return publicResp.data.publicUrl;
        } catch (e) { }

        return null;
    }

    window.MHRSupabaseHelpers = {
        APP_CONFIG: APP_CONFIG,
        isSafeStoragePath: isSafeStoragePath,
        resolvePdfUrl: resolvePdfUrl
    };
})();
