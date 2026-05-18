window.MHRAuthSessionPage = (function () {
  function init(ctx) {
    var supabase = ctx && ctx.supabase;
                var loginModal = document.getElementById('login-modal');
                var loginBtn = document.getElementById('login-btn');
                var emailInput = document.getElementById('login-email');
                var passInput = document.getElementById('login-password');
                var errorMsg = document.getElementById('login-error');
                var userInfo = document.getElementById('user-info');
                var userEmailSpan = document.getElementById('user-email');
                var userRoleSpan = document.getElementById('user-role');
                var logoutBtn = document.getElementById('logout-btn');
                var reportForm = document.getElementById('report-form');
                var reportHeader = document.querySelector('.report-header');
                var mainTitle = document.getElementById('main-title');
                
                var AUTH_STORAGE_KEY = 'mhr_current_user';
                
                if (reportForm) reportForm.style.display = 'none';
                if (reportHeader) reportHeader.style.display = 'none';
                if (mainTitle) mainTitle.style.display = 'none';
                document.body.classList.add('loading-auth');
                
                function normalizeText(value) {
                    return String(value || '').trim();
                }
                
                function getUserField(user, names, fallback) {
                    for (var i = 0; i < names.length; i++) {
                        if (user && user[names[i]] !== undefined && user[names[i]] !== null && user[names[i]] !== '') {
                            return user[names[i]];
                        }
                    }
                    return fallback || '';
                }
                
                function saveCurrentUser(user) {
                    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
                    window.currentUser = user;
                }
                
                function getCurrentUser() {
                    try {
                        var raw = localStorage.getItem(AUTH_STORAGE_KEY);
                        return raw ? JSON.parse(raw) : null;
                    } catch (e) {
                        return null;
                    }
                }
                
                function clearCurrentUser() {
                    localStorage.removeItem(AUTH_STORAGE_KEY);
                    window.currentUser = null;
                }
                
                function showLogin() {
                    if (loginModal) loginModal.style.display = 'flex';
                    if (userInfo) userInfo.style.display = 'none';
                    if (reportForm) reportForm.style.display = 'none';
                    if (reportHeader) reportHeader.style.display = 'none';
                    if (mainTitle) mainTitle.style.display = 'none';
                    document.body.classList.add('loading-auth');
                }
                
                function handleUser(user) {
                    if (!user) {
                        showLogin();
                        return;
                    }
                
                    var username =
                        user.username ||
                        user.email ||
                        (user.user_metadata && user.user_metadata.username) ||
                        'Usuario';
                
                    var fullName =
                        user.full_name ||
                        (user.user_metadata && user.user_metadata.full_name) ||
                        username;
                
                    var role =
                        sessionStorage.getItem('user_role') ||
                        user.role ||
                        (user.user_metadata && user.user_metadata.role) ||
                        'viewer';
                
                    if (role === 'authenticated') {
                        role = sessionStorage.getItem('user_role') || 'viewer';
                    }
                
                    role = String(role || 'viewer').toLowerCase();
                
                    if (loginModal) loginModal.style.display = 'none';
                    if (userInfo) userInfo.style.display = 'flex';
                    if (userEmailSpan) userEmailSpan.textContent = fullName || username;
                    if (userRoleSpan) userRoleSpan.textContent = role;
                
                    if (reportHeader) reportHeader.style.display = 'flex';
                    if (mainTitle) mainTitle.style.display = 'block';
                    document.body.classList.remove('loading-auth');
                
                    var allowedRoles = [
                        'admin',
                        'editor',
                        'inspector',
                        'superuser',
                        'control_fauna',
                        'servicio_medico',
                        'colab_editor'
                    ];
                
                    if (allowedRoles.includes(role)) {
                        if (reportForm) reportForm.style.display = 'block';
                    } else {
                        if (reportForm) reportForm.style.display = 'none';
                        alert('Tu usuario (' + role + ') no tiene permisos para llenar reportes.');
                    }
                
                    var adminPanel = document.getElementById('admin-panel');
                    if (adminPanel && ['admin', 'superuser'].includes(role)) {
                        adminPanel.style.display = 'block';
                        if (typeof loadAdminReports === 'function') {
                            loadAdminReports();
                        }
                    }
                }
                
                async function checkSession() {
                    var savedUser = getCurrentUser();
                
                    if (savedUser) {
                        handleUser(savedUser);
                    } else {
                        showLogin();
                    }
                }

                function safeJsonParse(value) {
                    if (!value) return null;
                    if (typeof value === 'object') return value;
                    try { return JSON.parse(value); } catch (_) { return null; }
                }

                function hasRevisionCrearPermission(permisosExtra) {
                    var permisos = safeJsonParse(permisosExtra) || {};
                    var acciones = (permisos && permisos.acciones) || {};
                    var revisionAcciones = acciones['revision-area-movimiento'];
                    if (!Array.isArray(revisionAcciones)) return false;
                    return revisionAcciones.map(function (x) { return String(x || '').toLowerCase(); }).includes('crear');
                }

                function belongsToGsoPath(pertenece) {
                    var perteneceObj = safeJsonParse(pertenece) || {};
                    var path = String((perteneceObj && perteneceObj.path) || '').trim().toLowerCase();
                    return path === 'dg.do.sd_so.gso';
                }

                async function loadRevisionResponsibleOptions() {
                    var select = document.getElementById('report-authors-select');
                    if (!select || !supabase) return;
                    try {
                        var usuarios = await window.MHRUserService.fetchAppUsuarios(supabase);

                        var usuariosFiltrados = (usuarios || []).filter(function (u) {
                            return belongsToGsoPath(u.pertenece) && hasRevisionCrearPermission(u.permisos_extra);
                        }).map(function (u) {
                            return (
                                u.full_name ||
                                u.nombre_completo ||
                                u.nombre ||
                                u.name ||
                                u.username ||
                                ''
                            ).trim();
                        }).filter(Boolean).sort(function (a, b) {
                            return a.localeCompare(b, 'es', { sensitivity: 'base' });
                        });

                        select.innerHTML = '<option value="">-- Seleccionar Responsable --</option>';
                        usuariosFiltrados.forEach(function (nombre) {
                            var option = document.createElement('option');
                            option.value = nombre;
                            option.textContent = nombre;
                            select.appendChild(option);
                        });
                    } catch (e) {
                        console.error('No se pudo cargar responsables desde vw_app_usuarios:', e);
                    }
                }
                
                async function loginWithUsuariosTable(usernameOrEmail, password) {
                    var userValue = String(usernameOrEmail || '').trim();
                    var passValue = String(password || '').trim();
                
                    if (!userValue || !passValue) {
                        throw new Error('Captura usuario y contraseña.');
                    }
                
                    var user = await window.MHRUserService.findUsuarioByUsernameOrEmail(supabase, userValue);

                    if (!user) {
                        throw new Error('Usuario no encontrado.');
                    }
                
                    if (user.estatus && String(user.estatus).toLowerCase() === 'baja') {
                        throw new Error('El usuario está dado de baja.');
                    }
                
                    if (String(user.password || '') !== String(passValue)) {
                        throw new Error('Credenciales incorrectas.');
                    }
                
                    sessionStorage.setItem('user_role', user.role || 'viewer');
                    sessionStorage.setItem('username', user.username || '');
                    sessionStorage.setItem('user_email', user.email || '');
                    sessionStorage.setItem('user_full_name', user.full_name || user.username || '');
                
                    return user;
                }
                
                if (loginBtn) {
                    loginBtn.addEventListener('click', async function () {
                
                        const originalUsername = (emailInput.value || '').trim();
                        let email = originalUsername;
                        const password = passInput.value || '';
                
                        errorMsg.style.display = 'none';
                        loginBtn.disabled = true;
                        loginBtn.textContent = 'Entrando...';
                
                        try {
                
                            if (email && !email.includes('@')) {
                                const normalized = email
                                    .trim()
                                    .toLowerCase()
                                    .normalize("NFD")
                                    .replace(/[\u0300-\u036f]/g, "")
                                    .replace(/\s+/g, '.');
                
                                email = `${normalized}@aifa.operaciones`;
                            }
                
                            var { data, error } = await supabase.auth.signInWithPassword({
                                email: email,
                                password: password
                            });
                
                            if (error) throw error;
                
                            sessionStorage.setItem('user', JSON.stringify(data.user));
                            sessionStorage.setItem('token', data.session.access_token);
                
                            let role = 'viewer';
                
                            try {
                                const userRole = await window.MHRUserService.getUserRole(supabase, data.user.id);
                                if (userRole) {
                                    role = userRole;
                                }
                
                            } catch (_) {}
                
                            sessionStorage.setItem('user_role', role);
                
                            handleUser({
                                ...data.user,
                                user_metadata: {
                                    ...(data.user.user_metadata || {}),
                                    role: role
                                }
                            });
                            loadRevisionResponsibleOptions();
                
                        } catch (error) {
                
                            errorMsg.textContent = 'Error: ' + error.message;
                            errorMsg.style.display = 'block';
                
                        } finally {
                
                            loginBtn.disabled = false;
                            loginBtn.textContent = 'Iniciar Sesión';
                
                        }
                
                    });
                }
                
                if (logoutBtn) {
                    logoutBtn.addEventListener('click', function () {
                        clearCurrentUser();
                        location.reload();
                    });
                }

                setTimeout(function () {
                    loadRevisionResponsibleOptions();
                }, 800);
                
                checkSession();
  }
  return { init: init };
})();
