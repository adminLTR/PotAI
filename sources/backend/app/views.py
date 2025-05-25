from django.shortcuts import render
from rest_framework import viewsets, generics
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
        
    def update(self, request, *args, **kwargs):
        """
        PUT /plantas/<id>/
        Espera temperatura y humedad en el body, y actualiza la planta,
        además de registrar un nuevo riego.
        """
        partial = kwargs.pop('partial', False)
        instance = self.get_object()

        temperatura = request.data.get('temperatura')
        humedad = request.data.get('humedad')

        if temperatura is None or humedad is None:
            raise ValidationError("Se requiere temperatura y humedad para actualizar la planta.")

        # Actualizar planta
        instance.temperatura = temperatura
        instance.humedad = humedad
        instance.save()

        modelo_path = os.path.join(os.path.dirname(__file__), "modelo_riego_numerico.pkl")             
        if modelo_path:
            modelo = joblib.load(modelo_path)
            id_tipo_planta = instance.tipo.pk
            nueva_entrada = pd.DataFrame([
                [id_tipo_planta, humedad, temperatura]
            ], columns=['localname', 'moisture', 'temperature'])
            prediccion = modelo.predict(nueva_entrada)
            print(prediccion)
            if prediccion != 0:
                # Crear nuevo riego
                Riego.objects.create(
                    id_planta=instance,
                    temperatura=temperatura,
                    humedad=humedad,
                    volumen_salida=prediccion[0]
                )

        else:
            return Response({"error" : "No es posible conectar con el modelo"}, status=404)
            
        serializer = self.get_serializer(instance)
        return Response(serializer.data, status=200)

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


#
class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]
