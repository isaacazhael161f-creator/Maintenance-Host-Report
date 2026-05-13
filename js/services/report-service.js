(function(){
  window.MHRReportService = {
    async getReportsOrdered(client){
      var resp = await client.from('reports').select('*').order('created_at', { ascending: false });
      if (resp.error) throw resp.error;
      return resp.data || [];
    },
    async insertReport(client, payload){
      return await client.from('reports').insert([payload]).select();
    },
    async insertReportSingle(client, payload){
      return await client.from('reports').insert([payload]).select().single();
    },
    async insertReportItems(client, itemsPayload){
      return await client.from('report_items').insert(itemsPayload);
    },
    async insertItemPhoto(client, payload){
      return await client.from('item_photos').insert([payload]);
    }
  };
})();
