# Nuevo Formato de Revisión - Seguimiento de Ítems

## Cambios Implementados

### 1. Carga Automática de Ítems del Reporte Anterior
**Archivo modificado:** `js/services/report-service.js`

Agregada nueva función:
```javascript
async getLatestReportByPista(client, pista)
```

Esta función:
- Obtiene el último reporte registrado para una pista específica
- Retorna todos los ítems de inspección de ese reporte
- Se ejecuta automáticamente cuando el usuario selecciona una pista

### 2. Interfaz Mejorada para Seguimiento
**Archivo modificado:** `js/pages/revision-item-composer-page.js`

#### 2.1 Presentación Visual de Ítems Heredados
Cuando se cargan ítems del reporte anterior:
- **Borde naranja destacado** (3px) indica que es un ítem de seguimiento
- **Fondo degradado amarillo/naranja** para diferenciación clara
- **Banner azul informativo** muestra "ÍTEM DE SEGUIMIENTO (Reporte Anterior)"
- **Sombra suave** para mejor profundidad visual

#### 2.2 Campos de Seguimiento Mejorados
Para cada ítem heredado, el usuario puede:

**Estado del Ítem:**
- ✓ Atendido satisfactoriamente
- ◆ Sigue activo / Pendiente

**Observaciones de Seguimiento:**
- Textarea para agregar notas sobre el estado actual
- Campo ubicado en sección destacada con fondo gris

#### 2.3 Información del Ítem Original
Se conservan todos los datos del reporte anterior:
- Lugar (ubicación)
- Hallazgo identificado
- Condición registrada
- Prioridad asignada
- Código de seguimiento

### 3. Flujo de Uso

```
1. Usuario selecciona una pista (radio button)
   ↓
2. Sistema carga automáticamente el último reporte de esa pista
   ↓
3. Se muestran los ítems pendientes del reporte anterior
   ↓
4. Usuario actualiza el estado de cada ítem:
   - Marca como "Atendido satisfactoriamente" si fue resuelto
   - O marca como "Sigue activo" si continúa pendiente
   ↓
5. Usuario agrrega observaciones de seguimiento
   ↓
6. Usuario puede agregar NUEVOS ítems (sin eliminar los heredados)
   ↓
7. Todos los datos se guardan juntos en el nuevo reporte
```

### 4. Datos Guardados

Cada ítem de seguimiento conserva:
```
{
  item_catalogo_id: "id del catálogo",
  lugar: "ubicación",
  hallazgo: "hallazgo original",
  condicion: "condición registrada",
  observaciones: "observaciones originales",
  prioridad: "prioridad",
  codigo_seguimiento: "código",
  followup_status: "Atendido satisfactoriamente | Sigue activo",
  followup_observaciones: "nuevas observaciones del seguimiento",
  historial_json: "historial de cambios",
  is_prefilled_from_previous: true
}
```

### 5. Características Clave

✅ **Carga automática** - Al seleccionar pista, se cargan datos previos  
✅ **No elimina ítems** - Los heredados se conservan y se actualizan  
✅ **Agregar nuevos** - Permite agregar nuevos ítems al lado de los heredados  
✅ **Estados claros** - Interfaz intuitiva para indicar si fue atendido o no  
✅ **Observaciones** - Campo para detallar el estado actual  
✅ **Historial** - Se mantiene registro de cambios (JSON)  
✅ **Diferenciación visual** - Ítems heredados se ven diferentes

## Estructura Técnica

### Tabla de Base de Datos Requerida
```sql
reports
├── id
├── pista (TEXT) -- Usado para búsqueda del último reporte
├── created_at
└── ...

report_inspection_items
├── id
├── report_id
├── item_catalogo_id
├── lugar
├── hallazgo
├── condicion
├── observaciones
├── prioridad
├── codigo_seguimiento
├── followup_status -- NUEVO
├── followup_observaciones -- NUEVO
└── ...
```

## Testing

Para verificar que funciona correctamente:

1. Crear un reporte con al menos 1 ítem para una pista
2. Guardar el reporte
3. Crear un nuevo reporte
4. Seleccionar la misma pista
5. Verificar que:
   - Se cargan los ítems del reporte anterior
   - Tienen el banner "ÍTEM DE SEGUIMIENTO"
   - Se pueden actualizar sus estados
   - Se pueden agregar nuevos ítems
   - Todo se guarda correctamente

## Notas de Migración

- Los reportes antiguos que no tengan `followup_status` y `followup_observaciones` serán cargados con estos campos vacíos
- Los usuarios deberán definir el nuevo estado al revisar
- La información original del ítem se preserva para referencia
