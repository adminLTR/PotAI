import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, r2_score
import joblib

# 1. Cargar el dataset (asegúrate de que el archivo esté en el mismo directorio)
df = pd.read_csv("dataset_sintetico_plantas_numerico.csv")

# 2. Separar variables de entrada (X) y objetivo (y)
X = df[['localname', 'moisture', 'temperature']]
y = df['mililitros_riego']

# 3. Dividir en entrenamiento y prueba
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# 4. Entrenar el modelo
modelo = RandomForestRegressor(n_estimators=100, random_state=42)
modelo.fit(X_train, y_train)

# 5. Evaluar desempeño
y_pred = modelo.predict(X_test)
mae = mean_absolute_error(y_test, y_pred)
r2 = r2_score(y_test, y_pred)

print(f"Error Absoluto Medio: {mae:.2f} ml")
print(f"Coeficiente R²: {r2:.4f}")

# 6. Guardar el modelo entrenado
joblib.dump(modelo, "modelo_riego_numerico.pkl")
print("Modelo guardado como 'modelo_riego_numerico.pkl'")
