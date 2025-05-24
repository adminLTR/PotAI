import os
import sys
import django

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ezcommerce.settings')
django.setup()

from app.models import TipoPlanta

#Limpiar plantas
TipoPlanta.objects.all.delete()

#Insertar plantas
planta1 = TipoPlanta.objects.create(nombre="menta")
planta1 = TipoPlanta.objects.create(nombre="hierba buena")
planta1 = TipoPlanta.objects.create(nombre="oregano")
planta1 = TipoPlanta.objects.create(nombre="ajo")
planta1 = TipoPlanta.objects.create(nombre="orquidea")
planta1 = TipoPlanta.objects.create(nombre="geranio")
planta1 = TipoPlanta.objects.create(nombre="tomate cherry")
planta1 = TipoPlanta.objects .create(nombre="rosa china")

print("Datos iniciales ingresados correctamente")


