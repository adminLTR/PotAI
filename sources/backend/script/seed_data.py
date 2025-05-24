import os
import sys
import django

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from app.models import TipoPlanta, Planta, Riego

#Limpiar plantas
TipoPlanta.objects.all().delete()

#Insertar plantas
planta1 = TipoPlanta.objects.create(nombre="menta")
planta2 = TipoPlanta.objects.create(nombre="hierba buena")
planta3 = TipoPlanta.objects.create(nombre="oregano")
planta4 = TipoPlanta.objects.create(nombre="ajo")
planta5 = TipoPlanta.objects.create(nombre="orquidea")
planta6 = TipoPlanta.objects.create(nombre="geranio")
planta7 = TipoPlanta.objects.create(nombre="tomate cherry")
planta8 = TipoPlanta.objects .create(nombre="rosa china")

print("Datos iniciales ingresados correctamente")


Planta.objects.all().delete()
Riego.objects.all().delete()


