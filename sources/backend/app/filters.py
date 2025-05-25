from rest_framework import permissions
from .serializers import *
from .models import *
from app.models import *
from rest_framework.permissions import AllowAny
from django_filters import rest_framework as filters
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import OrderingFilter
from rest_framework.response import Response
from django.db.models import Q

class PlantaFilter(filters.FilterSet):
    # /plantas/?nombre=n
    # 'n' se reemplaza con el nombre de la planta
    nombre = filters.CharFilter(field_name='nombre', lookup_expr='icontains')

    # /plantas/?usuario=n
    # 'n' se reemplaza con el id del usuario
    usuario = filters.NumberFilter(field_name='usuario')  
    
    # /plantas/?tipo=n
    # 'n' se reemplaza con el id del tipo de planta
    tipo = filters.NumberFilter(field_name='tipo')  

    class Meta:
        model = Planta
        fields = ['nombre', 'usuario', 'tipo']


class RiegoFilter(filters.FilterSet):
    # /riego/?tipo=n
    # 'n' se reemplaza con el id del usuario
    usuario = filters.NumberFilter(field_name='id_planta__usuario')  # Riegos por usuario de la planta

    class Meta:
        model = Riego
        fields = ['usuario']
