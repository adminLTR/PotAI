/**
 * Servicio de Autenticación
 * Maneja login, registro y gestión de sesiones
 */

class AuthService {
    /**
     * Iniciar sesión
     */
    async login(email, password) {
        try {
            const response = await apiService.post(API_CONFIG.AUTH.LOGIN, {
                email,
                password
            });

            if (response.success && response.data) {
                // Guardar datos del usuario y token
                const userData = {
                    ...response.data.user,
                    token: response.data.token,
                    timestamp: new Date().toISOString()
                };

                localStorage.setItem('currentUser', JSON.stringify(userData));
                return { success: true, data: userData };
            }

            return { success: false, message: response.message || 'Error al iniciar sesión' };
        } catch (error) {
            console.error('Error en login:', error);
            return { success: false, message: error.message };
        }
    }

    /**
     * Registrar nuevo usuario
     */
    async register(name, email, password) {
        try {
            const response = await apiService.post(API_CONFIG.AUTH.REGISTER, {
                name,
                email,
                password
            });

            if (response.success) {
                // Guardar datos del registro
                const registerData = {
                    name,
                    email,
                    registeredAt: new Date().toISOString()
                };
                localStorage.setItem('registeredUser', JSON.stringify(registerData));

                return { success: true, data: response.data };
            }

            return { success: false, message: response.message || 'Error al registrar usuario' };
        } catch (error) {
            console.error('Error en registro:', error);
            return { success: false, message: error.message };
        }
    }

    /**
     * Cerrar sesión
     */
    async logout() {
        try {
            // Intentar cerrar sesión en el servidor
            await apiService.post(API_CONFIG.AUTH.LOGOUT);
        } catch (error) {
            console.error('Error al cerrar sesión en servidor:', error);
        } finally {
            // Limpiar datos locales siempre
            localStorage.removeItem('currentUser');
            localStorage.removeItem('userPlants');
            window.location.href = '/index.html';
        }
    }

    /**
     * Verificar si el usuario está autenticado
     */
    isAuthenticated() {
        const user = localStorage.getItem('currentUser');
        if (!user) return false;

        try {
            const userData = JSON.parse(user);
            return !!userData.token;
        } catch (error) {
            return false;
        }
    }

    /**
     * Obtener datos del usuario actual
     */
    getCurrentUser() {
        const user = localStorage.getItem('currentUser');
        if (!user) return null;

        try {
            return JSON.parse(user);
        } catch (error) {
            return null;
        }
    }

    /**
     * Verificar token con el servidor
     */
    async verifyToken() {
        try {
            const response = await apiService.post(API_CONFIG.AUTH.VERIFY_TOKEN);
            return response.valid === true;
        } catch (error) {
            console.error('Error al verificar token:', error);
            return false;
        }
    }

    /**
     * Actualizar perfil de usuario
     */
    async updateProfile(data) {
        try {
            const response = await apiService.put(API_CONFIG.USER.UPDATE_PROFILE, data);

            if (response.success) {
                // Actualizar datos locales
                const currentUser = this.getCurrentUser();
                if (currentUser) {
                    const updatedUser = {
                        ...currentUser,
                        ...response.data
                    };
                    localStorage.setItem('currentUser', JSON.stringify(updatedUser));
                }
            }

            return response;
        } catch (error) {
            console.error('Error al actualizar perfil:', error);
            return { success: false, message: error.message };
        }
    }
}

// Instancia global del servicio de autenticación
const authService = new AuthService();
