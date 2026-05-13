# Migration Notes

## Fase 1 - Extracción de CSS embebido
- **Movido:** bloque `<style>` principal de `index.html`.
- **Origen:** `index.html` (cabecera, bloque CSS embebido).
- **Destino:** `assets/css/main.css`.
- **Compatibilidad:** se reemplazó por `<link rel="stylesheet" href="./assets/css/main.css">` manteniendo ruta relativa compatible con GitHub Pages.
- **No modificado intencionalmente:** lógica JavaScript, estructura de formularios, IDs, clases, atributos `data-*`, llamadas Supabase y handlers inline.
- **Pendiente siguiente fase:** segmentar `main.css` en `layout/forms/tables/dashboard` sin alterar cascade.
