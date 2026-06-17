(function(){
  window.MHRFaunaReportService = {
    async insertFaunaReport(client, payload){
      var resp = await client.from('fauna_reports').insert([payload]).select();
      if (resp.error) throw resp.error;
      return resp.data || [];
    },
    async getHallazgosYears(client){
      var resp = await client
        .from('fauna_reports')
        .select('fecha_reporte')
        .not('ubicacion_lat', 'is', null)
        .not('ubicacion_lng', 'is', null)
        .order('fecha_reporte', { ascending: false });
      if (resp.error) throw resp.error;
      return Array.from(new Set((resp.data || []).map(function (r) {
        return (r.fecha_reporte || '').toString().slice(0, 4);
      }).filter(Boolean)));
    },



    async getAllFaunaReports(client){
      var resp = await client.from('fauna_reports').select('*');
      if (resp.error) throw resp.error;
      return resp.data || [];
    },

    async getFaunaReportsByFilters(client, filters){
      filters = filters || {};
      var q = client.from('fauna_reports').select('*');
      if (filters.fechaDesde) q = q.gte('fecha_reporte', filters.fechaDesde);
      if (filters.fechaHasta) q = q.lte('fecha_reporte', filters.fechaHasta);
      if (filters.clase) q = q.eq('clase', filters.clase);
      if (filters.especie) q = q.eq('especie', filters.especie);
      var resp = await q.order('created_at', { ascending: false });
      if (resp.error) throw resp.error;
      return resp.data || [];
    },
    async getHallazgosMapData(client, filters){
      filters = filters || {};
      var query = client
        .from('fauna_reports')
        .select('id, folio, fecha_reporte, clase, especie, tipo_reporte, ubicacion_lat, ubicacion_lng, ubicacion_texto')
        .not('ubicacion_lat', 'is', null)
        .not('ubicacion_lng', 'is', null)
        .order('fecha_reporte', { ascending: false });
      if (filters.tipo) query = query.eq('tipo_reporte', filters.tipo);
      if (filters.year) query = query.gte('fecha_reporte', filters.year + '-01-01').lte('fecha_reporte', filters.year + '-12-31');
      if (filters.month && filters.year) {
        var monthNum = Number(filters.month);
        var lastDay = new Date(Number(filters.year), monthNum, 0).getDate();
        var monthStart = filters.year + '-' + String(monthNum).padStart(2, '0') + '-01';
        var monthEnd = filters.year + '-' + String(monthNum).padStart(2, '0') + '-' + String(lastDay).padStart(2, '0');
        query = query.gte('fecha_reporte', monthStart).lte('fecha_reporte', monthEnd);
      }
      if (filters.clase) query = query.eq('clase', filters.clase);
      if (filters.especie) query = query.eq('especie', filters.especie);
      var resp = await query;
      if (resp.error) throw resp.error;
      return resp.data || [];
    }
  };
})();
