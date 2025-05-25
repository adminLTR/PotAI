from django.shortcuts import render
from rest_framework import viewsets
from rest_framework import permissions
from .serializers import *
from .models import *
from rest_framework.permissions import AllowAny
import joblib
import pandas as pd
import os
from django.conf import settings
from .filters import *
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError, NotFound

#TipoPlanta
class TipoPlantaViewSet(viewsets.ModelViewSet):
    """
    API Endpoint para CRUD de TipoPlanta.
    """
    queryset = TipoPlanta.objects.all()
    serializer_class = TipoPlantaSerializer
    filterset_fields = '__all__'
    
    def get_permissions(self):
        permission_classes = [permissions.AllowAny]
        return [permission() for permission in permission_classes]
    
#Planta
class PlantaViewSet(viewsets.ModelViewSet):
    queryset = Planta.objects.all()
    serializer_class = PlantaSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_class = PlantaFilter

    def get_permissions(self):
        permission_classes = [permissions.AllowAny]
        return [permission() for permission in permission_classes]

    ordering = ['nombre']

    @action(detail=True, methods=["get"], url_path="info-planta")
    def info_detallada(self, request, pk=None):
        try:
            print("entra")
            planta = self.get_object()
            print(planta)

            riegos = Riego.objects.filter(id_planta=planta).order_by('-fecha_creacion')[:5]
            riegos_data = [
                {
                    "fecha": r.fecha_creacion,
                    "temperatura": r.temperatura,
                    "humedad": r.humedad,
                    "volumen_salida": r.volumen_salida,
                }
                for r in riegos
            ]

            data = {
                "nombre": planta.nombre,
                "tipo_planta": planta.tipo.nombre,
                "temperatura_actual": planta.temperatura,
                "humedad_actual": planta.humedad,
                "ultimos_riegos": riegos_data,
            }

            return Response(data)
        except Planta.DoesNotExist:
            return Response({"error": "Planta no encontrada"}, status=404)
        
        
    @action(detail=False, methods=["put"], url_path="actualizar/(?P<placa>[^/.]+)")
    def actualizar_por_placa(self, request, placa=None):
        """
        PUT /api/plantas/actualizar/<placa>/
        Actualiza la planta por placa, registra riego y devuelve la predicción.
        """
        try:
            planta = Planta.objects.get(codigo_placa=placa)
        except Planta.DoesNotExist:
            raise NotFound("Planta con esa placa no encontrada.")

        temperatura = request.data.get('temperatura')
        humedad = request.data.get('humedad')

        if temperatura is None or humedad is None:
            raise ValidationError("Se requiere temperatura y humedad para actualizar la planta.")

        # Actualiza los datos de la planta
        planta.temperatura = temperatura
        planta.humedad = humedad
        planta.save()

        prediccion_valor = 0
        modelo_path = os.path.join(os.path.dirname(__file__), "modelo_riego_numerico.pkl")

        if os.path.exists(modelo_path):
            modelo = joblib.load(modelo_path)
            id_tipo_planta = planta.tipo.pk
            nueva_entrada = pd.DataFrame([[
                id_tipo_planta, humedad, temperatura
            ]], columns=['localname', 'moisture', 'temperature'])

            prediccion = modelo.predict(nueva_entrada)
            if prediccion[0] != 0:
                prediccion_valor = prediccion[0]
                Riego.objects.create(
                    id_planta=planta,
                    temperatura=temperatura,
                    humedad=humedad,
                    volumen_salida=prediccion_valor
                )

        serializer = self.get_serializer(planta)
        return Response({
            "planta": serializer.data,
            "prediccion": prediccion_valor
        }, status=200)


#Riego       
class RiegoViewSet(viewsets.ModelViewSet):
    """
    API Endpoint para CRUD de Riego.
    """
    queryset = Riego.objects.all()
    serializer_class = RiegoSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_class = RiegoFilter

    def get_permissions(self):
        permission_classes = [permissions.AllowAny]
        return [permission() for permission in permission_classes]
    
    ordering = ['fecha_creacion']  # Orden predeterminado

