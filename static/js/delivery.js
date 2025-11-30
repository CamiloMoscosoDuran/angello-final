// ===============================================================================
// DELIVERY.JS - Interactividad para la página de delivery
// ===============================================================================

document.addEventListener('DOMContentLoaded', function() {
    initDelivery();
});

function initDelivery() {
    setupHamburgerMenu();
    setupScrollAnimations();
    setupCartCounter();
    setupStatusIndicator();
    setupSmoothScrolling();
}

// ===============================================================================
// MENÚ HAMBURGUESA
// ===============================================================================
function setupHamburgerMenu() {
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    
    if (hamburger && navMenu) {
        hamburger.addEventListener('click', function() {
            navMenu.classList.toggle('active');
            hamburger.classList.toggle('active');
        });

        // Cerrar menú al hacer clic en un enlace
        const navLinks = document.querySelectorAll('.nav-menu a');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('active');
                hamburger.classList.remove('active');
            });
        });

        // Cerrar menú al hacer clic fuera
        document.addEventListener('click', function(event) {
            if (!navMenu.contains(event.target) && !hamburger.contains(event.target)) {
                navMenu.classList.remove('active');
                hamburger.classList.remove('active');
            }
        });
    }
}

// ===============================================================================
// ANIMACIONES EN SCROLL
// ===============================================================================
function setupScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate');
            }
        });
    }, observerOptions);

    // Observar elementos para animar
    const animateElements = document.querySelectorAll('.option-card, .info-card, .step, .cta-content');
    animateElements.forEach(el => {
        observer.observe(el);
    });
}

// ===============================================================================
// CONTADOR DE CARRITO
// ===============================================================================
function setupCartCounter() {
    updateCartCount();
    
    // Escuchar eventos de actualización del carrito
    window.addEventListener('cartUpdated', updateCartCount);
}

function updateCartCount() {
    const cartCountElement = document.querySelector('.cart-count');
    if (cartCountElement) {
        // Intentar obtener el conteo del carrito desde el servidor o localStorage
        fetch('/cart_count', {
            method: 'GET',
            credentials: 'same-origin'
        })
        .then(response => response.json())
        .then(data => {
            cartCountElement.textContent = data.count || 0;
            
            // Animar el contador si hay items
            if (data.count > 0) {
                cartCountElement.style.display = 'flex';
                cartCountElement.classList.add('pulse');
                setTimeout(() => {
                    cartCountElement.classList.remove('pulse');
                }, 600);
            } else {
                cartCountElement.style.display = 'none';
            }
        })
        .catch(error => {
            console.log('Info: Contador de carrito no disponible');
            cartCountElement.textContent = '0';
            cartCountElement.style.display = 'none';
        });
    }
}

// ===============================================================================
// INDICADOR DE ESTADO
// ===============================================================================
function setupStatusIndicator() {
    const statusText = document.querySelector('.status-text');
    const statusDot = document.querySelector('.status-dot');
    
    if (statusText && statusDot) {
        const now = new Date();
        const currentDay = now.getDay(); // 0 = Domingo, 1 = Lunes, etc.
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        const currentTime = currentHour * 60 + currentMinute;
        
        let isOpen = false;
        let statusMessage = 'Cerrado';
        
        // Horarios: Martes(2) a Domingo(0)
        // Martes-Jueves: 14:00-23:00 (840-1380 minutos)
        // Viernes-Sábado: 12:00-24:00 (720-1440 minutos)  
        // Domingo: 12:00-23:00 (720-1380 minutos)
        // Lunes: Cerrado
        
        if (currentDay === 1) { // Lunes
            isOpen = false;
            statusMessage = 'Cerrado - Lunes de descanso';
        } else if (currentDay >= 2 && currentDay <= 4) { // Martes-Jueves
            isOpen = currentTime >= 840 && currentTime <= 1380; // 14:00-23:00
            statusMessage = isOpen ? 'Abierto ahora' : 'Cerrado - Abre a las 2:00 PM';
        } else if (currentDay === 5 || currentDay === 6) { // Viernes-Sábado
            isOpen = currentTime >= 720 && currentTime <= 1440; // 12:00-24:00
            statusMessage = isOpen ? 'Abierto ahora' : 'Cerrado - Abre a las 12:00 PM';
        } else if (currentDay === 0) { // Domingo
            isOpen = currentTime >= 720 && currentTime <= 1380; // 12:00-23:00
            statusMessage = isOpen ? 'Abierto ahora' : 'Cerrado - Abre a las 12:00 PM';
        }
        
        statusText.textContent = statusMessage;
        statusDot.className = `status-dot ${isOpen ? 'online' : 'offline'}`;
    }
}

// ===============================================================================
// SMOOTH SCROLLING
// ===============================================================================
function setupSmoothScrolling() {
    const links = document.querySelectorAll('a[href^="#"]');
    
    links.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// ===============================================================================
// FUNCIONES DE UTILIDAD
// ===============================================================================

// Mostrar notificación
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas fa-info-circle"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    // Mostrar notificación
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    // Ocultar notificación después de 3 segundos
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Manejar errores de carga de imágenes
function setupImageFallbacks() {
    const images = document.querySelectorAll('img');
    
    images.forEach(img => {
        img.addEventListener('error', function() {
            // Imagen de fallback o placeholder
            this.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><rect width="200" height="200" fill="%23f0f0f0"/><text x="50%" y="50%" text-anchor="middle" fill="%23999">Imagen</text></svg>';
        });
    });
}

// Detectar capacidades del dispositivo
function detectCapabilities() {
    const body = document.body;
    
    // Detectar si es dispositivo táctil
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
        body.classList.add('touch-device');
    }
    
    // Detectar si soporta animaciones
    if (CSS.supports('animation: fadeIn 1s')) {
        body.classList.add('supports-animations');
    }
    
    // Detectar conexión lenta
    if (navigator.connection && navigator.connection.effectiveType === 'slow-2g') {
        body.classList.add('slow-connection');
    }
}

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        setupImageFallbacks();
        detectCapabilities();
    });
} else {
    setupImageFallbacks();
    detectCapabilities();
}