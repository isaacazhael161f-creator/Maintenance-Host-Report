# Implementación: Almacenamiento de Estado de Seguimiento en `datos_extra`

## Resumen

El estado de seguimiento ("Atendido satisfactoriamente" / "Sigue activo") se guarda en el campo JSONB `datos_extra` de la tabla `report_inspection_items`. Los ítems marcados como "Atendido" no se mostrarán en el siguiente reporte.

## Estructura de datos_extra

```json
{
  "followup_status": "Atendido satisfactoriamente",
  "followup_observaciones": "Observaciones adicionales sobre el seguimiento"
}
```

O para ítems pendientes:
```json
{
  "followup_status": "Sigue activo",
  "followup_observaciones": "Aún requiere atención"
}
```

## Flujo de Almacenamiento

### 1. **Captura de Datos**
**Archivos:**
- `js/pages/revision-page.js` (línea ~195)
- `js/pages/offline-report-sync-page.js` (línea ~170)

Se capturan estos campos dinámicos:
```javascript
var followupStatus = card.querySelector('.dynamic-followup-status');
var followupObs = card.querySelector('.dynamic-followup-observaciones');
```

Y se agregan al objeto `filled`:
```javascript
filled.push({ 
  id: itemId, 
  name: name, 
  fields: fields,
  followupStatus: followupStatus ? followupStatus.value : '',
  followupObs: followupObs ? followupObs.value : ''
});
```

### 2. **Construcción del Payload**
**Archivos:**
- `js/pages/revision-page.js` (línea ~268)
- `js/pages/offline-report-sync-page.js` (línea ~297)

Se construye `datos_extra` con el estado:
```javascript
var datosExtra = {};
if (f.followupStatus) datosExtra.followup_status = f.followupStatus;
if (f.followupObs) datosExtra.followup_observaciones = f.followupObs;

var itemPayload = {
  // ... otros campos ...
  datos_extra: Object.keys(datosExtra).length > 0 ? datosExtra : null
};
```

### 3. **Filtrado en el Siguiente Reporte**
**Archivo:** `js/services/report-service.js` (función `getLatestReportByPista()`)

Cuando se carga el reporte anterior, se filtran los ítems:
```javascript
// Filtrar ítems: solo mostrar aquellos que NO están marcados como "Atendido"
resp.data.report_inspection_items = resp.data.report_inspection_items.filter(function(item) {
  try {
    var extra = item.datos_extra || {};
    return extra.followup_status !== 'Atendido satisfactoriamente';
  } catch (e) {
    return true; // Si hay error, incluir por defecto
  }
});
```

## Comportamiento por Estado

### Estado: "Atendido satisfactoriamente"
✅ Se guarda en `datos_extra`  
✅ NO se muestra en el siguiente reporte  
✅ El ciclo de seguimiento se cierra  

**Ejemplo en BD:**
```json
datos_extra: {
  "followup_status": "Atendido satisfactoriamente",
  "followup_observaciones": "Se reparó el asfalto completamente"
}
```

### Estado: "Sigue activo"
✅ Se guarda en `datos_extra`  
✅ SÍ se muestra en el siguiente reporte  
✅ Continúa el seguimiento  

**Ejemplo en BD:**
```json
datos_extra: {
  "followup_status": "Sigue activo",
  "followup_observaciones": "Requiere seguimiento adicional, pendiente presupuesto"
}
```

## Archivos Modificados

| Archivo | Cambios | Línea |
|---------|---------|-------|
| `js/services/report-service.js` | Agregada función `getLatestReportByPista()` con filtro | ~52-67 |
| `js/pages/revision-page.js` | Captura de campos de seguimiento | ~195-202 |
| `js/pages/revision-page.js` | Construcción de `datos_extra` en payload | ~268-289 |
| `js/pages/offline-report-sync-page.js` | Captura de campos de seguimiento | ~170-195 |
| `js/pages/offline-report-sync-page.js` | Construcción de `datos_extra` en payload | ~297-308 |

## Consideraciones Técnicas

### Compatibilidad con Reportes Antiguos
- Si un ítem no tiene `datos_extra`, se considera como "pendiente" y se muestra
- Los reportes antiguos sin estado de seguimiento seguirán apareciendo hasta que se actualicen

### Validación
- El campo `dynamic-followup-status` es requerido (`required`), no puede estar vacío
- La opción "Seleccione estado" es `disabled`, fuerza seleccionar una opción válida

### Almacenamiento JSONB
- JSONB permite consultas eficientes: `WHERE datos_extra->>'followup_status' = 'Atendido satisfactoriamente'`
- Es flexible para agregar más datos en el futuro sin migrar esquema

## Consultas SQL Útiles

### Ver ítems atendidos
```sql
SELECT * FROM report_inspection_items 
WHERE datos_extra->>'followup_status' = 'Atendido satisfactoriamente';
```

### Ver ítems pendientes
```sql
SELECT * FROM report_inspection_items 
WHERE datos_extra->>'followup_status' = 'Sigue activo'
   OR datos_extra IS NULL
   OR datos_extra->>'followup_status' IS NULL;
```

### Estadísticas por estado
```sql
SELECT 
  datos_extra->>'followup_status' as estado,
  COUNT(*) as cantidad
FROM report_inspection_items
WHERE datos_extra IS NOT NULL
GROUP BY datos_extra->>'followup_status';
```

## Testing

1. Crear reporte con 2-3 ítems
2. Marcar uno como "Atendido", otro como "Sigue activo"
3. Guardar el reporte
4. Crear nuevo reporte en misma pista
5. **Resultado esperado:**
   - Solo aparece el ítem marcado como "Sigue activo"
   - El ítem "Atendido" no se muestra
   - Se puede agregar nuevos ítems

## Ventajas de esta Solución

✅ No requiere nuevas columnas en la tabla  
✅ Usa campo existente (`datos_extra`)  
✅ Flexible para agregar más datos de seguimiento en el futuro  
✅ Consultas JSONB son eficientes en PostgreSQL  
✅ Mantiene compatibilidad con datos antiguos  
✅ Funciona en modo online y offline  
