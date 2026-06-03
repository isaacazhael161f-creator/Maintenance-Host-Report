// Script para crear los buckets de almacenamiento en Supabase
// Buckets: 'reports' (PDFs de inspección) y 'report-evidencias' (fotos y firmas)
// Uso: definir variables de entorno SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY y ejecutar: node create_bucket.js

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Define SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY como variables de entorno antes de ejecutar.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false }
});

async function createBuckets() {
  const bucketsToCreate = [
    { id: 'reports', public: true, description: 'PDFs de reportes de inspección' },
    { id: 'report-evidencias', public: false, description: 'Fotos y firmas de reportes' },
  ];

  for (const bucket of bucketsToCreate) {
    console.log(`\nCreando bucket "${bucket.id}" (${bucket.description})...`);
    const { data, error } = await supabase.storage.createBucket(bucket.id, { public: bucket.public });
    if (error) {
      if (error.message && error.message.toLowerCase().includes('already')) {
        console.log(`  ⚠️  El bucket "${bucket.id}" ya existe.`);
      } else {
        console.error(`  ❌ Error al crear "${bucket.id}":`, error.message);
      }
    } else {
      console.log(`  ✅ Bucket "${bucket.id}" creado correctamente.`);
    }
  }

  console.log('\nVerificando buckets existentes...');
  const { data: existing, error: e2 } = await supabase.storage.listBuckets();
  if (e2) {
    console.error('No se pudo listar buckets:', e2.message);
    process.exit(1);
  }
  console.log('Buckets en el proyecto:', existing.map(b => b.id).join(', '));

  const missing = bucketsToCreate.filter(b => !existing.some(e => e.id === b.id));
  if (missing.length > 0) {
    console.error('\n❌ Faltan buckets:', missing.map(b => b.id).join(', '));
    console.error('Revisa los errores anteriores y vuelve a ejecutar.');
    process.exit(1);
  }
  console.log('\n✅ Todos los buckets están disponibles.');
  process.exit(0);
}

createBuckets().catch(e => { console.error('Excepción inesperada:', e); process.exit(1); });

