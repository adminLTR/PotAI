from django.db import models
from django.contrib.auth.models import User
import joblib
import pandas as pd
import os
from django.conf import settings


print("=== DEBUG DEL MODELO ===")
print(f"Directorio actual del models.py: {os.path.dirname(__file__)}")
print(f"BASE_DIR: {settings.BASE_DIR}")

# Verificar si el archivo existe
modelo_app_path = os.path.join(os.path.dirname(__file__), "modelo_riego_numerico.pkl")

print(f"Buscando en app: {modelo_app_path} - Existe: {os.path.exists(modelo_app_path)}")


#Tipo de Planta
class TipoPlanta(models.Model):
    nombre = models.CharField("Nombre", max_length = 100, unique = True)

    def __str__(self):
        return self.nombre
    
    class Meta:
        verbose_name = "Tipo de Planta"
        verbose_name_plural = "Tipos de Planta"
        db_table = "TipoPlanta"


#Planta
class Planta(models.Model):
    tipo = models.ForeignKey(TipoPlanta, on_delete=models.CASCADE, verbose_name="Tipo de planta")
    codigo_placa = models.CharField(max_length=10, verbose_name="Código de placa", blank=True, unique=True)
    usuario = models.ForeignKey(User, on_delete=models.CASCADE)
    nombre = models.CharField(max_length=30, blank=True, null=True) #Nombre de la planta mascota
    imagen = models.URLField(blank=True, null=True)
    temperatura = models.DecimalField(max_digits=6, decimal_places=2, verbose_name="Temperatura (°C)", null=True, blank=True)
    humedad = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)

    def __str__(self):
        return self.tipo.nombre
    
    class Meta:
        verbose_name = "Planta"
        verbose_name_plural = "Plantas"
        db_table = "Planta"


#Riego
class Riego(models.Model):
    temperatura = models.DecimalField(max_digits=6, decimal_places=2, verbose_name="Temperatura (°C)")
    humedad = models.DecimalField(max_digits=6, decimal_places=2)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    id_planta = models.ForeignKey(Planta, on_delete=models.CASCADE, verbose_name="Planta")
    volumen_salida = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)

    #Modelo:
    _modelo = None
    
    def __str__(self):
        return str(self.fecha_creacion) + " | " + self.id_planta.tipo.nombre
    
    class Meta:
        verbose_name = "Riego"
        verbose_name_plural = "Riegos"
        db_table = "Riego"