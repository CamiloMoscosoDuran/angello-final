// ============================================================
// LOGIN ANIMATIONS - Funcionalidades DOM interactivas
// ============================================================

document.addEventListener('DOMContentLoaded', function() {
    // ========================================
    // ELEMENTOS DEL DOM
    // ========================================
    const loginForm = document.getElementById('loginForm');
    const loginBox = document.getElementById('loginBox');
    const submitBtn = document.getElementById('submitBtn');
    const btnText = submitBtn?.querySelector('.btn-text');
    const btnLoading = document.getElementById('btnLoading');
    const passwordInput = document.getElementById('contrasena');
    const inputs = document.querySelectorAll('.form-input');

    // ========================================
    // FUNCIÓN DE DEMO PARA MOSTRAR ANIMACIONES AUTOMÁTICAMENTE
    // ========================================
    function initAutoAnimations() {
        // Ejecutar animaciones automáticamente después de la carga inicial
        setTimeout(() => {
            console.log('🎭 Ejecutando animaciones automáticas...');
            
            // Crear partículas flotantes
            createFloatingParticles();
            
            // Agregar efectos de fondo después de un delay
            setTimeout(() => {
                if (loginBox) {
                    loginBox.style.animation = 'background-shift 8s ease infinite';
                }
            }, 3000);
            
            console.log('✅ Animaciones automáticas inicializadas');
        }, 2000);
    }

    // ========================================
    // EXPLOSIÓN DE PARTÍCULAS PARA EL DEMO
    // ========================================
    function createSuccessExplosion() {
        const colors = ['#ffb86b', '#ff8c42', '#44ff44', '#66ff66', '#fff'];
        
        for (let i = 0; i < 30; i++) {
            setTimeout(() => {
                const particle = document.createElement('div');
                const size = Math.random() * 8 + 4;
                const color = colors[Math.floor(Math.random() * colors.length)];
                
                particle.style.cssText = `
                    position: fixed;
                    width: ${size}px;
                    height: ${size}px;
                    background: ${color};
                    border-radius: 50%;
                    pointer-events: none;
                    z-index: 10000;
                    left: 50%;
                    top: 50%;
                    transform: translate(-50%, -50%);
                    box-shadow: 0 0 10px ${color};
                `;
                
                document.body.appendChild(particle);
                
                // Animar la partícula
                const angle = (Math.PI * 2 * i) / 30;
                const velocity = Math.random() * 300 + 150;
                const gravity = 0.5;
                let velocityX = Math.cos(angle) * velocity;
                let velocityY = Math.sin(angle) * velocity - 100;
                let x = window.innerWidth / 2;
                let y = window.innerHeight / 2;
                
                const animate = () => {
                    velocityY += gravity;
                    x += velocityX * 0.02;
                    y += velocityY * 0.02;
                    
                    particle.style.left = x + 'px';
                    particle.style.top = y + 'px';
                    particle.style.transform = `rotate(${x * 0.1}deg) scale(${1 - (y / window.innerHeight)})`;
                    particle.style.opacity = 1 - (y / window.innerHeight);
                    
                    if (y < window.innerHeight + 100) {
                        requestAnimationFrame(animate);
                    } else {
                        particle.remove();
                    }
                };
                
                requestAnimationFrame(animate);
            }, i * 50);
        }
    }

    // ========================================
    // 1. ANIMACIÓN DE ENTRADA SECUENCIAL MEJORADA
    // ========================================
    function initEntryAnimations() {
        // Añadir delay progresivo a elementos
        const animatedElements = document.querySelectorAll('[class*="animate-"]');
        
        animatedElements.forEach((element, index) => {
            if (!element.style.animationDelay) {
                element.style.animationDelay = `${index * 0.2}s`;
            }
            
            // Agregar efecto de aparición gradual
            element.style.opacity = '0';
            setTimeout(() => {
                element.style.opacity = '1';
            }, (index * 200) + 100);
        });

        // Efecto de aparición del contenedor principal con más efectos
        setTimeout(() => {
            if (loginBox) {
                loginBox.classList.add('animate-glow');
                
                // Agregar partículas de fondo animadas
                createFloatingParticles();
                
                // Efecto de escritura en el título
                typeWriterEffect();
            }
        }, 1500);
        
        // Animar el logo del navbar
        const logo = document.querySelector('.navbar .logo img');
        if (logo) {
            logo.style.animation = 'spin 2s ease-in-out';
        }
    }

    // ========================================
    // 3. VALIDACIÓN EN TIEMPO REAL CON ANIMACIONES MEJORADAS
    // ========================================
    function initInputValidation() {
        inputs.forEach(input => {
            // Efecto de focus mejorado con más efectos visuales
            input.addEventListener('focus', function() {
                const label = this.parentElement.querySelector('label');
                if (label) {
                    label.style.transform = 'translateY(-8px) scale(1.1)';
                    label.style.color = '#ffb86b';
                    label.style.textShadow = '0 0 10px rgba(255, 184, 107, 0.6)';
                }
                
                // Crear efecto de ondas más visible
                createRippleEffect(this);
                
                // Agregar efecto de brillo al contenedor
                this.parentElement.style.background = 'radial-gradient(circle at center, rgba(255, 184, 107, 0.1) 0%, transparent 70%)';
                
                // Sonido simulado con vibración visual
                this.style.animation = 'none';
                setTimeout(() => {
                    this.style.animation = 'pulse 0.3s ease';
                }, 10);
            });

            // Efecto de blur mejorado
            input.addEventListener('blur', function() {
                const label = this.parentElement.querySelector('label');
                if (label) {
                    label.style.transform = 'translateY(0) scale(1)';
                    if (!this.value) {
                        label.style.color = 'rgba(255, 184, 107, 0.7)';
                        label.style.textShadow = 'none';
                    }
                }
                
                // Remover efecto de brillo
                this.parentElement.style.background = 'transparent';
                
                // Validación visual
                setTimeout(() => validateInput(this), 100);
            });

            // Validación mientras se escribe con efectos
            input.addEventListener('input', function() {
                clearTimeout(this.validationTimeout);
                
                // Efecto de escritura
                this.style.transform = 'scale(1.01)';
                setTimeout(() => {
                    this.style.transform = 'scale(1)';
                }, 100);
                
                this.validationTimeout = setTimeout(() => {
                    validateInput(this);
                }, 300);
            });
            
            // Efecto hover para inputs
            input.addEventListener('mouseenter', function() {
                if (!this.matches(':focus')) {
                    this.style.transform = 'translateY(-3px) scale(1.01)';
                    this.style.boxShadow = '0 10px 25px rgba(255, 184, 107, 0.3)';
                }
            });
            
            input.addEventListener('mouseleave', function() {
                if (!this.matches(':focus')) {
                    this.style.transform = 'translateY(0) scale(1)';
                    this.style.boxShadow = 'none';
                }
            });
        });
    }

    // ========================================
    // 4. FUNCIÓN DE VALIDACIÓN VISUAL
    // ========================================
    function validateInput(input) {
        const value = input.value.trim();
        const isEmail = input.type === 'email';
        const isPassword = input.type === 'password';
        
        // Remover clases previas
        input.classList.remove('error', 'success');
        
        // Remover mensajes de error previos
        const existingError = input.parentElement.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }
        
        let isValid = true;
        let errorMessage = '';
        
        if (!value) {
            isValid = false;
            errorMessage = 'Este campo es requerido';
        } else if (isEmail && !isValidEmail(value)) {
            isValid = false;
            errorMessage = 'Ingresa un correo válido';
        } else if (isPassword && value.length < 6) {
            isValid = false;
            errorMessage = 'La contraseña debe tener al menos 6 caracteres';
        }
        
        if (isValid) {
            input.classList.add('success');
            // Efecto de éxito
            createSuccessParticles(input);
        } else {
            input.classList.add('error');
            showErrorMessage(input, errorMessage);
        }
        
        return isValid;
    }

    // ========================================
    // 5. FUNCIÓN PARA MOSTRAR ERRORES ANIMADOS
    // ========================================
    function showErrorMessage(input, message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        
        input.parentElement.appendChild(errorDiv);
        
        // Animar aparición
        setTimeout(() => {
            errorDiv.classList.add('show');
        }, 10);
    }

    // ========================================
    // 6. FUNCIÓN DE VALIDACIÓN DE EMAIL
    // ========================================
    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // ========================================
    // 7. EFECTO DE ONDAS (RIPPLE)
    // ========================================
    function createRippleEffect(element) {
        const ripple = document.createElement('div');
        ripple.style.cssText = `
            position: absolute;
            border-radius: 50%;
            background: rgba(255, 184, 107, 0.6);
            transform: scale(0);
            animation: ripple 0.6s linear;
            pointer-events: none;
            width: 20px;
            height: 20px;
            left: 50%;
            top: 50%;
            z-index: 1000;
        `;
        
        element.parentElement.style.position = 'relative';
        element.parentElement.appendChild(ripple);
        
        setTimeout(() => {
            ripple.remove();
        }, 600);
    }

    // ========================================
    // 8. PARTÍCULAS DE ÉXITO
    // ========================================
    function createSuccessParticles(element) {
        for (let i = 0; i < 5; i++) {
            const particle = document.createElement('div');
            particle.style.cssText = `
                position: absolute;
                width: 4px;
                height: 4px;
                background: #44ff44;
                border-radius: 50%;
                pointer-events: none;
                z-index: 1000;
                top: 10px;
                right: 10px;
                animation: particle-float 1s ease-out forwards;
                animation-delay: ${i * 0.1}s;
            `;
            
            element.parentElement.appendChild(particle);
            
            setTimeout(() => {
                particle.remove();
            }, 1000 + (i * 100));
        }
    }

    // ========================================
    // 9. MANEJO DEL ENVÍO DEL FORMULARIO
    // ========================================
    function initFormSubmission() {
        if (loginForm && submitBtn) {
            loginForm.addEventListener('submit', function(e) {
                // Validar todos los inputs antes del envío
                const allInputs = this.querySelectorAll('.form-input');
                let allValid = true;
                
                allInputs.forEach(input => {
                    if (!validateInput(input)) {
                        allValid = false;
                    }
                });
                
                if (!allValid) {
                    e.preventDefault();
                    
                    // Animar el formulario para indicar error
                    loginBox.classList.add('animate-shake');
                    setTimeout(() => {
                        loginBox.classList.remove('animate-shake');
                    }, 600);
                    
                    return;
                }
                
                // Mostrar estado de carga
                showLoadingState();
            });
        }
    }

    // ========================================
    // 10. ESTADO DE CARGA DEL BOTÓN
    // ========================================
    function showLoadingState() {
        if (submitBtn && btnLoading) {
            submitBtn.classList.add('loading');
            submitBtn.disabled = true;
            
            // Simular carga (en producción esto sería el tiempo real del servidor)
            setTimeout(() => {
                // En caso de éxito, se redirigiría automáticamente
                // En caso de error, se mostraría el mensaje correspondiente
                hideLoadingState();
            }, 2000);
        }
    }
    
    function hideLoadingState() {
        if (submitBtn && btnLoading) {
            submitBtn.classList.remove('loading');
            submitBtn.disabled = false;
        }
    }

    // ========================================
    // 11. EFECTOS DE HOVER MEJORADOS
    // ========================================
    function initHoverEffects() {
        // Efecto hover para inputs
        inputs.forEach(input => {
            input.addEventListener('mouseenter', function() {
                if (!this.matches(':focus')) {
                    this.style.transform = 'translateY(-2px)';
                    this.style.boxShadow = '0 5px 15px rgba(255, 184, 107, 0.2)';
                }
            });
            
            input.addEventListener('mouseleave', function() {
                if (!this.matches(':focus')) {
                    this.style.transform = 'translateY(0)';
                    this.style.boxShadow = 'none';
                }
            });
        });

        // Efecto hover para el botón de submit
        if (submitBtn) {
            submitBtn.addEventListener('mouseenter', function() {
                this.style.transform = 'translateY(-3px) scale(1.02)';
            });
            
            submitBtn.addEventListener('mouseleave', function() {
                if (!this.classList.contains('loading')) {
                    this.style.transform = 'translateY(0) scale(1)';
                }
            });
        }
    }

    // ========================================
    // 12. ANIMACIÓN DE TYPING EN PLACEHOLDERS
    // ========================================
    function initTypingPlaceholders() {
        const emailInput = document.getElementById('correo');
        const passwordInput = document.getElementById('contrasena');
        
        if (emailInput) {
            animateTyping(emailInput, 'tu.correo@angello.com', 2000);
        }
        
        if (passwordInput) {
            setTimeout(() => {
                animateTyping(passwordInput, '••••••••', 3000);
            }, 1000);
        }
    }
    
    function animateTyping(element, text, delay) {
        if (element.value || element.matches(':focus')) return;
        
        setTimeout(() => {
            if (element.value || element.matches(':focus')) return;
            
            let currentText = '';
            let index = 0;
            
            const typeInterval = setInterval(() => {
                if (element.value || element.matches(':focus')) {
                    clearInterval(typeInterval);
                    return;
                }
                
                currentText += text[index];
                element.placeholder = currentText;
                index++;
                
                if (index >= text.length) {
                    clearInterval(typeInterval);
                    
                    // Borrar después de un tiempo
                    setTimeout(() => {
                        if (!element.value && !element.matches(':focus')) {
                            element.placeholder = element.getAttribute('data-original-placeholder') || '';
                        }
                    }, 2000);
                }
            }, 100);
        }, delay);
    }

    // ========================================
    // 13. MANEJO DE ERRORES DEL SERVIDOR
    // ========================================
    function initServerErrorHandling() {
        // Detectar si hay mensajes flash de error
        const flashMessages = document.querySelectorAll('.alert, .flash-message');
        
        flashMessages.forEach(message => {
            if (message.textContent.includes('error') || message.textContent.includes('incorrecto')) {
                // Animar el formulario para mostrar error
                setTimeout(() => {
                    loginBox.classList.add('animate-shake');
                    setTimeout(() => {
                        loginBox.classList.remove('animate-shake');
                    }, 600);
                }, 500);
            }
        });
    }

    // ========================================
    // CSS DINÁMICO PARA ANIMACIONES ADICIONALES MEJORADAS
    // ========================================
    function addDynamicStyles() {
        const styles = `
            @keyframes ripple {
                to {
                    transform: scale(6);
                    opacity: 0;
                }
            }
            
            @keyframes particle-float {
                0% {
                    transform: translateY(0) scale(1) rotate(0deg);
                    opacity: 1;
                }
                100% {
                    transform: translateY(-40px) scale(0.3) rotate(180deg);
                    opacity: 0;
                }
            }
            
            @keyframes typewriter {
                from { width: 0; }
                to { width: 100%; }
            }
            
            @keyframes floating-particle {
                0% { 
                    transform: translateY(100vh) rotate(0deg);
                    opacity: 0;
                }
                10% { 
                    opacity: 1;
                }
                90% { 
                    opacity: 1;
                }
                100% { 
                    transform: translateY(-100px) rotate(360deg);
                    opacity: 0;
                }
            }
            
            @keyframes background-shift {
                0% { background-position: 0% 50%; }
                50% { background-position: 100% 50%; }
                100% { background-position: 0% 50%; }
            }
        `;
        
        const styleSheet = document.createElement('style');
        styleSheet.textContent = styles;
        document.head.appendChild(styleSheet);
    }

    // ========================================
    // NUEVAS FUNCIONES DE EFECTOS VISUALES
    // ========================================
    
    function createFloatingParticles() {
        for (let i = 0; i < 15; i++) {
            setTimeout(() => {
                const particle = document.createElement('div');
                particle.style.cssText = `
                    position: fixed;
                    width: ${Math.random() * 6 + 4}px;
                    height: ${Math.random() * 6 + 4}px;
                    background: linear-gradient(45deg, #ffb86b, #ff8c42);
                    border-radius: 50%;
                    pointer-events: none;
                    z-index: 1000;
                    left: ${Math.random() * 100}vw;
                    animation: floating-particle ${Math.random() * 10 + 15}s linear infinite;
                `;
                
                document.body.appendChild(particle);
                
                setTimeout(() => {
                    if (particle.parentNode) {
                        particle.remove();
                    }
                }, 25000);
            }, i * 1000);
        }
    }
    
    function typeWriterEffect() {
        const title = loginBox?.querySelector('h1');
        if (title && title.textContent) {
            const originalText = title.textContent;
            title.textContent = '';
            title.style.borderRight = '2px solid #ffb86b';
            title.style.whiteSpace = 'nowrap';
            title.style.overflow = 'hidden';
            
            let index = 0;
            const typeInterval = setInterval(() => {
                title.textContent += originalText[index];
                index++;
                
                if (index >= originalText.length) {
                    clearInterval(typeInterval);
                    setTimeout(() => {
                        title.style.borderRight = 'none';
                    }, 500);
                }
            }, 100);
        }
    }
    
    function createMagicCursor() {
        let cursor = document.getElementById('magic-cursor');
        if (!cursor) {
            cursor = document.createElement('div');
            cursor.id = 'magic-cursor';
            cursor.style.cssText = `
                position: fixed;
                width: 20px;
                height: 20px;
                background: radial-gradient(circle, rgba(255,184,107,0.8) 0%, transparent 70%);
                border-radius: 50%;
                pointer-events: none;
                z-index: 9999;
                transition: all 0.1s ease;
                opacity: 0;
            `;
            document.body.appendChild(cursor);
        }
        
        document.addEventListener('mousemove', (e) => {
            cursor.style.left = (e.clientX - 10) + 'px';
            cursor.style.top = (e.clientY - 10) + 'px';
            cursor.style.opacity = '1';
        });
        
        document.addEventListener('mouseleave', () => {
            cursor.style.opacity = '0';
        });
    }

    // ========================================
    // INICIALIZACIÓN MEJORADA
    // ========================================
    function init() {
        console.log('🎨 Inicializando animaciones de login MEJORADAS...');
        
        // Guardar placeholders originales
        inputs.forEach(input => {
            input.setAttribute('data-original-placeholder', input.placeholder);
        });
        
        // Agregar clase de animación al body para efectos globales
        document.body.classList.add('animated-login-page');
        
        // Inicializar todas las funcionalidades
        addDynamicStyles();
        initEntryAnimations();
        initInputValidation();
        initFormSubmission();
        initHoverEffects();
        initServerErrorHandling();
        initAutoAnimations(); // ¡Animaciones automáticas!
        
        // Efectos visuales adicionales
        createMagicCursor();
        
        // Efectos adicionales después de un delay
        setTimeout(() => {
            initTypingPlaceholders();
        }, 2000);
        
        // Agregar efecto de fondo dinámico
        setTimeout(() => {
            if (loginBox) {
                loginBox.style.background = `
                    linear-gradient(45deg, 
                        rgba(72, 20, 17, 0.95), 
                        rgba(102, 30, 24, 0.9), 
                        rgba(72, 20, 17, 0.95)
                    )
                `;
                loginBox.style.backgroundSize = '400% 400%';
                loginBox.style.animation = 'background-shift 8s ease infinite';
            }
        }, 3000);
        
        console.log('✅ Animaciones de login MEJORADAS inicializadas correctamente');
        console.log('🎆 Efectos especiales: Partículas flotantes, cursor mágico, typewriter');
    }

    // Ejecutar inicialización
    init();
});

// ========================================
// UTILIDADES GLOBALES
// ========================================

// Función para activar animación de éxito desde el servidor
window.showLoginSuccess = function() {
    const loginBox = document.getElementById('loginBox');
    if (loginBox) {
        loginBox.style.background = 'rgba(68, 255, 68, 0.1)';
        loginBox.classList.add('animate-pulse');
        
        setTimeout(() => {
            loginBox.style.background = '';
            loginBox.classList.remove('animate-pulse');
        }, 2000);
    }
};

// Función para mostrar error de login desde el servidor
window.showLoginError = function(message) {
    const loginBox = document.getElementById('loginBox');
    if (loginBox) {
        loginBox.classList.add('animate-shake');
        
        // Crear mensaje de error temporal
        const errorDiv = document.createElement('div');
        errorDiv.className = 'server-error-message animate-fadeIn';
        errorDiv.style.cssText = `
            background: rgba(255, 68, 68, 0.1);
            color: #ff6b6b;
            padding: 1rem;
            border-radius: 8px;
            margin-top: 1rem;
            text-align: center;
            border: 1px solid rgba(255, 68, 68, 0.3);
        `;
        errorDiv.textContent = message || 'Error en el inicio de sesión';
        
        loginBox.appendChild(errorDiv);
        
        setTimeout(() => {
            loginBox.classList.remove('animate-shake');
            errorDiv.remove();
        }, 5000);
    }
};