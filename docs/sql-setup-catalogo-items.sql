-- Script para crear la tabla catalogo_items_inspeccion en Supabase
-- Ejecutar en la consola SQL de Supabase

CREATE TABLE IF NOT EXISTS public.catalogo_items_inspeccion (
    id TEXT PRIMARY KEY,
    clave TEXT NOT NULL UNIQUE,
    nombre TEXT NOT NULL,
    orden INTEGER NOT NULL DEFAULT 0,
    activo BOOLEAN NOT NULL DEFAULT true,
    parent_id TEXT REFERENCES public.catalogo_items_inspeccion(id) ON DELETE SET NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('CATEGORIA', 'ITEM', 'HALLAZGO')),
    nivel INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_catalogo_items_parent_id ON public.catalogo_items_inspeccion(parent_id);
CREATE INDEX IF NOT EXISTS idx_catalogo_items_activo ON public.catalogo_items_inspeccion(activo);
CREATE INDEX IF NOT EXISTS idx_catalogo_items_tipo ON public.catalogo_items_inspeccion(tipo);

-- Configurar RLS (Row Level Security) - Permitir lectura a usuarios autenticados
ALTER TABLE public.catalogo_items_inspeccion ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access" ON public.catalogo_items_inspeccion
    FOR SELECT USING (true);

-- Insertar datos de ejemplo
INSERT INTO public.catalogo_items_inspeccion (id, clave, nombre, orden, activo, parent_id, tipo, nivel)
VALUES 
    -- Categoría: Pista
    ('1', 'CAT_PISTA', 'Pista', 1, true, NULL, 'CATEGORIA', 0),
    -- Items de Pista
    ('1-1', 'ITEM_ASFALTO', 'Condición del Asfalto', 1, true, '1', 'ITEM', 1),
    ('1-2', 'ITEM_MARCAS', 'Marcas y Señalización', 2, true, '1', 'ITEM', 1),
    ('1-3', 'ITEM_ILUMINACION', 'Iluminación', 3, true, '1', 'ITEM', 1),
    ('1-4', 'ITEM_DRENAJE', 'Sistema de Drenaje', 4, true, '1', 'ITEM', 1),
    ('1-5', 'ITEM_OBSTACULOS', 'Obstáculos en Pista', 5, true, '1', 'ITEM', 1),
    -- Hallazgos para Asfalto
    ('1-1-1', 'HALL_GRIETAS', 'Grietas', 1, true, '1-1', 'HALLAZGO', 2),
    ('1-1-2', 'HALL_HUNDIMIENTOS', 'Hundimientos', 2, true, '1-1', 'HALLAZGO', 2),
    ('1-1-3', 'HALL_BACHES', 'Baches', 3, true, '1-1', 'HALLAZGO', 2),
    -- Hallazgos para Marcas
    ('1-2-1', 'HALL_DESGASTE_MARCAS', 'Desgaste de Marcas', 1, true, '1-2', 'HALLAZGO', 2),
    ('1-2-2', 'HALL_MARCAS_FALTANTES', 'Marcas Faltantes', 2, true, '1-2', 'HALLAZGO', 2),
    -- Hallazgos para Iluminación
    ('1-3-1', 'HALL_LUCES_DAÑADAS', 'Luces Dañadas', 1, true, '1-3', 'HALLAZGO', 2),
    ('1-3-2', 'HALL_LUCES_FALTANTES', 'Luces Faltantes', 2, true, '1-3', 'HALLAZGO', 2),
    
    -- Categoría: Hangares
    ('2', 'CAT_HANGARES', 'Hangares', 2, true, NULL, 'CATEGORIA', 0),
    -- Items de Hangares
    ('2-1', 'ITEM_TECHO', 'Estructura de Techo', 1, true, '2', 'ITEM', 1),
    ('2-2', 'ITEM_PUERTAS', 'Puertas y Accesos', 2, true, '2', 'ITEM', 1),
    ('2-3', 'ITEM_PISOS', 'Pisos', 3, true, '2', 'ITEM', 1),
    -- Hallazgos para Techo
    ('2-1-1', 'HALL_FUGAS', 'Fugas de Agua', 1, true, '2-1', 'HALLAZGO', 2),
    ('2-1-2', 'HALL_ESTRUCTURA_DAÑADA', 'Estructura Dañada', 2, true, '2-1', 'HALLAZGO', 2),
    -- Hallazgos para Puertas
    ('2-2-1', 'HALL_PUERTAS_DAÑADAS', 'Puertas Dañadas', 1, true, '2-2', 'HALLAZGO', 2),
    ('2-2-2', 'HALL_CERRADURAS_DAÑADAS', 'Cerraduras Dañadas', 2, true, '2-2', 'HALLAZGO', 2),
    
    -- Categoría: Sistemas
    ('3', 'CAT_SISTEMAS', 'Sistemas', 3, true, NULL, 'CATEGORIA', 0),
    -- Items de Sistemas
    ('3-1', 'ITEM_AGUA', 'Sistema de Agua', 1, true, '3', 'ITEM', 1),
    ('3-2', 'ITEM_ELECTRICIDAD', 'Sistema Eléctrico', 2, true, '3', 'ITEM', 1),
    -- Hallazgos para Agua
    ('3-1-1', 'HALL_FUGAS_AGUA', 'Fugas de Agua', 1, true, '3-1', 'HALLAZGO', 2),
    ('3-1-2', 'HALL_BOMBAS_DAÑADAS', 'Bombas Dañadas', 2, true, '3-1', 'HALLAZGO', 2),
    -- Hallazgos para Electricidad
    ('3-2-1', 'HALL_CABLES_DAÑADOS', 'Cables Dañados', 1, true, '3-2', 'HALLAZGO', 2),
    ('3-2-2', 'HALL_TRANSFORMADORES_PROBLEMA', 'Problemas en Transformadores', 2, true, '3-2', 'HALLAZGO', 2)
ON CONFLICT (id) DO NOTHING;
