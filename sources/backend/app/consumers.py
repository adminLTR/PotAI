
import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models import Riego, Planta
from decimal import Decimal
import asyncio

class SensorDataConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        # Crear un grupo para datos de sensores
        self.room_group_name = 'sensor_data'

        # Unirse al grupo
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()
        print(f"WebSocket conectado: {self.channel_name}")

    async def disconnect(self, close_code):
        # Salir del grupo
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
        print(f"WebSocket desconectado: {self.channel_name}")

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            print(f"Datos recibidos: {data}")
            
            # Procesar datos del sensor
            if data.get('type') == 'sensor_data':
                await self.handle_sensor_data(data)
            
            # Enviar confirmación
            await self.send(text_data=json.dumps({
                'type': 'confirmation',
                'message': 'Datos recibidos correctamente',
                'timestamp': data.get('timestamp')
            }))
            
        except json.JSONDecodeError:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Formato JSON inválido'
            }))

    async def handle_sensor_data(self, data):
        """Procesar y guardar datos del sensor"""
        try:
            # Extraer datos
            temperatura = data.get('temperatura')
            humedad = data.get('humedad')
            planta_id = data.get('planta_id', 1)  # ID por defecto
            
            # Guardar en base de datos
            riego = await self.save_sensor_data(
                temperatura, humedad, planta_id
            )
            
            # Broadcast a todos los clientes conectados
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'sensor_data_update',
                    'data': {
                        'id': riego.id,
                        'temperatura': float(temperatura),
                        'humedad': float(humedad),
                        'planta_id': planta_id,
                        'timestamp': riego.fecha_creacion.isoformat()
                    }
                }
            )
            
        except Exception as e:
            print(f"Error procesando datos del sensor: {e}")

    @database_sync_to_async
    def save_sensor_data(self, temperatura, humedad, luz_intensidad, planta_id):
        """Guardar datos del sensor en la base de datos"""
        try:
            planta = Planta.objects.get(id=planta_id)
            riego = Riego.objects.create(
                temperatura=Decimal(str(temperatura)),
                humedad=Decimal(str(humedad)),
                luz_intensidad=Decimal(str(luz_intensidad)),
                id_planta=planta
            )
            return riego
        except Planta.DoesNotExist:
            # Si no existe la planta, crear una por defecto o manejar error
            raise ValueError(f"Planta con id {planta_id} no existe")

    # Método para enviar updates a todos los clientes
    async def sensor_data_update(self, event):
        """Enviar datos actualizados a todos los clientes"""
        await self.send(text_data=json.dumps({
            'type': 'sensor_update',
            'data': event['data']
        }))


class PlantMonitorConsumer(AsyncWebsocketConsumer):
    """Consumer específico para monitoreo de plantas"""
    
    async def connect(self):
        self.plant_id = self.scope['url_route']['kwargs']['plant_id']
        self.room_group_name = f'plant_{self.plant_id}'

        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        data = json.loads(text_data)
        
        # Enviar datos específicos de esta planta
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'plant_data',
                'message': data
            }
        )

    async def plant_data(self, event):
        await self.send(text_data=json.dumps({
            'type': 'plant_update',
            'data': event['message']
        }))