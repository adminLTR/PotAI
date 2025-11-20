// dashboard.js - Lógica del dashboard

// Proteger la página - requiere autenticación
document.addEventListener('DOMContentLoaded', function() {
    // Verificar autenticación
    if (typeof authManager !== 'undefined' && !authManager.isAuthenticated()) {
        console.log('❌ No autenticado, redirigiendo a login...');
        window.location.href = 'index.html';
        return;
    }

    // Cargar datos del usuario
    loadUserData();
});

/**
 * Carga los datos del usuario desde localStorage
 */
function loadUserData() {
    try {
        if (typeof authManager === 'undefined') {
            console.warn('AuthManager no disponible');
            return;
        }

        const username = authManager.getUsername();
        const email = authManager.getUserEmail();
        const userId = authManager.getUserId();

        console.log('👤 Usuario autenticado:', { username, email, userId });

        // Actualizar el modal con los datos del usuario
        const modalName = document.getElementById('modalName');
        const modalEmail = document.getElementById('modalEmail');

        if (modalName && username) {
            modalName.textContent = username;
        }

        if (modalEmail && email) {
            modalEmail.textContent = email;
        }

        // Cargar plantas del usuario
        loadUserPlants();
    } catch (error) {
        console.error('Error al cargar datos del usuario:', error);
    }
}

/**
 * Carga las plantas del usuario desde el backend
 */
async function loadUserPlants() {
    try {
        if (typeof authenticatedFetch === 'undefined') {
            console.warn('authenticatedFetch no disponible');
            return;
        }

        const apiUrl = typeof getApiUrl === 'function'
            ? getApiUrl(API_CONFIG.ENDPOINTS.PLANTS)
            : 'http://localhost:5000/plants';

        const response = await authenticatedFetch(apiUrl, {
            method: 'GET'
        });

        if (response.ok) {
            const data = await response.json();
            console.log('🌱 Plantas del usuario:', data);

            // Actualizar el contador de macetas en el modal
            const modalPots = document.getElementById('modalPots');
            if (modalPots && data.plants) {
                modalPots.textContent = data.plants.length;
            }

            // TODO: Actualizar la vista con las plantas reales
            // Por ahora solo mostramos en consola
        } else {
            console.error('Error al cargar plantas:', response.status);
        }
    } catch (error) {
        console.error('Error al cargar plantas del usuario:', error);
    }
}
