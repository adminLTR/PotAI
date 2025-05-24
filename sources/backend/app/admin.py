from django.contrib import admin
from .models import *

class TipoPlantaAdmin(admin.ModelAdmin):
    list_display = [field.name for field in TipoPlanta._meta.fields]
    ordering = ('nombre',)

class PlantaAdmin(admin.ModelAdmin):
    list_display = [field.name for field in Planta._meta.fields]
    ordering = ('tipo',)

class RiegoAdmin(admin.ModelAdmin):
    list_display = [field.name for field in Riego._meta.fields]
    ordering = ('fecha_creacion',)


admin.site.register(TipoPlanta, TipoPlantaAdmin)
admin.site.register(Planta, PlantaAdmin)
admin.site.register(Riego, RiegoAdmin)