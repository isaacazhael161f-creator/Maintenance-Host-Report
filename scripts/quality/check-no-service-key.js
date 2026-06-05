const fs = require('fs');

const html = fs.readFileSync('index.html', 'utf8');
if (/SUPABASE_SERVICE_KEY/.test(html) || /serviceSupabase/.test(html)) {
  console.error('❌ Se detectaron referencias prohibidas a Service Role en frontend.');
  process.exit(1);
}
console.log('✅ Seguridad frontend: sin Service Role Key expuesta.');
