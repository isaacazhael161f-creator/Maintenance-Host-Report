(function(){
  function getCache() {
    window.faunaCatalogosCache = window.faunaCatalogosCache || {};
    return window.faunaCatalogosCache;
  }

  function getCatalogoCacheKey(tabla, filtros) {
    var key = tabla;
    if (filtros && typeof filtros === 'object') {
      var parts = Object.keys(filtros).sort().map(function(k){ return k + ':' + filtros[k]; });
      if (parts.length) key += '|' + parts.join('|');
    }
    return key;
  }

  function normalizarTextoCatalogo(valor) {
    return (valor || '').toString().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  }

  async function getCatalogoActivo(client, tabla, filtros) {
    if (!client) return [];
    var query = client.from(tabla).select('id, nombre').eq('activo', true).order('orden', { ascending: true });
    if (filtros && typeof filtros === 'object') {
      Object.keys(filtros).forEach(function(campo){
        if (filtros[campo] !== undefined && filtros[campo] !== null && filtros[campo] !== '') query = query.eq(campo, filtros[campo]);
      });
    }
    var res = await query;
    if (res.error) return [];
    return res.data || [];
  }

  async function cargarCatalogoSelect(client, tabla, selectElement, placeholder, filtros) {
    if (!selectElement) return;
    var valorActual = selectElement.value;
    selectElement.innerHTML = '';
    var placeholderOption = document.createElement('option');
    placeholderOption.value = '';
    placeholderOption.textContent = placeholder;
    selectElement.appendChild(placeholderOption);

    var cache = getCache();
    var cacheKey = getCatalogoCacheKey(tabla, filtros);
    var catalogo = cache[cacheKey];
    if (!catalogo) {
      catalogo = await getCatalogoActivo(client, tabla, filtros);
      cache[cacheKey] = catalogo;
    }

    var vistos = new Set();
    catalogo.forEach(function(item) {
      var nombre = (item && item.nombre ? item.nombre : '').toString().trim();
      if (!nombre) return;
      var key = normalizarTextoCatalogo(nombre);
      if (vistos.has(key)) return;
      vistos.add(key);
      var option = document.createElement('option');
      option.value = nombre;
      option.textContent = nombre;
      selectElement.appendChild(option);
    });

    if (valorActual && Array.prototype.some.call(selectElement.options, function(opt){ return opt.value === valorActual; })) {
      selectElement.value = valorActual;
    }
  }

  async function cargarEspeciesPorClase(client, selectClase, selectEspecie, placeholder) {
    if (!selectEspecie) return;
    var claseNombre = selectClase && selectClase.value ? selectClase.value : '';
    if (!claseNombre) return cargarCatalogoSelect(client, 'catalogo_especie', selectEspecie, placeholder);
    var cache = getCache();
    var clases = cache['catalogo_clase'] || await getCatalogoActivo(client, 'catalogo_clase');
    cache['catalogo_clase'] = clases;
    var clase = clases.find(function(item){ return normalizarTextoCatalogo(item.nombre) === normalizarTextoCatalogo(claseNombre); });
    if (!clase || !clase.id) return cargarCatalogoSelect(client, 'catalogo_especie', selectEspecie, placeholder);
    return cargarCatalogoSelect(client, 'catalogo_especie', selectEspecie, placeholder, { clase_id: clase.id });
  }

  window.MHRFaunaCatalogService = {
    getCatalogoCacheKey,
    normalizarTextoCatalogo,
    getCatalogoActivo,
    cargarCatalogoSelect,
    cargarEspeciesPorClase
  };
})();
