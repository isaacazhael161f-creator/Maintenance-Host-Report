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
      return await client.from('report_inspection_items').insert(itemsPayload).select();
    },
    async insertItemPhoto(client, payload){
      return await client.from('report_inspection_item_photos').insert([payload]);
    },
    async insertItemPhotosBulk(client, payloads){
      return await client.from('report_inspection_item_photos').insert(payloads);
    },
    async getReportWithInspectionData(client, reportId){
      return await client
        .from('reports')
        .select('*, report_inspection_items(*, report_inspection_item_photos(*))')
        .eq('id', reportId)
        .single();
    },
    async getReportWithInspectionDataHydrated(client, reportId){
      var resp = await this.getReportWithInspectionData(client, reportId);
      if (resp.error || !resp.data) return resp;
      var report = resp.data;
      var items = Array.isArray(report.report_inspection_items) ? report.report_inspection_items : [];
      items.forEach(function(item){
        var photos = Array.isArray(item.report_inspection_item_photos) ? item.report_inspection_item_photos : [];
        photos.forEach(function(photo){
          var bucket = photo.bucket || 'report-evidencias';
          var storagePath = photo.storage_path || '';
          var publicData = client.storage.from(bucket).getPublicUrl(storagePath);
          photo.public_url = publicData && publicData.data ? publicData.data.publicUrl : null;
        });
      });
      return { data: report, error: null };
    },
    async uploadToBucket(client, bucket, filename, blob, options){
      return await client.storage.from(bucket).upload(filename, blob, options || {});
    },
    getPublicUrl(client, bucket, filePath){
      return client.storage.from(bucket).getPublicUrl(filePath);
    }
  };
})();
