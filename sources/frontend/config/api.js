/**
 * Configuración de endpoints de la API
 * Ajusta estas URLs según tu entorno de desarrollo/producción
 */

const API_CONFIG = {
    // URL base del API Gateway (punto de entrada único)
    BASE_URL: 'http://localhost:8080',

    // Timeout para las peticiones (en milisegundos)
    TIMEOUT: 30000,

    // Endpoints de autenticación (ruteados a auth-service:3001)
    AUTH: {
        LOGIN: '/auth/login',
        REGISTER: '/auth/register',
        LOGOUT: '/auth/logout',
        REFRESH_TOKEN: '/auth/refresh',
        VERIFY_TOKEN: '/auth/verify',
        ME: '/auth/me'
    },

    // Endpoints de usuario (ruteados a auth-service:3001)
    USER: {
        PROFILE: '/auth/profile',
        UPDATE_PROFILE: '/auth/profile/update',
        GET_POTS: '/auth/user/pots'
    },

    // Endpoints de plantas (ruteados a plants-service:3002)
    PLANTS: {
        GET_ALL: '/plants',
        GET_BY_ID: '/plants/:id',
        CREATE: '/plants',
        UPDATE: '/plants/:id',
        DELETE: '/plants/:id',
        GET_SENSORS: '/plants/:id/sensors',
        GET_HISTORY: '/plants/:id/history'
    },

    // Endpoints de macetas/pots (ruteados a pots-service:3003)
    POTS: {
        GET_ALL: '/pots',
        GET_BY_ID: '/pots/:id',
        CREATE: '/pots',
        UPDATE: '/pots/:id',
        DELETE: '/pots/:id',
        LINK_TO_PLANT: '/pots/:id/link'
    },

    // Endpoints de IoT/sensores (ruteados a iot-service:3004)
    IOT: {
        GET_CURRENT: '/iot/sensors/:potId/current',
        GET_HISTORICAL: '/iot/sensors/:potId/historical',
        INGEST_DATA: '/iot/data',
        GET_READINGS: '/iot/sensors/:potId/readings'
    },

    // Endpoints de riego (ruteados a iot-service:3004)
    IRRIGATION: {
        GET_HISTORY: '/iot/irrigation/:potId/history',
        CREATE_RECORD: '/iot/irrigation/:potId/record',
        GET_SCHEDULE: '/iot/irrigation/:potId/schedule'
    },

    // Endpoints de especies (ruteados a species-service:3006)
    SPECIES: {
        GET_ALL: '/species',
        GET_BY_ID: '/species/:id',
        SEARCH: '/species/search'
    },

    // Endpoints de media/imágenes (ruteados a media-service:3005)
    MEDIA: {
        UPLOAD: '/media/upload',
        GET_IMAGE: '/media/:filename',
        DELETE: '/media/:filename'
    },

    // Endpoints del modelo ML (ruteados a ml-service:5000)
    ML: {
        PREDICT_WATERING: '/ml/predict/watering',
        PREDICT_HEALTH: '/ml/predict/health',
        GET_RECOMMENDATIONS: '/ml/recommendations',
        ANALYZE_CONDITIONS: '/ml/analyze/conditions',
        PREDICT_OPTIMAL_TIME: '/ml/predict/optimal-time'
    }
};

// Función helper para reemplazar parámetros en URLs
function buildUrl(endpoint, params = {}) {
    let url = endpoint;
    Object.keys(params).forEach(key => {
        url = url.replace(`:${key}`, params[key]);
    });
    return url;
}

// Exportar configuración
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { API_CONFIG, buildUrl };
}
