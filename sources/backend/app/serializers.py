from rest_framework import serializers
from models import *

class TipoPlantaSerializer(serializers.ModelSerializer):
    class Meta:
        model = TipoPlanta
        fields = '__all__'

class PlantaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Planta
        fields = '__all__'

class PlacaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Placa
        fields = '__all__'

class RiegoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Riego
        fields = '__all__'

