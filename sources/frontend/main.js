// ==================== LOGIN ====================
document.addEventListener('DOMContentLoaded', function () {
    // Limpiar sesión SOLO si estamos en la página de login
    // Verificamos que exista el botón de login antes de limpiar
    var loginBtn = document.getElementById('login-btn');
    
    if (loginBtn && typeof authManager !== 'undefined') {
        // Solo limpiar sesión si estamos en la página de login
        authManager.clearSession();
        console.log('🧹 Sesión anterior limpiada (página de login)');
    }
    
    if (loginBtn) {
        loginBtn.addEventListener('click', async function () {
            // Obtener valores de los inputs
            const username = document.getElementById('username-input')?.value.trim();
            const password = document.getElementById('password-input')?.value;
            const errorMessage = document.getElementById('error-message');

            // Validaciones
            if (!username || !password) {
                showError('Por favor, completa todos los campos');
                return;
            }

            // Limpiar sesión anterior antes de hacer login
            if (typeof authManager !== 'undefined') {
                authManager.clearSession();
            }

            // Mostrar estado de carga
            loginBtn.style.opacity = '0.7';
            loginBtn.style.pointerEvents = 'none';
            hideError();

            try {
                // Llamada al backend
                const apiUrl = typeof getApiUrl === 'function'
                    ? getApiUrl(API_CONFIG.ENDPOINTS.LOGIN)
                    : 'http://localhost:5000/auth/login';

                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        username: username,
                        password: password
                    })
                });

                const data = await response.json();

                if (response.ok) {
                    // Login exitoso - guardar tokens y sesión
                    if (typeof authManager !== 'undefined') {
                        authManager.saveSession(
                            data.access_token,
                            data.session_token,
                            data.expires_at,
                            {
                                user_id: data.user_id,
                                username: data.username,
                                email: data.email
                            }
                        );
                    } else {
                        // Fallback si authManager no está disponible
                        localStorage.setItem('potai_access_token', data.access_token);
                        localStorage.setItem('potai_session_token', data.session_token);
                        localStorage.setItem('potai_expires_at', data.expires_at);
                        localStorage.setItem('potai_user_id', data.user_id);
                        localStorage.setItem('potai_username', data.username);
                        localStorage.setItem('potai_email', data.email);
                    }

                    // Mostrar mensaje de éxito breve antes de redirigir
                    console.log('✅ Login exitoso:', data.username);
                    
                    // Redirigir al dashboard
                    window.location.href = 'dashboard.html';
                } else {
                    // Error de autenticación
                    showError(data.msg || 'Usuario o contraseña incorrectos');
                }
            } catch (error) {
                console.error('Error:', error);
                showError('Error de conexión. Verifica que el servidor esté funcionando');
            } finally {
                // Restaurar botón
                loginBtn.style.opacity = '1';
                loginBtn.style.pointerEvents = 'auto';
            }
        });

        // También permitir login con Enter
        const inputs = document.querySelectorAll('#username-input, #password-input');
        inputs.forEach(input => {
            input.addEventListener('keypress', function(event) {
                if (event.key === 'Enter') {
                    loginBtn.click();
                }
            });
        });
    }
});

document.addEventListener('DOMContentLoaded', function () {
    var iniciar = document.querySelector('.crear-cuenta');
    if (iniciar) {
        iniciar.addEventListener('click', function () {
            window.location.href = 'registro.html';
        });
    }
});

document.addEventListener('DOMContentLoaded', function () {
    var iniciar = document.querySelector('.ya-tienes-cuenta');
    if (iniciar) {
        iniciar.addEventListener('click', function () {
            window.location.href = 'index.html';
        });
    }
});

document.addEventListener('DOMContentLoaded', function () {
    var registrarseBtn = document.getElementById('registrarse-btn');
    if (registrarseBtn) {
        registrarseBtn.addEventListener('click', async function () {
            // Obtener valores de los inputs
            const username = document.getElementById('username-input')?.value.trim();
            const email = document.getElementById('email-input')?.value.trim();
            const password = document.getElementById('password-input')?.value;
            const tycCheckbox = document.getElementById('tyc-checkbox')?.checked;
            const errorMessage = document.getElementById('error-message');

            // Validaciones
            if (!username || !email || !password) {
                showError('Por favor, completa todos los campos');
                return;
            }

            if (!tycCheckbox) {
                showError('Debes aceptar los términos y condiciones');
                return;
            }

            if (password.length < 6) {
                showError('La contraseña debe tener al menos 6 caracteres');
                return;
            }

            if (!validateEmail(email)) {
                showError('Por favor, ingresa un correo electrónico válido');
                return;
            }

            // Mostrar estado de carga
            registrarseBtn.style.opacity = '0.7';
            registrarseBtn.style.pointerEvents = 'none';
            hideError();

            try {
                // Llamada al backend
                const apiUrl = typeof getApiUrl === 'function' 
                    ? getApiUrl(API_CONFIG.ENDPOINTS.REGISTER)
                    : 'http://192.168.80.1:5000/auth/register';
                    
                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        username: username,
                        email: email,
                        password: password
                    })
                });

                const data = await response.json();

                if (response.ok) {
                    // Registro exitoso
                    alert('¡Registro exitoso! Ahora puedes iniciar sesión');
                    window.location.href = 'index.html';
                } else {
                    // Error del servidor
                    showError(data.message || 'Error al registrar usuario');
                }
            } catch (error) {
                console.error('Error:', error);
                showError('Error de conexión. Verifica que el servidor esté funcionando');
            } finally {
                // Restaurar botón
                registrarseBtn.style.opacity = '1';
                registrarseBtn.style.pointerEvents = 'auto';
            }
        });
    }

    function showError(message) {
        const errorDiv = document.getElementById('error-message');
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
        }
    }

    function hideError() {
        const errorDiv = document.getElementById('error-message');
        if (errorDiv) {
            errorDiv.style.display = 'none';
        }
    }

    function validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }
});

document.addEventListener('DOMContentLoaded', function () {
    var iniciar = document.querySelector('.agregar-maceta-btn');
    if (iniciar) {
        iniciar.addEventListener('click', function () {
            window.location.href = 'registrar-macetas.html';
        });
    }
});

document.addEventListener('DOMContentLoaded', function () {
    var iniciar = document.querySelector('.guardar-potai');
    if (iniciar) {
        iniciar.addEventListener('click', function () {
            window.location.href = 'dashboard.html';
        });
    }
});

document.addEventListener('DOMContentLoaded', function () {
    var iniciar = document.querySelector('.card-maceta');
    if (iniciar) {
        iniciar.addEventListener('click', function () {
            window.location.href = 'historico.html';
        });
    }
});

document.addEventListener('DOMContentLoaded', function () {
    var iniciar = document.querySelector('.edit-button');
    if (iniciar) {
        iniciar.addEventListener('click', function () {
            window.location.href = 'modificar-macetas.html';
        });
    }
});

document.addEventListener('DOMContentLoaded', function () {
    var iniciar = document.querySelector('.back-button');
    if (iniciar) {
        iniciar.addEventListener('click', function () {
            window.location.href = 'dashboard.html';
        });
    }
});

document.addEventListener('DOMContentLoaded', function () {
    var userIcon = document.querySelector('.icon-person-dashboard');
    var modal = document.getElementById('userModal');
    var modalCloseBtn = document.getElementById('modalClose');
    var btnClose = document.getElementById('btnClose');
    var btnLogout = document.getElementById('btnLogout');

    function openModal() {
        if (modal) modal.classList.add('open');
        if (modal) modal.setAttribute('aria-hidden', 'false');
    }

    function closeModal() {
        if (modal) modal.classList.remove('open');
        if (modal) modal.setAttribute('aria-hidden', 'true');
    }

    if (userIcon) {
        userIcon.addEventListener('click', function () {
            openModal();
        });
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
            // Si existe authManager, hacer logout completo
            if (typeof authManager !== 'undefined') {
                await authManager.logout();
            }
            window.location.href = 'index.html';
        });
    }
});

// ==================== FUNCIONES AUXILIARES ====================
function showError(message) {
    const errorDiv = document.getElementById('error-message');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
    }
}

function hideError() {
    const errorDiv = document.getElementById('error-message');
    if (errorDiv) {
        errorDiv.style.display = 'none';
    }
}