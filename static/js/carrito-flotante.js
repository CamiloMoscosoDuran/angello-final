// ========================================================================
// CARRITO FLOTANTE - FUNCIONALIDADES
// ========================================================================

class CarritoFlotante {
    constructor() {
        this.carrito = [];
        this.isOpen = false;
        this.init();
    }

    init() {
        this.createHTML();
        this.bindEvents();
        this.loadCarrito();
        
        // Actualizar carrito cada 3 segundos para mantener sincronización
        setInterval(() => {
            this.loadCarrito();
        }, 3000);
    }

    createHTML() {
        // Verificar si ya existe un carrito flotante
        let existingContainer = document.getElementById('carrito-flotante-container');
        if (existingContainer) {
            existingContainer.remove();
        }
        
        const container = document.createElement('div');
        container.id = 'carrito-flotante-container';
        container.innerHTML = `
            <button id="carrito-toggle" title="Ver Carrito">
                <i class="fas fa-shopping-cart"></i>
                <div id="carrito-contador">0</div>
            </button>
            
            <div id="carrito-window">
                <div class="carrito-header">
                    <div class="carrito-title">
                        <i class="fas fa-shopping-cart"></i>
                        <h3>Mi Carrito</h3>
                    </div>
                    <button class="carrito-close">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="carrito-content">
                    <div class="carrito-empty">
                        <i class="fas fa-shopping-cart"></i>
                        <p>Tu carrito está vacío</p>
                        <small>¡Agrega algunos productos deliciosos!</small>
                    </div>
                </div>
                
                <div class="carrito-footer" style="display: none;">
                    <div class="carrito-total">
                        <span>Total:</span>
                        <span class="carrito-total-amount">S/ 0.00</span>
                    </div>
                    <div class="carrito-actions">
                        <button class="carrito-btn carrito-btn-secondary" onclick="carritoFlotante.limpiarCarrito()">
                            <i class="fas fa-trash"></i> Limpiar
                        </button>
                        <button class="carrito-btn carrito-btn-primary" onclick="window.location.href='/carrito'">
                            <i class="fas fa-credit-card"></i> Pagar
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(container);
        console.log('✅ HTML del carrito flotante creado y agregado al DOM');
    }

    bindEvents() {
        const toggle = document.getElementById('carrito-toggle');
        const close = document.querySelector('.carrito-close');
        const window = document.getElementById('carrito-window');

        toggle.addEventListener('click', () => this.toggleCarrito());
        close.addEventListener('click', () => this.closeCarrito());
        
        // Cerrar cuando se hace click fuera
        document.addEventListener('click', (e) => {
            if (!document.getElementById('carrito-flotante-container').contains(e.target)) {
                this.closeCarrito();
            }
        });
    }

    toggleCarrito() {
        const window = document.getElementById('carrito-window');
        const toggle = document.getElementById('carrito-toggle');
        
        this.isOpen = !this.isOpen;
        
        if (this.isOpen) {
            window.classList.add('show');
            toggle.classList.add('carrito-bounce');
            this.loadCarrito();
        } else {
            window.classList.remove('show');
        }
        
        // Remover animación después de completar
        setTimeout(() => toggle.classList.remove('carrito-bounce'), 600);
    }

    closeCarrito() {
        const window = document.getElementById('carrito-window');
        window.classList.remove('show');
        this.isOpen = false;
    }

    async loadCarrito() {
        try {
            console.log('📡 Cargando carrito desde el servidor...');
            const response = await fetch('/obtener_carrito', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'same-origin' // Asegurar que se envíen las cookies de sesión
            });
            
            console.log('📡 Respuesta recibida, status:', response.status);
            
            if (response.status === 401) {
                console.log('⚠️ Usuario no logueado');
                this.carrito = [];
                this.updateDisplay();
                return;
            }
            
            if (response.ok) {
                const data = await response.json();
                console.log('✅ Datos del carrito recibidos:', data);
                console.log('📊 Cantidad de productos:', data.productos ? data.productos.length : 0);
                this.carrito = data.productos || [];
                this.updateDisplay();
            } else {
                console.error('❌ Error al obtener carrito:', response.status);
                const errorText = await response.text();
                console.error('❌ Detalles del error:', errorText);
                this.carrito = [];
                this.updateDisplay();
            }
        } catch (error) {
            console.error('❌ Error al cargar carrito:', error);
            this.carrito = [];
            this.updateDisplay();
        }
    }

    updateDisplay() {
        const content = document.querySelector('.carrito-content');
        const footer = document.querySelector('.carrito-footer');
        const contador = document.getElementById('carrito-contador');
        const totalAmount = document.querySelector('.carrito-total-amount');
        
        console.log('🔄 Actualizando display del carrito. Productos:', this.carrito.length);
        
        // Actualizar contador
        const totalItems = this.carrito.reduce((sum, item) => sum + item.cantidad, 0);
        contador.textContent = totalItems;
        contador.classList.toggle('show', totalItems > 0);
        
        console.log('📊 Total de items:', totalItems);
        
        // Si no hay productos
        if (this.carrito.length === 0) {
            content.innerHTML = `
                <div class="carrito-empty">
                    <i class="fas fa-shopping-cart"></i>
                    <p>Tu carrito está vacío</p>
                    <small>¡Agrega algunos productos deliciosos!</small>
                </div>
            `;
            footer.style.display = 'none';
            console.log('📭 Carrito vacío mostrado');
            return;
        }
        
        // Mostrar productos
        let total = 0;
        const itemsHTML = this.carrito.map(item => {
            const subtotal = item.precio * item.cantidad;
            total += subtotal;
            
            console.log('🛒 Producto en carrito:', {
                nombre: item.nombre,
                cantidad: item.cantidad,
                precio: item.precio,
                subtotal: subtotal
            });
            
            return `
                <div class="carrito-item" data-id="${item.id}">
                    <img src="${item.imagen}" alt="${item.nombre}" class="carrito-item-image" 
                         onerror="this.src='/static/image/default-product.jpg'">
                    <div class="carrito-item-details">
                        <div class="carrito-item-name">${item.nombre}</div>
                        <div class="carrito-item-info">
                            <div class="carrito-item-quantity">
                                <button class="quantity-btn" onclick="carritoFlotante.cambiarCantidad(${item.idProducto}, ${item.cantidad - 1})">
                                    <i class="fas fa-minus"></i>
                                </button>
                                <span class="quantity-number">${item.cantidad}</span>
                                <button class="quantity-btn" onclick="carritoFlotante.cambiarCantidad(${item.idProducto}, ${item.cantidad + 1})">
                                    <i class="fas fa-plus"></i>
                                </button>
                            </div>
                            <div class="carrito-item-price">S/ ${subtotal.toFixed(2)}</div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        content.innerHTML = itemsHTML;
        totalAmount.textContent = `S/ ${total.toFixed(2)}`;
        footer.style.display = 'block';
        
        console.log('✅ Display actualizado. Total:', total.toFixed(2));
    }

    async cambiarCantidad(id, nuevaCantidad) {
        if (nuevaCantidad <= 0) {
            return this.eliminarProducto(id);
        }
        
        try {
            const response = await fetch('/actualizar_carrito', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    producto_id: id,
                    cantidad: nuevaCantidad
                })
            });
            
            if (response.ok) {
                await this.loadCarrito();
                this.animarContador();
            }
        } catch (error) {
            console.error('Error al actualizar cantidad:', error);
        }
    }

    async eliminarProducto(id) {
        try {
            const response = await fetch('/eliminar_del_carrito', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    producto_id: id
                })
            });
            
            if (response.ok) {
                await this.loadCarrito();
                this.animarContador();
            }
        } catch (error) {
            console.error('Error al eliminar producto:', error);
        }
    }

    async limpiarCarrito() {
        if (confirm('¿Estás seguro de que quieres limpiar todo el carrito?')) {
            try {
                const response = await fetch('/limpiar_carrito', {
                    method: 'POST'
                });
                
                if (response.ok) {
                    await this.loadCarrito();
                    this.animarContador();
                }
            } catch (error) {
                console.error('Error al limpiar carrito:', error);
            }
        }
    }

    animarContador() {
        const toggle = document.getElementById('carrito-toggle');
        toggle.classList.add('carrito-bounce');
        setTimeout(() => toggle.classList.remove('carrito-bounce'), 600);
    }

    // Método para agregar producto desde otras páginas
    async agregarProducto(id, nombre, precio, imagen, cantidad = 1) {
        try {
            const response = await fetch('/agregar_al_carrito', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    producto_id: id,
                    nombre: nombre,
                    precio: precio,
                    imagen: imagen,
                    cantidad: cantidad
                })
            });
            
            if (response.ok) {
                await this.loadCarrito();
                this.animarContador();
                
                // Mostrar brevemente el carrito
                if (!this.isOpen) {
                    this.toggleCarrito();
                    setTimeout(() => this.closeCarrito(), 2000);
                }
            }
        } catch (error) {
            console.error('Error al agregar producto:', error);
        }
    }
}

// ========================================================================
// VERIFICACIÓN DE PÁGINA Y INICIALIZACIÓN
// ========================================================================

function debeCargarCarritoFlotante() {
    const path = window.location.pathname;
    console.log('🔍 Verificando ruta para carrito flotante:', path);
    
    // Verificación más robusta con expresiones regulares
    const cartaPatterns = [
        /^\/carta_completa/,
        /^\/cc_/,           // Cualquier ruta que empiece con /cc_
        /^\/cc\//,          // Cualquier ruta que empiece con /cc/
        /^\/carta\//        // Cualquier ruta que empiece con /carta/
    ];
    
    const shouldLoad = cartaPatterns.some(pattern => pattern.test(path));
    
    console.log('📋 Patrones de rutas válidas:', cartaPatterns);
    console.log('✅ ¿Debe cargar carrito flotante?:', shouldLoad);
    
    return shouldLoad;
}

// Inicializar carrito flotante solo en páginas específicas
let carritoFlotante;

// Inicialización alternativa por si DOMContentLoaded ya pasó
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCarritoFlotante);
} else {
    // DOMContentLoaded ya se disparó, ejecutar inmediatamente
    setTimeout(initCarritoFlotante, 100);
}

// También intentar después de que window se cargue completamente
window.addEventListener('load', function() {
    if (!carritoFlotante && debeCargarCarritoFlotante()) {
        console.log('🔄 Window load - Intentando crear carrito flotante...');
        setTimeout(initCarritoFlotante, 500);
    }
});

function initCarritoFlotante() {
    console.log('🔄 Iniciando carrito flotante...');
    console.log('📍 Ubicación actual:', window.location.pathname);
    
    if (debeCargarCarritoFlotante()) {
        console.log('✅ Página válida detectada - Inicializando carrito flotante...');
        try {
            // Esperar un poco para que otros scripts se carguen
            setTimeout(() => {
                if (!carritoFlotante) {
                    carritoFlotante = new CarritoFlotante();
                    console.log('✅ Carrito flotante inicializado correctamente');
                    
                    // Integrar con función existente
                    integrarConFuncionExistente();
                }
            }, 1000);
        } catch (error) {
            console.error('❌ Error al inicializar carrito flotante:', error);
        }
    } else {
        console.log('ℹ️ Página no requiere carrito flotante');
    }
}

// Función para integrar con la función existente agregarAlCarrito
function integrarConFuncionExistente() {
    // Interceptar todos los clicks en botones "Agregar al carrito"
    document.addEventListener('click', function(e) {
        const target = e.target.closest('button');
        if (target && (target.textContent.includes('Agregar al carrito') || target.textContent.includes('Añadir al carrito'))) {
            console.log('🛒 Botón de agregar al carrito detectado');
            
            // Actualizar carrito flotante después de múltiples delays para asegurar que funcione
            setTimeout(() => {
                if (carritoFlotante) {
                    console.log('🔄 Actualizando carrito flotante (1s)...');
                    carritoFlotante.loadCarrito();
                    carritoFlotante.animarContador();
                }
            }, 1000);
            
            setTimeout(() => {
                if (carritoFlotante) {
                    console.log('🔄 Actualizando carrito flotante (2s)...');
                    carritoFlotante.loadCarrito();
                }
            }, 2000);
            
            setTimeout(() => {
                if (carritoFlotante) {
                    console.log('🔄 Actualizando carrito flotante (3s)...');
                    carritoFlotante.loadCarrito();
                }
            }, 3000);
        }
    });
    
    // También interceptar fetch requests al endpoint de agregar carrito
    const originalFetch = window.fetch;
    window.fetch = function(...args) {
        const [url, options] = args;
        
        if (url.includes('/agregar_carrito') || url.includes('/agregar_al_carrito')) {
            console.log('🌐 Fetch detectado a:', url);
            
            return originalFetch.apply(this, args).then(response => {
                // Actualizar carrito flotante después de respuesta exitosa
                if (response.ok) {
                    console.log('✅ Respuesta exitosa del servidor');
                    setTimeout(() => {
                        if (carritoFlotante) {
                            console.log('🔄 Actualizando carrito flotante después de fetch...');
                            carritoFlotante.loadCarrito();
                            carritoFlotante.animarContador();
                        }
                    }, 500);
                    
                    // Actualización adicional por si la primera falla
                    setTimeout(() => {
                        if (carritoFlotante) {
                            carritoFlotante.loadCarrito();
                        }
                    }, 1500);
                }
                return response;
            });
        }
        
        return originalFetch.apply(this, args);
    };
    
    console.log('🔗 Función agregarAlCarrito integrada con carrito flotante');
}

// Función de debug para verificar estado
window.debugCarritoFlotante = function() {
    console.log('🔍 Estado del carrito flotante:');
    console.log('- carritoFlotante:', carritoFlotante);
    console.log('- Debe cargar:', debeCargarCarritoFlotante());
    console.log('- Página actual:', window.location.pathname);
    console.log('- Elemento container:', document.getElementById('carrito-flotante-container'));
    
    // Forzar creación del carrito flotante para debugging
    if (!carritoFlotante) {
        console.log('🔧 Forzando creación del carrito flotante...');
        carritoFlotante = new CarritoFlotante();
    }
    
    // Probar carga del carrito
    if (carritoFlotante) {
        console.log('🔄 Probando carga del carrito...');
        carritoFlotante.loadCarrito();
    }
    
    return carritoFlotante;
};

// Función para probar agregar producto manualmente
window.testAgregarProducto = function() {
    fetch('/agregar_carrito', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            id: null,
            nombre: 'Producto de Prueba',
            precio: 10.00,
            imagen: '/static/image/default-product.jpg'
        })
    })
    .then(response => response.json())
    .then(data => {
        console.log('✅ Respuesta del test:', data);
        if (carritoFlotante) {
            carritoFlotante.loadCarrito();
        }
    })
    .catch(error => {
        console.error('❌ Error en test:', error);
    });
};

// Función para probar obtener carrito directamente
window.testObtenerCarrito = function() {
    console.log('🧪 Probando obtener carrito...');
    fetch('/obtener_carrito')
    .then(response => {
        console.log('📡 Status de respuesta:', response.status);
        console.log('📡 Headers:', response.headers);
        return response.json();
    })
    .then(data => {
        console.log('📊 Datos del carrito obtenidos:', data);
        if (carritoFlotante) {
            carritoFlotante.carrito = data.productos || [];
            carritoFlotante.updateDisplay();
        }
    })
    .catch(error => {
        console.error('❌ Error obteniendo carrito:', error);
    });
};

// Función para debug completo del carrito
window.debugCarritoCompleto = function() {
    console.log('🔍 Iniciando debug completo del carrito...');
    fetch('/debug_carrito')
    .then(response => {
        console.log('📡 Status debug:', response.status);
        return response.json();
    })
    .then(data => {
        console.log('🐛 Debug carrito completo:', data);
        console.log('👤 Usuario ID:', data.usuario_id);
        console.log('🛒 Carritos del usuario:', data.carritos);
        console.log('📦 Detalles del carrito:', data.detalles);
    })
    .catch(error => {
        console.error('❌ Error en debug:', error);
    });
};

// Función para forzar actualización del carrito flotante
window.actualizarCarritoFlotante = function() {
    if (carritoFlotante) {
        console.log('🔄 Forzando actualización del carrito flotante...');
        carritoFlotante.loadCarrito();
    } else {
        console.log('❌ CarritoFlotante no está inicializado');
    }
};

// Función para forzar la creación del carrito (solo para debugging)
window.crearCarritoFlotante = function() {
    console.log('🔧 Creando carrito flotante manualmente...');
    if (!carritoFlotante) {
        carritoFlotante = new CarritoFlotante();
        integrarConFuncionExistente();
    }
    return carritoFlotante;
};

// Función global para compatibilidad con código existente
function agregarAlCarritoFlotante(id, nombre, precio, imagen) {
    if (carritoFlotante) {
        carritoFlotante.agregarProducto(id, nombre, precio, imagen);
    }
}