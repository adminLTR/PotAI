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
    """
    API Endpoint para CRUD de Planta.
    """
    queryset = Planta.objects.all()
    serializer_class = PlantaSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_class = PlantaFilter
    
    def get_permissions(self):
        permission_classes = [permissions.AllowAny]
        return [permission() for permission in permission_classes]
    
    

    ordering = ['nombre']  # Orden predeterminado



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

