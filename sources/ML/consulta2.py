import joblib
import pandas as pd

# Cargar modelo
modelo = joblib.load("modelo_riego_numerico.pkl")

# Nueva entrada de ejemplo: planta 1 (Menta), humedad 28%, temperatura 30 °C
nueva_entrada = pd.DataFrame([[7, 5, 35]], columns=['localname', 'moisture', 'temperature'])

# Predecir
prediccion = modelo.predict(nueva_entrada)
print(f"Cantidad estimada de riego: {prediccion[0]:.2f} ml")
