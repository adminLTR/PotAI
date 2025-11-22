/**
 * Servicio de Autenticación
 * Maneja login, registro y gestión de sesiones
 */

class AuthService {
    /**
     * Iniciar sesión
     */
    async login(username, password) {
        try {
            const response = await apiService.post(API_CONFIG.AUTH.LOGIN, {
                username,
                password
            });

            // El backend devuelve directamente los datos sin response.success
            if (response.user && response.accessToken) {
                // Guardar datos del usuario y tokens
                const userData = {
                    id: response.user.id,
                    username: response.user.username,
                    email: response.user.email,
                    isVerified: response.user.isVerified,
                    accessToken: response.accessToken,
                    sessionToken: response.sessionToken,
                    expiresAt: response.expiresAt,
                    loginAt: new Date().toISOString()
                };

                localStorage.setItem('currentUser', JSON.stringify(userData));
                return { success: true, data: userData, message: response.message };
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
    async register(username, email, password) {
        try {
            const response = await apiService.post(API_CONFIG.AUTH.REGISTER, {
                username,
                email,
                password
            });

            if (response.success) {
                // Guardar datos del registro
                const registerData = {
                    username,
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
            // Verificar que tenga accessToken y no haya expirado
            if (!userData.accessToken) return false;

            if (userData.expiresAt) {
                const expirationDate = new Date(userData.expiresAt);
                const now = new Date();
                return now < expirationDate;
            }

            return true;
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
