// auth.js - Manejo de autenticación y sesiones

/**
 * Clase para manejar la autenticación y sesiones
 */
class AuthManager {
    constructor() {
        this.ACCESS_TOKEN_KEY = 'potai_access_token';
        this.SESSION_TOKEN_KEY = 'potai_session_token';
        this.USER_ID_KEY = 'potai_user_id';
        this.EXPIRES_AT_KEY = 'potai_expires_at';
    }

    /**
     * Guarda los datos de sesión en localStorage
     */
    saveSession(accessToken, sessionToken, expiresAt, userData = {}) {
        localStorage.setItem(this.ACCESS_TOKEN_KEY, accessToken);
        localStorage.setItem(this.SESSION_TOKEN_KEY, sessionToken);
        localStorage.setItem(this.EXPIRES_AT_KEY, expiresAt);
        
        if (userData.user_id) {
            localStorage.setItem(this.USER_ID_KEY, userData.user_id);
        }
        if (userData.username) {
            localStorage.setItem('potai_username', userData.username);
        }
        if (userData.email) {
            localStorage.setItem('potai_email', userData.email);
        }
    }

    /**
     * Obtiene el ID del usuario
     */
    getUserId() {
        return localStorage.getItem(this.USER_ID_KEY);
    }

    /**
     * Obtiene el nombre de usuario
     */
    getUsername() {
        return localStorage.getItem('potai_username');
    }

    /**
     * Obtiene el email del usuario
     */
    getUserEmail() {
        return localStorage.getItem('potai_email');
    }

    /**
     * Obtiene el access token
     */
    getAccessToken() {
        return localStorage.getItem(this.ACCESS_TOKEN_KEY);
    }

    /**
     * Obtiene el session token
     */
    getSessionToken() {
        return localStorage.getItem(this.SESSION_TOKEN_KEY);
    }

    /**
     * Verifica si el usuario está autenticado
     */
    isAuthenticated() {
        const token = this.getAccessToken();
        const expiresAt = localStorage.getItem(this.EXPIRES_AT_KEY);
        
        if (!token || !expiresAt) {
            return false;
        }

        // Verificar si la sesión ha expirado
        const now = new Date();
        const expiryDate = new Date(expiresAt);
        
        if (now >= expiryDate) {
            this.clearSession();
            return false;
        }

        return true;
    }

    /**
     * Limpia todos los datos de sesión
     */
    clearSession() {
        localStorage.removeItem(this.ACCESS_TOKEN_KEY);
        localStorage.removeItem(this.SESSION_TOKEN_KEY);
        localStorage.removeItem(this.USER_ID_KEY);
        localStorage.removeItem(this.EXPIRES_AT_KEY);
        localStorage.removeItem('potai_username');
        localStorage.removeItem('potai_email');
    }

    /**
     * Realiza logout en el backend y limpia la sesión local
     */
    async logout() {
        const accessToken = this.getAccessToken();
        const sessionToken = this.getSessionToken();

        if (accessToken && sessionToken) {
            try {
                const apiUrl = typeof getApiUrl === 'function'
                    ? getApiUrl(API_CONFIG.ENDPOINTS.LOGOUT)
                    : 'http://localhost:5000/auth/logout';

                await fetch(apiUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${accessToken}`
                    },
                    body: JSON.stringify({
                        session_token: sessionToken
                    })
                });
            } catch (error) {
                console.error('Error al hacer logout en el servidor:', error);
            }
        }

        this.clearSession();
    }

    /**
     * Obtiene los headers de autenticación para peticiones al backend
     */
    getAuthHeaders() {
        const token = this.getAccessToken();
        const sessionToken = this.getSessionToken();
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'X-Session-Token': sessionToken
        };
    }

    /**
     * Redirige al login si no está autenticado
     */
    requireAuth(redirectUrl = 'index.html') {
        if (!this.isAuthenticated()) {
            window.location.href = redirectUrl;
            return false;
        }
        return true;
    }
}

// Instancia global del AuthManager
const authManager = new AuthManager();

/**
 * Función para proteger páginas que requieren autenticación
 * Llamar al inicio de cada página protegida
 */
function protectPage() {
    return authManager.requireAuth();
}

/**
 * Función helper para hacer peticiones autenticadas
 */
async function authenticatedFetch(url, options = {}) {
    if (!authManager.isAuthenticated()) {
        console.error('❌ No autenticado en authenticatedFetch');
        throw new Error('No autenticado');
    }

    const token = authManager.getAccessToken();
    const sessionToken = authManager.getSessionToken();
    
    if (!token || !sessionToken) {
        console.error('❌ Tokens faltantes en authenticatedFetch');
        authManager.clearSession();
        window.location.href = 'index.html';
        throw new Error('Tokens inválidos');
    }

    const headers = {
        'Authorization': `Bearer ${token}`,
        'X-Session-Token': sessionToken,
        ...(options.headers || {})
    };

    const response = await fetch(url, {
        ...options,
        headers
    });

    // Si recibimos 401, la sesión expiró
    if (response.status === 401) {
        console.error('❌ Error 401 - Sesión inválida o expirada');
        const data = await response.json().catch(() => ({}));
        console.error('Detalles:', data);
        authManager.clearSession();
        alert('Tu sesión ha expirado. Por favor inicia sesión nuevamente.');
        window.location.href = 'index.html';
        throw new Error('Sesión expirada');
    }

    return response;
}
