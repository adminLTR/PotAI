/**
 * Servicio de Machine Learning / IA
 * Maneja predicciones y recomendaciones del modelo de IA
 */

class MLService {
    /**
     * Predecir necesidad de riego
     * @param {Object} data - Datos de sensores y planta
     * @returns {Promise} Predicción de riego
     */
    async predictWatering(data) {
        try {
            const response = await apiService.mlRequest(
                API_CONFIG.ML.PREDICT_WATERING,
                {
                    humidity: data.humidity,
                    temperature: data.temperature,
                    light: data.light,
                    soilMoisture: data.soilMoisture,
                    plantType: data.plantType,
                    lastWatering: data.lastWatering
                }
            );

            if (response.success) {
                return {
                    success: true,
                    prediction: {
                        needsWater: response.data.needsWater,
                        waterAmount: response.data.waterAmount,
                        confidence: response.data.confidence,
                        nextWateringTime: response.data.nextWateringTime,
                        reason: response.data.reason
                    }
                };
            }

            return { success: false, message: 'Error en predicción de riego' };
        } catch (error) {
            console.error('Error en predicción de riego:', error);
            return { success: false, message: error.message };
        }
    }

    /**
     * Predecir salud de la planta
     * @param {Object} data - Datos históricos y actuales
     * @returns {Promise} Estado de salud
     */
    async predictHealth(data) {
        try {
            const response = await apiService.mlRequest(
                API_CONFIG.ML.PREDICT_HEALTH,
                {
                    plantId: data.plantId,
                    currentConditions: data.currentConditions,
                    historicalData: data.historicalData,
                    plantType: data.plantType
                }
            );

            if (response.success) {
                return {
                    success: true,
                    health: {
                        status: response.data.status, // 'healthy', 'warning', 'critical'
                        score: response.data.score, // 0-100
                        issues: response.data.issues || [],
                        recommendations: response.data.recommendations || []
                    }
                };
            }

            return { success: false, message: 'Error en predicción de salud' };
        } catch (error) {
            console.error('Error en predicción de salud:', error);
            return { success: false, message: error.message };
        }
    }

    /**
     * Obtener recomendaciones personalizadas
     * @param {Object} data - Datos de la planta y condiciones
     * @returns {Promise} Recomendaciones
     */
    async getRecommendations(data) {
        try {
            const response = await apiService.mlRequest(
                API_CONFIG.ML.GET_RECOMMENDATIONS,
                {
                    plantId: data.plantId,
                    plantType: data.plantType,
                    currentConditions: data.currentConditions,
                    goals: data.goals || ['health', 'growth']
                }
            );

            if (response.success) {
                return {
                    success: true,
                    recommendations: response.data.recommendations || []
                };
            }

            return { success: false, message: 'Error al obtener recomendaciones' };
        } catch (error) {
            console.error('Error al obtener recomendaciones:', error);
            return { success: false, message: error.message };
        }
    }

    /**
     * Analizar condiciones ambientales
     * @param {Object} conditions - Condiciones actuales
     * @returns {Promise} Análisis de condiciones
     */
    async analyzeConditions(conditions) {
        try {
            const response = await apiService.mlRequest(
                API_CONFIG.ML.ANALYZE_CONDITIONS,
                {
                    temperature: conditions.temperature,
                    humidity: conditions.humidity,
                    light: conditions.light,
                    soilMoisture: conditions.soilMoisture,
                    plantType: conditions.plantType
                }
            );

            if (response.success) {
                return {
                    success: true,
                    analysis: {
                        temperatureStatus: response.data.temperatureStatus,
                        humidityStatus: response.data.humidityStatus,
                        lightStatus: response.data.lightStatus,
                        soilMoistureStatus: response.data.soilMoistureStatus,
                        overallStatus: response.data.overallStatus,
                        warnings: response.data.warnings || [],
                        suggestions: response.data.suggestions || []
                    }
                };
            }

            return { success: false, message: 'Error al analizar condiciones' };
        } catch (error) {
            console.error('Error al analizar condiciones:', error);
            return { success: false, message: error.message };
        }
    }

    /**
     * Predecir momento óptimo de riego
     * @param {Object} data - Datos de la planta y predicciones meteorológicas
     * @returns {Promise} Momento óptimo
     */
    async predictOptimalWateringTime(data) {
        try {
            const response = await apiService.mlRequest(
                API_CONFIG.ML.PREDICT_OPTIMAL_TIME,
                {
                    plantId: data.plantId,
                    currentConditions: data.currentConditions,
                    weatherForecast: data.weatherForecast,
                    plantType: data.plantType
                }
            );

            if (response.success) {
                return {
                    success: true,
                    optimalTime: {
                        datetime: response.data.datetime,
                        timeRange: response.data.timeRange,
                        reason: response.data.reason,
                        waterAmount: response.data.waterAmount,
                        confidence: response.data.confidence
                    }
                };
            }

            return { success: false, message: 'Error al predecir momento óptimo' };
        } catch (error) {
            console.error('Error al predecir momento óptimo:', error);
            return { success: false, message: error.message };
        }
    }

    /**
     * Modo de simulación (para desarrollo sin backend)
     * @param {string} type - Tipo de predicción
     * @param {Object} data - Datos de entrada
     * @returns {Object} Datos simulados
     */
    simulate(type, data) {
        console.warn('Usando modo simulación - Conectar con backend real en producción');

        switch (type) {
            case 'watering':
                return {
                    success: true,
                    prediction: {
                        needsWater: Math.random() > 0.5,
                        waterAmount: Math.floor(Math.random() * 500) + 100,
                        confidence: 0.85,
                        nextWateringTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                        reason: 'Basado en humedad del suelo y temperatura ambiente'
                    }
                };

            case 'health':
                const statuses = ['healthy', 'warning', 'critical'];
                return {
                    success: true,
                    health: {
                        status: statuses[Math.floor(Math.random() * statuses.length)],
                        score: Math.floor(Math.random() * 100),
                        issues: ['Humedad ligeramente baja'],
                        recommendations: ['Aumentar frecuencia de riego', 'Verificar exposición solar']
                    }
                };

            default:
                return { success: false, message: 'Tipo de simulación no soportado' };
        }
    }
}

// Instancia global del servicio ML
const mlService = new MLService();
