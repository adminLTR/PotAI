import tkinter as tk
from tkinter import filedialog, ttk
from PIL import Image, ImageTk
import tensorflow as tf
import numpy as np
import os # Necesario para la función de carga de imagen

# ------------------- PARÁMETROS ESPECÍFICOS DEL MODELO -------------------

IMG_HEIGHT = 180  # Debe coincidir con el usado en el entrenamiento
IMG_WIDTH = 180
MODEL_NAME = 'modelo_clasificacion_plantas_manual.h5' # O el nombre que usaste para guardar el modelo

# El orden exacto de las clases/etiquetas de tu entrenamiento
CLASS_NAMES = [
    'ajo', 'geranio', 'hierbabuena', 'menta', 
    'oregano', 'orquidea', 'rosachina', 'tomatecherry'
]
NUM_CLASSES = len(CLASS_NAMES)

# Cargar el modelo entrenado
try:
    modelo = tf.keras.models.load_model(MODEL_NAME)
    print(f"Modelo '{MODEL_NAME}' cargado correctamente.")
except Exception as e:
    print(f"ERROR: No se pudo cargar el modelo '{MODEL_NAME}'. Asegúrate de que el archivo existe.")
    print(f"Detalle del error: {e}")
    # Si el modelo no carga, salimos del programa
    exit()

# ------------------- INTERFAZ TKINTER -------------------

ventana = tk.Tk()
ventana.title("Clasificador de Plantas - DeepPlant")
ventana.geometry("700x650")
ventana.configure(bg="#e0f2f1") # Fondo verde/azul claro

# Estilos (opcional, para que se vea más moderno)
style = ttk.Style()
style.configure("TButton", font=("Arial", 10), padding=10)

# Variables
imagen_path = tk.StringVar()
resultado_var = tk.StringVar(value="Resultado: ---")
confianza_var = tk.StringVar(value="Confianza: ---")

# ------------------- FUNCIONES -------------------

def seleccionar_imagen():
    """Abre el diálogo para seleccionar una imagen y la muestra."""
    file_path = filedialog.askopenfilename(filetypes=[("Imágenes", "*.jpg *.jpeg *.png")])
    if file_path:
        imagen_path.set(file_path)
        mostrar_imagen(file_path)
        resultado_var.set("Resultado: Listo para escanear...")
        confianza_var.set("Confianza: ---")

def mostrar_imagen(ruta):
    """Carga y muestra la imagen en el QLabel."""
    try:
        img = Image.open(ruta)
        # Redimensionar para la visualización en la interfaz
        img = img.resize((300, 300))
        img_tk = ImageTk.PhotoImage(img)
        imagen_label.configure(image=img_tk)
        imagen_label.image = img_tk # Mantener referencia para evitar garbage collection
    except Exception as e:
        print(f"Error al mostrar la imagen: {e}")
        imagen_label.configure(text="No se pudo cargar la imagen.", image=None)
        imagen_label.image = None

def escanear():
    """Procesa la imagen seleccionada con el modelo de CNN."""
    path = imagen_path.get()
    if not path:
        resultado_var.set("❌ Primero selecciona una imagen.")
        confianza_var.set("Confianza: 0.00%")
        return

    try:
        # Cargar imagen y procesar (tf.keras.utils.load_img es más moderno)
        img = tf.keras.utils.load_img(path, target_size=(IMG_HEIGHT, IMG_WIDTH))
        img_array = tf.keras.utils.img_to_array(img)
        img_array = tf.expand_dims(img_array, 0)  # Agregar dimensión de Batch (1)
        
        # Normalizar (dividir por 255.0)
        img_array = img_array / 255.0

        # Predecir
        predicciones = modelo.predict(img_array)
        
        # Como la última capa es softmax, la salida ya es una probabilidad.
        probabilities = predicciones[0] 
        indice = np.argmax(probabilities)
        confianza = 100 * np.max(probabilities)

        resultado_var.set(f"Resultado: 🌿 {CLASS_NAMES[indice]}")
        confianza_var.set(f"Confianza: {confianza:.2f}%")
        
    except Exception as e:
        resultado_var.set("❌ Error de procesamiento del modelo.")
        confianza_var.set(f"Detalle: {e}")

# ------------------- COMPONENTES VISUALES -------------------

# Título Principal
titulo = tk.Label(ventana, text="DeepPlant: Clasificador CNN", 
                  font=("Verdana", 24, "bold"), bg="#e0f2f1", fg="#004d40") # Verde oscuro
titulo.pack(pady=10)

# Botón para seleccionar imagen
boton_examinar = ttk.Button(ventana, text="1. Examinar y Cargar Imagen", command=seleccionar_imagen)
boton_examinar.pack(pady=15)

# Contenedor de la Imagen (para centrar y dar borde si se desea)
imagen_frame = tk.Frame(ventana, bg="#ffffff", bd=2, relief=tk.SUNKEN)
imagen_frame.pack(pady=10, padx=10)
imagen_label = tk.Label(imagen_frame, bg="#ffffff", width=300, height=300, text="Imagen no cargada")
imagen_label.pack(padx=5, pady=5)

# Botón para escanear
boton_scan = ttk.Button(ventana, text="2. ESCANEAR PLANTA", command=escanear, style="TButton")
boton_scan.pack(pady=20)

# Resultado y confianza
resultado_label = tk.Label(ventana, textvariable=resultado_var, 
                           font=("Verdana", 18, "bold"), bg="#e0f2f1", fg="#1b5e20") # Verde fuerte
resultado_label.pack(pady=5)

confianza_label = tk.Label(ventana, textvariable=confianza_var, 
                           font=("Verdana", 14), bg="#e0f2f1", fg="#4caf50")
confianza_label.pack()

# Iniciar ventana
ventana.mainloop()