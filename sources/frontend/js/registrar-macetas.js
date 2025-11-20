// registrar-macetas.js - Lógica para registrar macetas con reconocimiento de plantas

// Variables globales
let selectedImage = null;
let recognizedPlantType = null;

document.addEventListener('DOMContentLoaded', function() {
    console.log('🔍 Verificando autenticación en registro de macetas...');
    
    // Verificar que authManager esté disponible
    if (typeof authManager === 'undefined') {
        console.error('❌ authManager no está disponible');
        alert('Error: Sistema de autenticación no disponible');
        return;
    }
    
    // Verificar tokens en localStorage
    const accessToken = authManager.getAccessToken();
    const sessionToken = authManager.getSessionToken();
    const expiresAt = localStorage.getItem('potai_expires_at');
    
    console.log('📋 Estado de autenticación:');
    console.log('  - Access Token:', accessToken ? '✅ Presente' : '❌ Ausente');
    console.log('  - Session Token:', sessionToken ? '✅ Presente' : '❌ Ausente');
    console.log('  - Expires At:', expiresAt || '❌ No definido');
    
    // Verificar si está autenticado
    if (!authManager.isAuthenticated()) {
        console.log('❌ No autenticado, redirigiendo a login...');
        alert('Tu sesión ha expirado. Por favor inicia sesión nuevamente.');
        window.location.href = 'index.html';
        return;
    }
    
    console.log('✅ Usuario autenticado correctamente');
    console.log('👤 Usuario:', authManager.getUsername());

    initializeImageUpload();
    initializeSaveButton();
});

/**
 * Inicializa la funcionalidad de carga de imagen
 */
function initializeImageUpload() {
    const uploadBtn = document.getElementById('upload-btn');
    const imageInput = document.getElementById('image-input');
    const previewImage = document.getElementById('preview-image');

    // Click en "Agregar Imagen" o en la imagen misma
    if (uploadBtn) {
        uploadBtn.addEventListener('click', () => {
            imageInput.click();
        });
    }

    if (previewImage) {
        previewImage.addEventListener('click', () => {
            imageInput.click();
        });
    }

    // Cuando se selecciona una imagen
    if (imageInput) {
        imageInput.addEventListener('change', async (event) => {
            const file = event.target.files[0];
            if (file) {
                await handleImageUpload(file);
            }
        });
    }
}

/**
 * Maneja la carga de la imagen y llama al reconocimiento
 */
async function handleImageUpload(file) {
    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
        showError('Por favor selecciona un archivo de imagen válido');
        return;
    }

    // Mostrar preview de la imagen
    const reader = new FileReader();
    reader.onload = (e) => {
        const previewImage = document.getElementById('preview-image');
        if (previewImage) {
            previewImage.src = e.target.result;
            previewImage.style.borderColor = '#447B51';
        }
    };
    reader.readAsDataURL(file);

    // Guardar la imagen seleccionada
    selectedImage = file;

    // Llamar al reconocimiento
    await recognizePlant(file);
}

/**
 * Llama al endpoint de reconocimiento de plantas
 */
async function recognizePlant(imageFile) {
    // Ocultar mensajes anteriores
    hideError();
    hidePlantDetected();

    // Mostrar loading
    showLoading();

    try {
        // Crear FormData para enviar la imagen
        const formData = new FormData();
        formData.append('image', imageFile);

        // Llamar al endpoint
        const apiUrl = typeof getApiUrl === 'function'
            ? getApiUrl(API_CONFIG.ENDPOINTS.RECOGNITION)
            : 'http://localhost:5000/recognition';

        const response = await fetch(apiUrl, {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (response.ok) {
            // Reconocimiento exitoso
            recognizedPlantType = data.plant_type;
            showPlantDetected(data.plant_type);
            console.log('✅ Planta reconocida:', data.plant_type);
        } else {
            showError(data.error || 'Error al reconocer la planta');
        }
    } catch (error) {
        console.error('Error:', error);
        showError('Error de conexión. Verifica que el servidor esté funcionando');
    } finally {
        hideLoading();
    }
}

/**
 * Muestra la planta detectada
 */
function showPlantDetected(plantType) {
    const plantDetectedDiv = document.getElementById('plant-detected');
    const plantNameElement = document.getElementById('plant-name');

    if (plantDetectedDiv && plantNameElement) {
        // Traducir nombres de plantas si es necesario
        const plantNames = {
            'ajo': 'Ajo',
            'geranio': 'Geranio',
            'hierbabuena': 'Hierbabuena',
            'menta': 'Menta',
            'oregano': 'Orégano',
            'orquidea': 'Orquídea',
            'rosachina': 'Rosa China',
            'tomatecherry': 'Tomate Cherry'
        };

        const displayName = plantNames[plantType.toLowerCase()] || plantType;
        plantNameElement.textContent = displayName;
        plantDetectedDiv.style.display = 'block';
    }
}

/**
 * Oculta la planta detectada
 */
function hidePlantDetected() {
    const plantDetectedDiv = document.getElementById('plant-detected');
    if (plantDetectedDiv) {
        plantDetectedDiv.style.display = 'none';
    }
}

/**
 * Muestra el loading
 */
function showLoading() {
    const loadingDiv = document.getElementById('loading-recognition');
    if (loadingDiv) {
        loadingDiv.style.display = 'block';
    }
}

/**
 * Oculta el loading
 */
function hideLoading() {
    const loadingDiv = document.getElementById('loading-recognition');
    if (loadingDiv) {
        loadingDiv.style.display = 'none';
    }
}

/**
 * Muestra un mensaje de error
 */
function showError(message) {
    const errorDiv = document.getElementById('error-recognition');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
    }
}

/**
 * Oculta el mensaje de error
 */
function hideError() {
    const errorDiv = document.getElementById('error-recognition');
    if (errorDiv) {
        errorDiv.style.display = 'none';
    }
}

/**
 * Inicializa el botón de guardar
 */
function initializeSaveButton() {
    const saveBtn = document.getElementById('save-pot-btn');
    if (saveBtn) {
        saveBtn.addEventListener('click', async () => {
            await handleSavePot();
        });
    }
}

/**
 * Maneja el guardado de la maceta
 */
async function handleSavePot() {
    const nickname = document.getElementById('plant-nickname')?.value.trim();
    const potCode = document.getElementById('pot-code')?.value.trim();

    // Validaciones
    if (!nickname) {
        showError('Por favor ingresa un nombre para tu planta');
        return;
    }

    if (!potCode) {
        showError('Por favor ingresa el código/label del macetero (ej: ESP32-001)');
        return;
    }

    if (!selectedImage) {
        showError('Por favor selecciona una imagen de tu planta');
        return;
    }

    if (!recognizedPlantType) {
        showError('Espera a que se reconozca el tipo de planta');
        return;
    }

    hideError();

    console.log('📦 Preparando datos para enviar:');
    console.log('  - Nombre planta:', nickname);
    console.log('  - Código pot:', potCode);
    console.log('  - Tipo planta:', recognizedPlantType);
    console.log('  - Imagen:', selectedImage.name);

    // Deshabilitar botón durante el proceso
    const saveBtn = document.getElementById('save-pot-btn');
    if (saveBtn) {
        saveBtn.style.opacity = '0.7';
        saveBtn.style.pointerEvents = 'none';
    }

    try {
        // Crear FormData con todos los datos
        const formData = new FormData();
        formData.append('pot_label', potCode);
        formData.append('name', nickname);
        formData.append('species_name', recognizedPlantType);
        formData.append('image', selectedImage);

        // Llamar al endpoint
        const apiUrl = typeof getApiUrl === 'function'
            ? getApiUrl(API_CONFIG.ENDPOINTS.POTS)
            : 'http://localhost:5000/pots/create';

        // Para FormData, necesitamos hacer el fetch manualmente con auth headers
        if (typeof authManager === 'undefined' || !authManager.isAuthenticated()) {
            showError('No autenticado. Por favor inicia sesión');
            window.location.href = 'index.html';
            return;
        }

        const token = authManager.getAccessToken();
        const sessionToken = authManager.getSessionToken();
        
        console.log('🔑 Tokens para autenticación:');
        console.log('  - Access Token:', token ? '✅ Presente' : '❌ FALTA');
        console.log('  - Session Token:', sessionToken ? '✅ Presente' : '❌ FALTA');
        
        if (!token || !sessionToken) {
            console.error('❌ Faltan tokens de autenticación');
            showError('Sesión inválida. Redirigiendo al login...');
            setTimeout(() => {
                authManager.clearSession();
                window.location.href = 'index.html';
            }, 1500);
            return;
        }
        
        console.log('🌐 Enviando petición a:', apiUrl);
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'X-Session-Token': sessionToken
                // No incluir Content-Type para que FormData establezca el boundary automáticamente
            },
            body: formData
        });
        
        console.log('📡 Status HTTP:', response.status);
        console.log('📡 Status Text:', response.statusText);

        const data = await response.json();
        console.log('📦 Respuesta del servidor:', data);

        // Si recibimos 401, la sesión es inválida
        if (response.status === 401) {
            console.error('❌ Error 401 - Autenticación inválida');
            console.error('Detalles del error:', data);
            authManager.clearSession();
            showError('Tu sesión ha expirado. Redirigiendo al login...');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 2000);
            return;
        }

        if (response.ok) {
            // Éxito - mostrar mensaje detallado
            console.log('✅ Respuesta del servidor:', data);
            
            let message = '¡Planta registrada exitosamente! 🎉\n\n';
            if (data.data) {
                message += `🌱 Planta: ${data.data.plant_name}\n`;
                message += `📦 Macetero: ${data.data.pot_label}\n`;
                message += `🌿 Tipo: ${data.data.species_name}\n`;
                if (data.data.pot_created) {
                    message += '\n✨ Se creó un nuevo macetero para tu planta';
                } else {
                    message += '\n📌 Se agregó a un macetero existente';
                }
            }
            
            alert(message);
            window.location.href = 'dashboard.html';
        } else {
            // Error del servidor
            console.error('❌ Error del servidor:', data);
            const errorMsg = data.error || data.message || 'Error al guardar la planta';
            const suggestion = data.suggestion ? `\n\n💡 ${data.suggestion}` : '';
            showError(errorMsg + suggestion);
        }
    } catch (error) {
        console.error('Error:', error);
        showError('Error de conexión. Verifica que el servidor esté funcionando');
    } finally {
        // Restaurar botón
        if (saveBtn) {
            saveBtn.style.opacity = '1';
            saveBtn.style.pointerEvents = 'auto';
        }
    }
}
