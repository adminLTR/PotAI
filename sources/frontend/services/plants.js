/**
 * Servicio de Macetas/Plantas
 * Maneja operaciones CRUD de plantas y datos de sensores
 */

class PlantService {
    /**
     * Obtener todas las macetas del usuario
     */
    async getUserPlants() {
        try {
            const response = await apiService.get(API_CONFIG.PLANTS.GET_ALL);

            if (response.success && response.data) {
                // Guardar en cache local
                localStorage.setItem('userPlants', JSON.stringify(response.data));
                return { success: true, data: response.data };
            }

            return { success: false, message: 'No se pudieron obtener las macetas' };
        } catch (error) {
            console.error('Error al obtener macetas:', error);

            // Intentar cargar del cache si hay error
            const cached = localStorage.getItem('userPlants');
            if (cached) {
                return { success: true, data: JSON.parse(cached), fromCache: true };
            }

            return { success: false, message: error.message };
        }
    }

    /**
     * Obtener una maceta por ID
     */
    async getPlantById(plantId) {
        try {
            const endpoint = buildUrl(API_CONFIG.PLANTS.GET_BY_ID, { id: plantId });
            const response = await apiService.get(endpoint);

            return response;
        } catch (error) {
            console.error('Error al obtener maceta:', error);
            return { success: false, message: error.message };
        }
    }

    /**
     * Crear nueva maceta
     */
    async createPlant(plantData) {
        try {
            const response = await apiService.post(API_CONFIG.PLANTS.CREATE, plantData);

            if (response.success) {
                // Actualizar cache local
                await this.getUserPlants();
            }

            return response;
        } catch (error) {
            console.error('Error al crear maceta:', error);
            return { success: false, message: error.message };
        }
    }

    /**
     * Actualizar maceta existente
     */
    async updatePlant(plantId, plantData) {
        try {
            const endpoint = buildUrl(API_CONFIG.PLANTS.UPDATE, { id: plantId });
            const response = await apiService.put(endpoint, plantData);

            if (response.success) {
                // Actualizar cache local
                await this.getUserPlants();
            }

            return response;
        } catch (error) {
            console.error('Error al actualizar maceta:', error);
            return { success: false, message: error.message };
        }
    }

    /**
     * Eliminar maceta
     */
    async deletePlant(plantId) {
        try {
            const endpoint = buildUrl(API_CONFIG.PLANTS.DELETE, { id: plantId });
            const response = await apiService.delete(endpoint);

            if (response.success) {
                // Actualizar cache local
                await this.getUserPlants();
            }

            return response;
        } catch (error) {
            console.error('Error al eliminar maceta:', error);
            return { success: false, message: error.message };
        }
    }

    /**
     * Obtener datos actuales de sensores
     * Usa IoT service a través del gateway
     */
    async getCurrentSensors(potId) {
        try {
            const endpoint = buildUrl(API_CONFIG.IOT.GET_CURRENT, { potId });
            const response = await apiService.get(endpoint);

            return response;
        } catch (error) {
            console.error('Error al obtener datos de sensores:', error);
            return { success: false, message: error.message };
        }
    }

    /**
     * Obtener histórico de sensores
     * Usa IoT service a través del gateway
     */
    async getSensorHistory(potId, filters = {}) {
        try {
            const endpoint = buildUrl(API_CONFIG.IOT.GET_HISTORICAL, { potId });
            const response = await apiService.get(endpoint, filters);

            return response;
        } catch (error) {
            console.error('Error al obtener histórico de sensores:', error);
            return { success: false, message: error.message };
        }
    }

    /**
     * Obtener histórico de riego
     * Usa IoT service a través del gateway
     */
    async getIrrigationHistory(potId, filters = {}) {
        try {
            const endpoint = buildUrl(API_CONFIG.IRRIGATION.GET_HISTORY, { potId });
            const response = await apiService.get(endpoint, filters);

            return response;
        } catch (error) {
            console.error('Error al obtener histórico de riego:', error);
            return { success: false, message: error.message };
        }
    }

    /**
     * Registrar nuevo evento de riego
     * Usa IoT service a través del gateway
     */
    async recordIrrigation(potId, irrigationData) {
        try {
            const endpoint = buildUrl(API_CONFIG.IRRIGATION.CREATE_RECORD, { potId });
            const response = await apiService.post(endpoint, irrigationData);

            return response;
        } catch (error) {
            console.error('Error al registrar riego:', error);
            return { success: false, message: error.message };
        }
    }

    /**
     * Obtener programación de riego
     * Usa IoT service a través del gateway
     */
    async getIrrigationSchedule(potId) {
        try {
            const endpoint = buildUrl(API_CONFIG.IRRIGATION.GET_SCHEDULE, { potId });
            const response = await apiService.get(endpoint);

            return response;
        } catch (error) {
            console.error('Error al obtener programación:', error);
            return { success: false, message: error.message };
        }
    }
}

// Instancia global del servicio de plantas
const plantService = new PlantService();
