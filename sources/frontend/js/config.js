// Configuración del backend
const API_CONFIG = {
    BASE_URL: 'http://192.168.80.1:5000',
    ENDPOINTS: {
        REGISTER: '/auth/register',
        LOGIN: '/auth/login',
        LOGOUT: '/auth/logout',
        PLANTS: '/plants',
        POTS: '/pots/create',
        RECOGNITION: '/recognition',
        IOT: '/iot/sensor-data'
    }
};

// Función helper para construir URLs completas
function getApiUrl(endpoint) {
    return API_CONFIG.BASE_URL + endpoint;
}
