(function(){
  window.MHRUserService = {
    async fetchAppUsuarios(client){
      var r = await client.from('vw_app_usuarios').select('*');
      if (r.error) throw r.error;
      return r.data || [];
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
      var r = await client
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();
      if (r.error) return null;
      return r.data && r.data.role ? r.data.role : null;
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
