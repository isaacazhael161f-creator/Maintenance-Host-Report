const fs = require('fs');

const sw = fs.readFileSync('sw.js', 'utf8');
const required = ['./index.html', './js/mhr-utils.js'];
const missing = required.filter((item) => !sw.includes(`'${item}'`) && !sw.includes(`\"${item}\"`));
if (missing.length) {
  console.error('❌ Faltan assets requeridos en SW cache:', missing.join(', '));
  process.exit(1);
}
console.log('✅ Service Worker cache incluye assets clave:', required.join(', '));
