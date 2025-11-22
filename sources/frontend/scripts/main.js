// ========================================
// LOGIN: Integración con API
// ========================================
document.addEventListener('DOMContentLoaded', function () {
    const iniciar = document.querySelector('.iniciar-sesion');
    if (iniciar) {
        iniciar.addEventListener('click', async function () {
            const username = document.getElementById('loginUsername');
            const password = document.getElementById('loginPassword');

            if (username && password) {
                // Validar campos
                if (!username.value.trim()) {
                    alert('Por favor, ingresa tu usuario');
                    username.focus();
                    return;
                }

                if (!password.value.trim()) {
                    alert('Por favor, ingresa tu contraseña');
                    password.focus();
                    return;
                }

                // Deshabilitar botón
                iniciar.style.opacity = '0.6';
                iniciar.style.pointerEvents = 'none';

                try {
                    // Llamar API de autenticación
                    const result = await authService.login(username.value, password.value);

                    if (result.success) {
                        console.log('Login exitoso:', result.data);
                        alert('✅ Inicio de sesión exitoso');
                        window.location.href = '/html/dashboard.html';
                    } else {
                        alert('❌ Error de autenticación:\n' + (result.message || 'Error al iniciar sesión'));
                        iniciar.style.opacity = '1';
                        iniciar.style.pointerEvents = 'auto';
                    }
                } catch (error) {
                    console.error('Error en login:', error);
                    alert('❌ Error de conexión:\n' + (error.message || 'No se pudo conectar con el servidor'));
                    iniciar.style.opacity = '1';
                    iniciar.style.pointerEvents = 'auto';
                }
            }
        });
    }
});

// ========================================
// REGISTRO: Integración con API
// ========================================
document.addEventListener('DOMContentLoaded', function () {
    const registrarse = document.querySelector('.registrarse');
    if (registrarse) {
        registrarse.addEventListener('click', async function () {
            const name = document.getElementById('registerName');
            const email = document.getElementById('registerEmail');
            const password = document.getElementById('registerPassword');
            const checkbox = document.getElementById('tyc-checkbox');

            if (name && email && password && checkbox) {
                // Validaciones
                if (!name.value.trim()) {
                    alert('Por favor, ingresa tu nombre completo');
                    name.focus();
                    return;
                }

                if (!email.value.trim()) {
                    alert('Por favor, ingresa tu correo electrónico');
                    email.focus();
                    return;
                }

                if (!password.value.trim()) {
                    alert('Por favor, ingresa una contraseña');
                    password.focus();
                    return;
                }

                const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailPattern.test(email.value)) {
                    alert('Por favor, ingresa un correo electrónico válido');
                    email.focus();
                    return;
                }

                if (password.value.length < 6) {
                    alert('La contraseña debe tener al menos 6 caracteres');
                    password.focus();
                    return;
                }

                if (!checkbox.checked) {
                    alert('Debes aceptar los términos y condiciones');
                    checkbox.focus();
                    return;
                }

                // Deshabilitar botón
                registrarse.style.opacity = '0.6';
                registrarse.style.pointerEvents = 'none';

                try {
                    // Llamar API de registro
                    const result = await authService.register(
                        name.value,
                        email.value,
                        password.value
                    );

                    if (result.success) {
                        alert('✅ Registro exitoso\n¡Ahora puedes iniciar sesión con tu usuario!');
                        window.location.href = '../index.html';
                    } else {
                        alert('❌ Error en el registro:\n' + (result.message || 'Error al registrar usuario'));
                        registrarse.style.opacity = '1';
                        registrarse.style.pointerEvents = 'auto';
                    }
                } catch (error) {
                    console.error('Error en registro:', error);
                    alert('❌ Error de conexión:\n' + (error.message || 'No se pudo conectar con el servidor'));
                    registrarse.style.opacity = '1';
                    registrarse.style.pointerEvents = 'auto';
                }
            }
        });
    }
});

// ========================================
// DASHBOARD: Cargar plantas del usuario
// ========================================
document.addEventListener('DOMContentLoaded', async function () {
    const plantsContainer = document.getElementById('plantsContainer');
    if (plantsContainer) {
        try {
            // Cargar plantas desde la API
            const result = await plantService.getUserPlants();

            if (result.success && result.data && result.data.length > 0) {
                // Limpiar contenedor
                plantsContainer.innerHTML = '';

                // Renderizar cada planta
                result.data.forEach(plant => {
                    const plantCard = createPlantCard(plant);
                    plantsContainer.appendChild(plantCard);
                });

                // Agregar event listeners a las tarjetas
                document.querySelectorAll('.card-maceta').forEach(card => {
                    card.addEventListener('click', function () {
                        const plantId = this.getAttribute('data-plant-id');
                        // Guardar ID para usar en histórico
                        localStorage.setItem('selectedPlantId', plantId);
                        window.location.href = 'historico.html';
                    });
                });
            } else if (result.data && result.data.length === 0) {
                plantsContainer.innerHTML = '<p style="text-align:center;color:#888;margin-top:50px;">No tienes plantas registradas. ¡Agrega tu primera maceta!</p>';
            }

            // Actualizar modal de usuario con datos reales
            updateUserModal();

        } catch (error) {
            console.error('Error al cargar plantas:', error);
            plantsContainer.innerHTML = '<p style="text-align:center;color:#888;">Error al cargar plantas</p>';
        }
    }
});

// Función helper para crear tarjeta de planta
function createPlantCard(plant) {
    const card = document.createElement('div');
    card.className = 'card-maceta';
    card.setAttribute('data-plant-id', plant.id);

    card.innerHTML = `
        <div class="column-img">
            <img src="${plant.image || '/assets/succulent.svg'}" alt="${plant.name}" class="img-planta-dashboard">
        </div>
        <div class="column-description">
            <p class="apodo-planta-card">${plant.nickname || plant.name}</p>
            <p class="nombre-planta-card">${plant.type || 'Planta'}</p>
            <div class="sensors">
                <div class="humedad">
                    <img src="/assets/water.svg" alt="humedad" class="icon-sensor-dashboard">
                    <p class="valor-sensor-dashboard">${plant.humidity || '--'}%</p>
                </div>
                <div class="luz">
                    <img src="/assets/sun.svg" alt="luz" class="icon-sensor-dashboard">
                    <p class="valor-sensor-dashboard">${plant.light || '--'}</p>
                </div>
                <div class="temperatura">
                    <img src="/assets/temperature.svg" alt="temperatura" class="icon-sensor-dashboard">
                    <p class="valor-sensor-dashboard">${plant.temperature || '--'}°C</p>
                </div>
            </div>
        </div>
    `;

    return card;
}

// Actualizar modal de usuario con datos reales
function updateUserModal() {
    const user = authService.getCurrentUser();
    if (user) {
        const modalName = document.getElementById('modalName');
        const modalEmail = document.getElementById('modalEmail');
        const modalPots = document.getElementById('modalPots');

        if (modalName) modalName.textContent = user.name || 'Usuario';
        if (modalEmail) modalEmail.textContent = user.email || '';

        // Obtener número de macetas
        const plants = localStorage.getItem('userPlants');
        if (modalPots && plants) {
            try {
                const plantsData = JSON.parse(plants);
                modalPots.textContent = plantsData.length || 0;
            } catch (e) {
                modalPots.textContent = '0';
            }
        }
    }
}

// ========================================
// REGISTRAR MACETA: Integración con API
// ========================================
// Variable global para almacenar la imagen seleccionada
let selectedPlantImage = null;

document.addEventListener('DOMContentLoaded', function () {
    // Manejo de carga de imagen
    const uploadBtn = document.getElementById('uploadImageBtn');
    const imageInput = document.getElementById('imageInput');
    const previewImage = document.getElementById('previewImage');

    if (uploadBtn && imageInput) {
        // Click en el botón abre el explorador de archivos
        uploadBtn.addEventListener('click', function () {
            imageInput.click();
        });

        // Cuando se selecciona una imagen
        imageInput.addEventListener('change', async function (event) {
            const file = event.target.files[0];
            if (!file) return;

            // Validar que sea una imagen
            if (!file.type.startsWith('image/')) {
                alert('❌ Por favor, selecciona un archivo de imagen válido');
                return;
            }

            // Validar tamaño (máximo 5MB)
            if (file.size > 5 * 1024 * 1024) {
                alert('❌ La imagen es muy grande. Máximo 5MB');
                return;
            }

            // Mostrar preview local
            const reader = new FileReader();
            reader.onload = function (e) {
                previewImage.src = e.target.result;
            };
            reader.readAsDataURL(file);

            // Cambiar texto del botón
            uploadBtn.textContent = '🔄 Procesando imagen...';
            uploadBtn.style.pointerEvents = 'none';
            uploadBtn.style.opacity = '0.6';

            try {
                // Enviar imagen al servicio de reconocimiento ML
                const result = await mlService.recognizePlant(file);

                if (result.success) {
                    selectedPlantImage = file;
                    uploadBtn.textContent = '✅ Imagen cargada';
                    uploadBtn.style.opacity = '1';
                    uploadBtn.style.pointerEvents = 'auto';

                    // Mostrar información de la planta reconocida
                    let infoMessage = `🌿 Planta reconocida\n\n` +
                        `Especie: ${result.recognition.commonName || result.recognition.speciesName}\n` +
                        `Nombre científico: ${result.recognition.scientificName}\n` +
                        `Confianza: ${(result.recognition.confidence * 100).toFixed(1)}%`;

                    // Agregar requisitos de cuidado si están disponibles
                    if (result.recognition.waterRequirements) {
                        infoMessage += `\n\n💧 Agua: ${result.recognition.waterRequirements}`;
                    }
                    if (result.recognition.lightRequirements) {
                        infoMessage += `\n☀️ Luz: ${result.recognition.lightRequirements}`;
                    }
                    if (result.recognition.humidityRequirements) {
                        infoMessage += `\n💨 Humedad: ${result.recognition.humidityRequirements}`;
                    }

                    alert(infoMessage);

                    console.log('Reconocimiento completo:', result.recognition);
                } else {
                    uploadBtn.textContent = 'Agregar Imagen';
                    uploadBtn.style.opacity = '1';
                    uploadBtn.style.pointerEvents = 'auto';
                    alert('❌ Error al reconocer la planta:\n' + result.message);
                }
            } catch (error) {
                console.error('Error al procesar imagen:', error);
                uploadBtn.textContent = 'Agregar Imagen';
                uploadBtn.style.opacity = '1';
                uploadBtn.style.pointerEvents = 'auto';
                alert('❌ Error al procesar la imagen');
            }
        });
    }

    const guardarBtn = document.querySelector('.guardar-potai');
    if (guardarBtn) {
        guardarBtn.addEventListener('click', async function () {
            const nickname = document.getElementById('plantNickname');
            const code = document.getElementById('potCode');

            if (nickname && code) {
                // Validaciones
                if (!nickname.value.trim()) {
                    alert('Por favor, ingresa el apodo de tu planta');
                    nickname.focus();
                    return;
                }

                if (!code.value.trim()) {
                    alert('Por favor, ingresa el código de tu PotAI');
                    code.focus();
                    return;
                }

                // Deshabilitar botón
                guardarBtn.style.opacity = '0.6';
                guardarBtn.style.pointerEvents = 'none';

                try {
                    // Crear planta en la API
                    const result = await plantService.createPlant({
                        nickname: nickname.value,
                        code: code.value
                    });

                    if (result.success) {
                        alert('¡Maceta registrada exitosamente!');
                        window.location.href = 'dashboard.html';
                    } else {
                        alert(result.message || 'Error al registrar maceta');
                        guardarBtn.style.opacity = '1';
                        guardarBtn.style.pointerEvents = 'auto';
                    }
                } catch (error) {
                    console.error('Error al registrar maceta:', error);
                    alert('Error al conectar con el servidor');
                    guardarBtn.style.opacity = '1';
                    guardarBtn.style.pointerEvents = 'auto';
                }
            }
        });
    }
});

// ========================================
// HISTÓRICO: Cargar datos desde API y predicciones ML
// ========================================
document.addEventListener('DOMContentLoaded', async function () {
    const historyContainer = document.getElementById('historyDataContainer');
    if (historyContainer) {
        const plantId = localStorage.getItem('selectedPlantId');

        if (!plantId) {
            console.warn('No hay planta seleccionada');
            return;
        }

        try {
            // Cargar datos de sensores actuales
            const sensorsResult = await plantService.getCurrentSensors(plantId);
            if (sensorsResult.success) {
                updateCurrentConditions(sensorsResult.data);
            }

            // Cargar histórico de riego
            const historyResult = await plantService.getIrrigationHistory(plantId);
            if (historyResult.success && historyResult.data) {
                renderIrrigationHistory(historyResult.data);
            }

            // Obtener predicción de riego del modelo ML
            if (sensorsResult.success) {
                const mlPrediction = await mlService.predictWatering({
                    ...sensorsResult.data,
                    plantId: plantId
                });

                if (mlPrediction.success) {
                    displayMLPrediction(mlPrediction.prediction);
                }
            }

        } catch (error) {
            console.error('Error al cargar datos históricos:', error);
        }
    }
});

// Actualizar condiciones ambientales actuales
function updateCurrentConditions(data) {
    const conditionValues = document.querySelectorAll('.condition-value');
    if (conditionValues.length >= 3) {
        conditionValues[0].textContent = `${data.humidity || '--'}%`;
        conditionValues[1].textContent = data.light || '--';
        conditionValues[2].textContent = `${data.temperature || '--'}°C`;
    }
}

// Renderizar histórico de riego
function renderIrrigationHistory(historyData) {
    const container = document.getElementById('historyDataContainer');
    if (!container) return;

    container.innerHTML = '';

    historyData.forEach((record, index) => {
        const row = document.createElement('div');
        row.className = index % 2 === 0 ? 'data-row' : 'data-row-alternate';

        row.innerHTML = `
            <div class="date-cell">${formatDate(record.date)}</div>
            <div class="riego-cell">${record.amount || '--'} ml</div>
            <div class="water-cell">${record.humidity || '--'}%</div>
            <div class="sun-cell">${record.light || '--'}</div>
            <div class="temperatura-cell">${record.temperature || '--'} °C</div>
        `;

        container.appendChild(row);
    });
}

// Mostrar predicción del modelo ML
function displayMLPrediction(prediction) {
    // Crear elemento para mostrar la predicción
    const predictionDiv = document.createElement('div');
    predictionDiv.className = 'ml-prediction-card';
    predictionDiv.style.cssText = 'margin: 20px 45px; padding: 15px; background: #E7EFE4; border-radius: 15px;';

    const needsWater = prediction.needsWater ? 'SÍ' : 'NO';
    const color = prediction.needsWater ? '#447B51' : '#888';

    predictionDiv.innerHTML = `
        <h3 style="color: #292929; font-size: 14px; margin-bottom: 10px;">🤖 Recomendación IA</h3>
        <p style="color: ${color}; font-weight: bold; font-size: 16px;">
            Necesita riego: ${needsWater}
        </p>
        <p style="color: #888; font-size: 12px; margin-top: 5px;">
            Cantidad recomendada: ${prediction.waterAmount} ml
        </p>
        <p style="color: #888; font-size: 11px; margin-top: 5px;">
            Confianza: ${(prediction.confidence * 100).toFixed(0)}%
        </p>
        <p style="color: #666; font-size: 11px; margin-top: 8px; font-style: italic;">
            ${prediction.reason}
        </p>
    `;

    // Insertar después de la tarjeta de condiciones
    const conditionsCard = document.querySelector('.conditions-card');
    if (conditionsCard) {
        conditionsCard.after(predictionDiv);
    }
}

// Helper: formatear fecha
function formatDate(dateString) {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${day}/${month}/${year} ${hours}:${minutes} h`;
}

// ========================================
// MODAL DE USUARIO Y NAVEGACIÓN
// ========================================
document.addEventListener('DOMContentLoaded', function () {
    const userIcon = document.querySelector('.icon-person-dashboard');
    const modal = document.getElementById('userModal');
    const modalCloseBtn = document.getElementById('modalClose');
    const btnClose = document.getElementById('btnClose');
    const btnLogout = document.getElementById('btnLogout');

    function openModal() {
        if (modal) {
            modal.classList.add('open');
            modal.setAttribute('aria-hidden', 'false');
        }
    }

    function closeModal() {
        if (modal) {
            modal.classList.remove('open');
            modal.setAttribute('aria-hidden', 'true');
        }
    }

    if (userIcon) {
        userIcon.addEventListener('click', openModal);
    }

    if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeModal);
    if (btnClose) btnClose.addEventListener('click', closeModal);

    if (modal) {
        modal.addEventListener('click', function (e) {
            if (e.target === modal) closeModal();
        });
    }

    if (btnLogout) {
        btnLogout.addEventListener('click', async function () {
            await authService.logout();
        });
    }
});

// ========================================
// NAVEGACIÓN Y OTRAS INTERACCIONES
// ========================================
document.addEventListener('DOMContentLoaded', function () {
    // Crear cuenta
    const crearCuenta = document.querySelector('.crear-cuenta');
    if (crearCuenta) {
        crearCuenta.addEventListener('click', () => {
            window.location.href = '/html/registro.html';
        });
    }

    // Ya tienes cuenta
    const yaTienesCuenta = document.querySelector('.ya-tienes-cuenta');
    if (yaTienesCuenta) {
        yaTienesCuenta.addEventListener('click', () => {
            window.location.href = '../index.html';
        });
    }

    // Agregar maceta
    const agregarMaceta = document.querySelector('.agregar-maceta-btn');
    if (agregarMaceta) {
        agregarMaceta.addEventListener('click', () => {
            window.location.href = 'registrar-macetas.html';
        });
    }

    // Botón editar
    const editButton = document.querySelector('.edit-button');
    if (editButton) {
        editButton.addEventListener('click', () => {
            window.location.href = 'modificar-macetas.html';
        });
    }

    // Botón regresar
    const backButton = document.querySelector('.back-button');
    if (backButton) {
        backButton.addEventListener('click', () => {
            window.location.href = 'dashboard.html';
        });
    }
});
