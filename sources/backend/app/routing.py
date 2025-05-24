from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    # WebSocket para datos generales de sensores
    re_path(r'ws/sensor-data/$', consumers.SensorDataConsumer.as_asgi()),
    
    # WebSocket para monitoreo específico de planta
    re_path(r'ws/plant/(?P<plant_id>\w+)/$', consumers.PlantMonitorConsumer.as_asgi()),
]

'''
Código de Javascript (según Claude equisde):

// Cliente WebSocket para datos de sensores
class SensorWebSocket {
    constructor() {
        this.socket = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
    }

    connect() {
        // Usar ws:// para desarrollo local, wss:// para producción
        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${wsProtocol}//${window.location.host}/ws/sensor-data/`;
        
        this.socket = new WebSocket(wsUrl);

        this.socket.onopen = (event) => {
            console.log('WebSocket conectado');
            this.reconnectAttempts = 0;
            this.onConnect();
        };

        this.socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            console.log('Datos recibidos:', data);
            this.handleMessage(data);
        };

        this.socket.onclose = (event) => {
            console.log('WebSocket desconectado');
            this.onDisconnect();
            this.attemptReconnect();
        };

        this.socket.onerror = (error) => {
            console.error('Error en WebSocket:', error);
            this.onError(error);
        };
    }

    sendData(data) {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify(data));
        } else {
            console.error('WebSocket no está conectado');
        }
    }

    // Enviar datos de sensor (simular ESP32)
    sendSensorData(temperatura, humedad, luzIntensidad, plantaId = 1) {
        const data = {
            type: 'sensor_data',
            temperatura: temperatura,
            humedad: humedad,
            planta_id: plantaId,
            timestamp: new Date().toISOString()
        };
        this.sendData(data);
    }

    handleMessage(data) {
        switch(data.type) {
            case 'sensor_update':
                this.onSensorUpdate(data.data);
                break;
            case 'confirmation':
                this.onConfirmation(data);
                break;
            case 'error':
                this.onError(data);
                break;
            default:
                console.log('Mensaje no reconocido:', data);
        }
    }

    attemptReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`Intentando reconectar... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
            setTimeout(() => this.connect(), 2000 * this.reconnectAttempts);
        }
    }

    disconnect() {
        if (this.socket) {
            this.socket.close();
        }
    }

    // Callbacks que puedes sobrescribir
    onConnect() {
        console.log('Callback: Conectado');
    }

    onDisconnect() {
        console.log('Callback: Desconectado');
    }

    onSensorUpdate(data) {
        console.log('Callback: Datos del sensor actualizados:', data);
        // Aquí puedes actualizar tu UI
        this.updateUI(data);
    }

    onConfirmation(data) {
        console.log('Callback: Confirmación recibida:', data);
    }

    onError(error) {
        console.error('Callback: Error:', error);
    }

    updateUI(sensorData) {
        // Ejemplo de actualización de UI
        const temperatureElement = document.getElementById('temperature');
        const humidityElement = document.getElementById('humidity');
        const lightElement = document.getElementById('light');

        if (temperatureElement) {
            temperatureElement.textContent = `${sensorData.temperatura}°C`;
        }
        if (humidityElement) {
            humidityElement.textContent = `${sensorData.humedad}%`;
        }
        if (lightElement) {
            lightElement.textContent = `${sensorData.luz_intensidad} lux`;
        }
    }
}

// Uso del cliente
const sensorWS = new SensorWebSocket();

// Conectar cuando la página cargue
document.addEventListener('DOMContentLoaded', function() {
    sensorWS.connect();
    
    // Simular datos cada 5 segundos (para pruebas)
    setInterval(() => {
        const temp = (Math.random() * 10 + 20).toFixed(2); // 20-30°C
        const hum = (Math.random() * 20 + 40).toFixed(2);  // 40-60%
        const light = (Math.random() * 500 + 200).toFixed(1); // 200-700 lux
        
        sensorWS.sendSensorData(temp, hum, light, 1);
    }, 5000);
});

// Desconectar al cerrar la página
window.addEventListener('beforeunload', function() {
    sensorWS.disconnect();
});

'''