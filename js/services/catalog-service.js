(function(){
  window.MHRCatalogService = {
    async getCatalogoAerolineas(client){
      var resp = await client
        .from('catalogo_aerolineas')
        .select('codigo_iata,codigo_oaci,nombre_aerolinea,logo_url')
        .order('nombre_aerolinea', { ascending: true });
      return (!resp.error && Array.isArray(resp.data)) ? resp.data : [];
    },
    async getUsoAerolineas(client){
      var resp = await client.from('fauna_reports').select('aerolinea').limit(5000);
      return (!resp.error && Array.isArray(resp.data)) ? resp.data : [];
    },
    async getPartesAvionActivas(client){
      var resp = await client
        .from('catalogo_partes_avion')
        .select('nombre,orden')
        .eq('activo', true)
        .order('orden', { ascending: true });
      return (!resp.error && Array.isArray(resp.data)) ? resp.data : [];
    }
  };
})();
