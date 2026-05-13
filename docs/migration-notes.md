# Migration Notes

## Fase 1 - Extracción y modularización inicial de CSS
- **Movido:** bloque `<style>` principal de `index.html`.
- **Origen:** `index.html` (cabecera, bloque CSS embebido).
- **Destino inicial:** `assets/css/main.css`.
- **Subfase actual:** `main.css` se convirtió en agregador con imports y se segmentó por responsabilidad:
  - `assets/css/layout.css`
  - `assets/css/forms.css`
  - `assets/css/tables.css`
  - `assets/css/dashboard.css`
- **Compatibilidad:** `index.html` mantiene `<link rel="stylesheet" href="./assets/css/main.css">` con rutas relativas para GitHub Pages.
- **No modificado intencionalmente:** lógica JavaScript, estructura de formularios, IDs, clases, atributos `data-*`, llamadas Supabase y handlers inline.
- **Pendiente siguiente fase:** extracción controlada de JavaScript por dominio funcional (sin romper `window.*` de compatibilidad temporal).

## Fase 2 - Separación controlada de JavaScript (inicio)
- **Movido:** gestor de firmas (canvas + guardar/limpiar/toggle + inicialización).
- **Origen:** bloque `<script>` inline en `index.html`.
- **Destino:** `js/ui/signature-manager.js`.
- **Compatibilidad mantenida:** se conservan funciones globales requeridas por HTML inline (`window.guardarFirma`, `window.limpiarFirma`, `window.obtenerFirmas`, `window.obtenerFirmasFauna`, `window.toggleFirmas`, `window.toggleFirmasFauna`).
- **No modificado intencionalmente:** reglas de negocio, payloads de reportes, consultas Supabase y estructura de formularios.
