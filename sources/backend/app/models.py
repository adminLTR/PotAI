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


#Placa
class Placa(models.MOdel):
    usuario = models.ForeignKey(User, on_delete=models.CASCADE)

    def __str__(self):
        return self.nombre
    
    class Meta:
        verbose_name = "Placa"
        verbose_name_plural = "Placas"
        db_table = "Placa"


#Planta
class Planta(models.Model):
    tipo = models.ForeignKey(TipoPlanta, on_delete=models.CASCADE)
    id_placa = models.ForeignKey(Placa, on_delete=models.CASCADE)

    def __str__(self):
        return self.nombre
    
    class Meta:
        verbose_name = "Planta"
        verbose_name_plural = "Plantas"
        db_table = "Planta"


#Riego
class Riego(models.Model):
    temperatura = models.DecimalField(max_digits=6)
    humedad = models.DecimalField(max_digits=6)
    luz_intencidad = models.DecimalField(max_digits=6)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    id_planta = models.ForeignKey(Planta, on_delete=models.CASCADE)

    def __str__(self):
        return self.nombre
    
    class Meta:
        verbose_name = "Riego"
        verbose_name_plural = "Riegos"
        db_table = "Riego"


