(function(){
  window.MHRUserService = {
    async fetchAppUsuarios(client, appKey){
      var r = await client.from('vw_app_usuarios').select('*');
      if (r.error) throw r.error;
      var users = r.data || [];
      // La relación es opcional durante el despliegue: si la migración aún no
      // está aplicada, MHR conserva exactamente el comportamiento anterior.
      if (!appKey) return users;
      var app = await client.from('aplicaciones').select('id').eq('clave', appKey).maybeSingle();
      if (app.error || !app.data) return users;
      var memberships = await client.from('usuarios_aplicaciones')
        .select('usuario_id, estado, rol, permisos')
        .eq('aplicacion_id', app.data.id).eq('estado', 'ACTIVO');
      if (memberships.error) return users;
      var allowed = {};
      (memberships.data || []).forEach(function (m) { allowed[m.usuario_id] = m; });
      return users.filter(function (u) {
        var id = u.user_id || u.usuario_id || u.id;
        var role = String(u.role || u.rol || '').toLowerCase();
        return !!allowed[id] || role === 'superuser' || role === 'superadmin';
      }).map(function (u) {
        var m = allowed[u.user_id || u.usuario_id || u.id];
        u.aplicacion = appKey;
        if (m.rol) u.role = m.rol;
        if (m.permisos) u.permisos_extra = Object.assign({}, u.permisos_extra || {}, m.permisos);
        return u;
      });
    },
    async findUsuarioByUsernameOrEmail(client, userValue){
      var r = await client
        .from('usuarios')
        .select('*')
        .or('username.eq.' + userValue + ',email.eq.' + userValue)
        .limit(1);
      if (r.error) throw r.error;
      return (r.data && r.data[0]) ? r.data[0] : null;
    },
    async getUserRole(client, userId){
      var mhrApp = await client.from('aplicaciones').select('id').eq('clave', 'MHR').maybeSingle();
      if (!mhrApp.error && mhrApp.data) {
        var mr = await client.from('usuarios_aplicaciones')
          .select('rol').eq('usuario_id', userId).eq('aplicacion_id', mhrApp.data.id)
          .eq('estado', 'ACTIVO').maybeSingle();
        if (!mr.error && mr.data && mr.data.rol) return String(mr.data.rol).trim();
      }
      var r = await client
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();
      var roleFromUserRoles = (!r.error && r.data && r.data.role) ? String(r.data.role).trim() : '';

      // La base es compartida por varias aplicaciones. SUPERADMIN es un rol
      // global y debe prevalecer aunque user_roles tenga el rol de otra app.
      var u = await client
        .from('usuarios')
        .select('role')
        .eq('id', userId)
        .maybeSingle();
      var roleFromUsuarios = (!u.error && u.data && u.data.role) ? String(u.data.role).trim() : '';
      if (roleFromUsuarios.toLowerCase() === 'superadmin' || roleFromUserRoles.toLowerCase() === 'superadmin') {
        return 'superadmin';
      }
      return roleFromUserRoles || roleFromUsuarios || null;
    },
    async getUserProfile(client, userId){
      var r = await client
        .from('profiles')
        .select('full_name, username, cargo')
        .eq('id', userId)
        .maybeSingle();
      if (r.error) return null;
      return r.data || null;
    }
  };
})();
