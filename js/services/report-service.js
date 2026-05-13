(function(){
  window.MHRReportService = {
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
