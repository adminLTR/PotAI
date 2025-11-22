/**
 * Servicio base de API
 * Maneja todas las peticiones HTTP al backend
 */

class ApiService {
    constructor() {
        // Todo pasa por el API Gateway en puerto 8080
        this.baseUrl = API_CONFIG.BASE_URL;
        this.timeout = API_CONFIG.TIMEOUT;
    }

    /**
     * Obtener token de autenticación del localStorage
     */
    getAuthToken() {
        const user = localStorage.getItem('currentUser');
        if (user) {
            const userData = JSON.parse(user);
            return userData.accessToken || null;
        }
        return null;
    }

    /**
     * Configurar headers por defecto
     */
    getHeaders(customHeaders = {}) {
        const headers = {
            'Content-Type': 'application/json',
            ...customHeaders
        };

        const token = this.getAuthToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        return headers;
    }

    /**
     * Hacer petición HTTP genérica
     */
    async request(url, options = {}) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        try {
            const response = await fetch(url, {
                ...options,
                headers: this.getHeaders(options.headers),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            // Manejo de respuestas
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }

            // Intentar parsear JSON, si falla retornar texto
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                return await response.json();
            }
            return await response.text();

        } catch (error) {
            clearTimeout(timeoutId);

            if (error.name === 'AbortError') {
                throw new Error('La petición excedió el tiempo límite');
            }

            // Si el error es de autenticación, limpiar sesión
            if (error.message.includes('401') || error.message.includes('unauthorized')) {
                localStorage.removeItem('currentUser');
                window.location.href = '/index.html';
            }

            throw error;
        }
    }

    /**
     * Petición GET
     */
    async get(endpoint, params = {}) {
        const url = new URL(this.baseUrl + endpoint);
        Object.keys(params).forEach(key =>
            url.searchParams.append(key, params[key])
        );

        return this.request(url.toString(), {
            method: 'GET'
        });
    }

    /**
     * Petición POST
     */
    async post(endpoint, data = {}) {
        return this.request(this.baseUrl + endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    /**
     * Petición PUT
     */
    async put(endpoint, data = {}) {
        return this.request(this.baseUrl + endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    /**
     * Petición DELETE
     */
    async delete(endpoint) {
        return this.request(this.baseUrl + endpoint, {
            method: 'DELETE'
        });
    }

    /**
     * Peticiones al servicio de ML (a través del gateway)
     * El gateway enruta /ml/* al ml-service:5000
     */
    async mlRequest(endpoint, data = {}, method = 'POST') {
        return this.request(this.baseUrl + endpoint, {
            method: method,
            body: JSON.stringify(data)
        });
    }
}

// Instancia global del servicio
const apiService = new ApiService();
