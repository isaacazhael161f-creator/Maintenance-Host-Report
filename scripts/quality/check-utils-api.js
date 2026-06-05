const fs = require('fs');
const vm = require('vm');

const code = fs.readFileSync('js/mhr-utils.js', 'utf8');
const context = {
  window: {},
  document: {
    createDocumentFragment: () => ({ appendChild: () => {} })
  },
  setTimeout,
  clearTimeout
};
vm.createContext(context);
vm.runInContext(code, context);

const utils = context.window.MHRUtils;
const required = ['pad2', 'bindLockSelect', 'bindTurnoVisibility', 'debounce', 'renderRows'];
const missing = required.filter((k) => !utils || typeof utils[k] !== 'function');
if (missing.length) {
  console.error('❌ Faltan utilidades en MHRUtils:', missing.join(', '));
  process.exit(1);
}
console.log('✅ API MHRUtils completa:', required.join(', '));
