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
    },
    async getAllReportsByPistaWithPhotos(client, pista){
      // Obtiene todos los reportes de una pista (orden cronológico) con sus fotos
      // Devuelve mapa: catalogItemId → [{reportFolio, reportDate, photos:[{url,name}]}]
      try {
        var resp = await client
          .from('reports')
          .select('id, folio, fecha_local, created_at, report_inspection_items(item_catalogo_id, report_inspection_item_photos(*))')
          .eq('pista', pista)
          .order('created_at', { ascending: true });

        if (resp.error || !resp.data) return {};

        // Firmar URLs en paralelo
        var signTasks = [];
        resp.data.forEach(function(report) {
          (report.report_inspection_items || []).forEach(function(item) {
            (item.report_inspection_item_photos || []).forEach(function(photo) {
              if (!photo.storage_path) { photo.public_url = null; return; }
              var bucket = photo.bucket || 'report-evidencias';
              signTasks.push(
                client.storage.from(bucket).createSignedUrl(photo.storage_path, 3600)
                  .then(function(res) { photo.public_url = res.data ? res.data.signedUrl : null; })
                  .catch(function() { photo.public_url = null; })
              );
            });
          });
        });
        if (signTasks.length > 0) await Promise.all(signTasks);

        // Construir mapa por catalog item
        var photoMap = {};
        resp.data.forEach(function(report) {
          (report.report_inspection_items || []).forEach(function(item) {
            var cid = item.item_catalogo_id;
            if (!cid) return;
            var photos = (item.report_inspection_item_photos || [])
              .filter(function(p) { return !!p.public_url; })
              .map(function(p) { return { url: p.public_url, name: p.original_filename || 'Foto' }; });
            if (!photos.length) return;
            if (!photoMap[cid]) photoMap[cid] = [];
            photoMap[cid].push({
              reportFolio: report.folio || 'Sin folio',
              reportDate: report.fecha_local || report.created_at,
              photos: photos
            });
          });
        });

        return photoMap;
      } catch (e) {
        return {};
      }
    },
    async getLatestReportByPista(client, pista){
      // Obtener el último reporte para una pista específica con ítems y fotos
      try {
        var resp = await client
          .from('reports')
          .select('*, report_inspection_items(*, report_inspection_item_photos(*))')
          .eq('pista', pista)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (resp.data && Array.isArray(resp.data.report_inspection_items)) {
          // Filtrar ítems atendidos e ítem virtual de firmas
          resp.data.report_inspection_items = resp.data.report_inspection_items.filter(function(item) {
            try {
              return item.item_nombre !== '__firmas__'
                && (item.datos_extra || {}).followup_status !== 'Atendido satisfactoriamente';
            } catch (e) { return true; }
          });

          // Generar signed URLs en paralelo para todas las fotos (no requiere bucket público)
          var signTasks = [];
          resp.data.report_inspection_items.forEach(function(item) {
            var photos = Array.isArray(item.report_inspection_item_photos) ? item.report_inspection_item_photos : [];
            photos.forEach(function(photo) {
              if (!photo.storage_path) { photo.public_url = null; return; }
              var bucket = photo.bucket || 'report-evidencias';
              signTasks.push(
                client.storage.from(bucket).createSignedUrl(photo.storage_path, 3600)
                  .then(function(res) { photo.public_url = res.data ? res.data.signedUrl : null; })
                  .catch(function() { photo.public_url = null; })
              );
            });
          });
          if (signTasks.length > 0) await Promise.all(signTasks);
        }

        return resp;
      } catch (e) {
        return { data: null, error: e };
      }
    }
  };
})();
