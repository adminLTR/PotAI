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
    codigo_placa = models.CharField(max_length=10, verbose_name="Código de placa", blank=True)
    usuario = models.ForeignKey(User, on_delete=models.CASCADE)
    nombre = models.CharField(max_length=30, blank=True, null=True) #Nombre de la planta mascota
    imagen = models.URLField(blank=True, null=True)

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
    volumen_salida = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)

    #Modelo:
    _modelo = None
    
    def __str__(self):
        return str(self.fecha_creacion) + " | " + self.id_planta.tipo.nombre
    
    def get_modelo(self):
        #Método de clase para cargar el modelo una sola vez
        if self._modelo is None:
            try:              
                modelo_path = os.path.join(os.path.dirname(__file__), "modelo_riego_numerico.pkl")             
                if modelo_path:
                    self._modelo = joblib.load(modelo_path)
                    print(f"Modelo de IA cargado exitosamente desde: {modelo_path}")
                else:
                    print("Error: Archivo del modelo no encontrado en ninguna ubicación")
                    self._modelo = None
                    
            except Exception as e:
                print(f"Error al cargar el modelo: {e}")
                self._modelo = None
                
        return self._modelo
    
    def procesar_datos(self):
        #Procesa los datos del riego usando el modelo de IA
        modelo = self.get_modelo()
        
        if modelo is None:
            raise Exception("Modelo de IA no disponible")
        
        try:
            # Usar los datos reales del objeto en lugar de valores fijos
            id_planta_num = self.id_planta.id if self.id_planta else 7
            temperatura_val = float(self.temperatura)
            humedad_val = float(self.humedad)
            
            # Crear DataFrame con los datos del objeto actual
            nueva_entrada = pd.DataFrame([
                [id_planta_num, humedad_val, temperatura_val]
            ], columns=['localname', 'moisture', 'temperature'])
            
            # Hacer la predicción
            prediccion = modelo.predict(nueva_entrada)
            
            print(f"Predicción realizada: entrada={[id_planta_num, humedad_val, temperatura_val]}, resultado={prediccion[0]}")
            
            return float(prediccion[0])
            
        except Exception as e:
            print(f"Error en procesar_datos: {e}")
            raise Exception(f"Error al procesar datos con IA: {str(e)}")
    
    def save(self, *args, **kwargs):
        #Sobrescribe el método save para calcular volumen_salida automáticamente
        is_new = self._state.adding  # Verifica si el objeto es nuevo
        
        if is_new and self.volumen_salida is None:
            try:
                self.volumen_salida = self.procesar_datos()
                print(f"Volumen calculado automáticamente: {self.volumen_salida}")
            except Exception as e:
                print(f"Error al calcular volumen: {e}")
                # Puedes decidir si quieres que falle o usar un valor por defecto
                # self.volumen_salida = 0.0  # Valor por defecto
                raise  # Re-lanza la excepción para que falle la creación
        
        super().save(*args, **kwargs)
    
    class Meta:
        verbose_name = "Riego"
        verbose_name_plural = "Riegos"
        db_table = "Riego"