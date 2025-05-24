from django.db import models
from django.contrib.auth.models import User

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
    codigo_placa = models.CharField(max_length=10, verbose_name="Código de placa", blank=True)
    usuario = models.ForeignKey(User, on_delete=models.CASCADE)

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
    #luz_intencidad = models.DecimalField(max_digits=6, decimal_places=2)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    id_planta = models.ForeignKey(Planta, on_delete=models.CASCADE, verbose_name="Planta")

    def __str__(self):
        return self.fecha_creacion + " | " + self.id_planta.tipo.nombre
    
    class Meta:
        verbose_name = "Riego"
        verbose_name_plural = "Riegos"
        db_table = "Riego"


