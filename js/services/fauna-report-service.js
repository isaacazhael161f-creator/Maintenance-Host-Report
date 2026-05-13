(function(){
  window.MHRFaunaReportService = {
    async getHallazgosYears(client){
      var resp = await client
        .from('fauna_reports')
        .select('fecha_reporte')
        .eq('tipo_reporte', 'Rescate')
        .not('ubicacion_lat', 'is', null)
        .not('ubicacion_lng', 'is', null)
        .order('fecha_reporte', { ascending: false });
      if (resp.error) throw resp.error;
      return Array.from(new Set((resp.data || []).map(function (r) {
        return (r.fecha_reporte || '').toString().slice(0, 4);
      }).filter(Boolean)));
    },

    async getHallazgosMapData(client, filters){
      filters = filters || {};
      var query = client
        .from('fauna_reports')
        .select('id, folio, fecha_reporte, clase, especie, tipo_reporte, ubicacion_lat, ubicacion_lng, ubicacion_texto')
        .eq('tipo_reporte', 'Rescate')
        .not('ubicacion_lat', 'is', null)
        .not('ubicacion_lng', 'is', null)
        .order('fecha_reporte', { ascending: false });
      if (filters.year) query = query.gte('fecha_reporte', filters.year + '-01-01').lte('fecha_reporte', filters.year + '-12-31');
      if (filters.month && filters.year) {
        query = query.gte('fecha_reporte', filters.year + '-' + filters.month + '-01').lte('fecha_reporte', filters.year + '-' + filters.month + '-31');
      }
      if (filters.clase) query = query.eq('clase', filters.clase);
      if (filters.especie) query = query.eq('especie', filters.especie);
      var resp = await query;
      if (resp.error) throw resp.error;
      return resp.data || [];
    }
  };
})();
