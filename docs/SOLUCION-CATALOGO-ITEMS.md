# Resolución: Error de Catálogo de Inspección

## Problema
El error "No se pudo cargar el catálogo de inspección (catalogo_items_inspeccion)" ocurre porque la tabla `catalogo_items_inspeccion` no existe en tu base de datos de Supabase.

## Solución Implementada (Temporal)

He agregado un **fallback con datos de muestra** en el código. Esto permite que la aplicación funcione inmediatamente con una estructura jerárquica de elementos de inspección:

### Estructura de Datos:
- **Categorías**: Pista, Hangares, Sistemas
- **Items**: Condición del Asfalto, Marcas, Iluminación, etc.
- **Hallazgos**: Grietas, Hundimientos, Baches, etc.

**Esta solución es funcional pero temporal.** Los datos se cargan desde el frontend, no desde la base de datos.

## Solución Permanente

Para crear la tabla correctamente en Supabase y tener los datos en la BD:

### Opción 1: Usar el Script SQL Automatizado
1. Ve a tu proyecto Supabase en [https://supabase.com](https://supabase.com)
2. Abre la consola SQL (SQL Editor)
3. Copia y ejecuta el contenido del archivo: `docs/sql-setup-catalogo-items.sql`
4. La tabla se creará con estructura, índices, RLS y datos de ejemplo

### Opción 2: Crear Manualmente
1. En Supabase, ve a la sección "Tables"
2. Crea una nueva tabla llamada `catalogo_items_inspeccion` con estas columnas:
   - `id` (TEXT, Primary Key)
   - `clave` (TEXT, Unique)
   - `nombre` (TEXT)
   - `orden` (INTEGER)
   - `activo` (BOOLEAN)
   - `parent_id` (TEXT, nullable, Foreign Key a id)
   - `tipo` (TEXT) - valores: 'CATEGORIA', 'ITEM', 'HALLAZGO'
   - `nivel` (INTEGER)
3. Crea índices en: `parent_id`, `activo`, `tipo`
4. Habilita RLS y permite lectura pública
5. Inserta los datos del script SQL

### Opción 3: Personalizar los Datos
Si necesitas diferentes categorías/items:
1. Modifica el script `docs/sql-setup-catalogo-items.sql`
2. O edita directamente el array de fallback en `js/pages/revision-item-composer-page.js` línea 351-366

## Cambios Realizados

### Archivo: `js/pages/revision-item-composer-page.js`
- ✅ Agregado fallback con datos de muestra (línea 351-366)
- ✅ La aplicación ahora muestra los items aunque la tabla no exista en Supabase
- ✅ Se registran errores en la consola para debugging
- ✅ El código automáticamente usa datos reales si la tabla existe

### Archivo Nuevo: `docs/sql-setup-catalogo-items.sql`
- ✅ Script SQL completo para crear la tabla
- ✅ Incluye estructura, índices, RLS y datos de ejemplo
- ✅ Listo para ejecutar en Supabase SQL Console

## Verificar que Funciona

1. Abre la aplicación en tu navegador
2. Ve a la sección "Item" del formulario de inspección
3. Verifica que el dropdown muestre categorías y items
4. Si todo funciona, ya está solucionado ✅

## Próximos Pasos Recomendados

1. **Corto plazo**: Usa el fallback actual (ya funciona)
2. **Mediano plazo**: Ejecuta el script SQL para tener los datos en Supabase
3. **Largo plazo**: Personaliza los datos según tus necesidades reales de inspección

¿Necesitas ayuda con alguno de estos pasos?
