// ========================================================================
// CHATBOT ASISTENTE ANGELLO - FUNCIONALIDAD MEJORADA
// ========================================================================

class AngellloChatBot {
    constructor() {
        // Configuración inicial
        this.isOpen = false;
        this.isTyping = false;
        this.messageId = 0;
        this.currentSuggestions = [];
        
        // Datos del usuario (obtenidos de forma limpia sin scripts inline)
        this.userData = this.loadUserData();
        
        // Elementos del DOM
        this.elements = {};
        
        // Inicializar el chatbot
        this.init();
    }

    // ====================================================================
    // CARGA DE DATOS DE USUARIO
    // ====================================================================
    loadUserData() {
        // Método 1: Usar función externa si está disponible
        if (typeof window.getChatbotUserData === 'function') {
            return window.getChatbotUserData();
        }
        
        // Método 2: Buscar en data attributes del body
        const body = document.body;
        if (body.hasAttribute('data-user-info')) {
            try {
                return JSON.parse(body.getAttribute('data-user-info'));
            } catch (e) {
                console.warn('Error parsing user data from body:', e);
            }
        }
        
        // Método 3: Buscar datos individuales
        return {
            isLoggedIn: body.hasAttribute('data-logged-in') || false,
            userName: body.getAttribute('data-user-name') || '',
            userId: body.getAttribute('data-user-id') ? parseInt(body.getAttribute('data-user-id')) : null
        };
    }

    // ====================================================================
    // INICIALIZACIÓN
    // ====================================================================
    init() {
        this.initializeElements();
        this.bindEvents();
        this.showInitialMessage();
        this.updateQuickSuggestions();
    }

    initializeElements() {
        this.elements = {
            toggle: document.getElementById('chatbot-toggle'),
            window: document.getElementById('chat-window'),
            messages: document.getElementById('chat-messages'),
            input: document.getElementById('chat-input-text'),
            sendBtn: document.getElementById('send-button'),
            closeBtn: document.getElementById('close-button'),
            minimizeBtn: document.getElementById('minimize-button'),
            suggestions: document.getElementById('quick-suggestions')
        };
    }

    bindEvents() {
        // Botón de toggle principal
        this.elements.toggle?.addEventListener('click', () => this.toggleChat());
        
        // Botones de control
        this.elements.closeBtn?.addEventListener('click', () => this.closeChat());
        this.elements.minimizeBtn?.addEventListener('click', () => this.minimizeChat());
        
        // Input y envío de mensajes
        this.elements.input?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
        
        this.elements.sendBtn?.addEventListener('click', () => this.sendMessage());
        
        // Auto-resize del input
        this.elements.input?.addEventListener('input', () => this.autoResizeInput());
        
        // Sugerencias rápidas
        this.elements.suggestions?.addEventListener('click', (e) => {
            if (e.target.classList.contains('suggestion-btn')) {
                this.sendSuggestion(e.target.textContent.trim());
            }
        });
    }

    // ====================================================================
    // CONTROL DE VENTANA
    // ====================================================================
    toggleChat() {
        this.isOpen ? this.closeChat() : this.openChat();
    }

    openChat() {
        this.isOpen = true;
        this.elements.window?.classList.remove('chat-hidden');
        this.elements.input?.focus();
        
        // Animar entrada
        setTimeout(() => {
            this.elements.window?.classList.add('chat-open');
        }, 50);
    }

    closeChat() {
        this.isOpen = false;
        this.elements.window?.classList.add('chat-hidden');
        this.elements.window?.classList.remove('chat-open');
    }

    minimizeChat() {
        this.elements.window?.classList.toggle('chat-window-minimized');
    }

    // ====================================================================
    // MANEJO DE MENSAJES
    // ====================================================================
    showInitialMessage() {
        setTimeout(() => {
            const greeting = this.getPersonalizedGreeting();
            this.addBotMessage(greeting);
            
            // Mostrar mensaje de bienvenida adicional
            setTimeout(() => {
                this.addBotMessage("¿En qué puedo ayudarte hoy? 🍕✨");
                this.updateQuickSuggestions('initial');
            }, 1500);
        }, 500);
    }

    getPersonalizedGreeting() {
        const currentHour = new Date().getHours();
        let timeGreeting = '';
        
        if (currentHour >= 5 && currentHour < 12) {
            timeGreeting = '¡Buenos días';
        } else if (currentHour >= 12 && currentHour < 18) {
            timeGreeting = '¡Buenas tardes';
        } else {
            timeGreeting = '¡Buenas noches';
        }
        
        if (this.userData.isLoggedIn && this.userData.userName) {
            return `${timeGreeting}, ${this.userData.userName}! 👋 Soy el asistente virtual de Restaurante Angello.`;
        } else {
            return `${timeGreeting}! 👋 Soy el asistente virtual de Restaurante Angello. Te invito a registrarte para una experiencia personalizada.`;
        }
    } 

    sendMessage() {
        const message = this.elements.input?.value.trim();
        if (!message) return;
        
        // Añadir mensaje del usuario
        this.addUserMessage(message);
        
        // Limpiar input
        this.elements.input.value = '';
        this.autoResizeInput();
        
        // Simular respuesta del bot
        this.showTypingIndicator();
        
        setTimeout(() => {
            this.hideTypingIndicator();
            const response = this.generateBotResponse(message);
            this.addBotMessage(response.message);
            
            // Asegurarnos de que el indicador se oculte después de añadir el mensaje
            setTimeout(() => {
                this.hideTypingIndicator();
            }, 100);
            
            if (response.suggestions) {
                this.updateQuickSuggestions(response.suggestions);
            }
        }, Math.random() * 1000 + 500);
    }

    sendSuggestion(suggestionText) {
        // Remover iconos del texto
        const cleanText = suggestionText.replace(/[🍕🛵📞🕐💰📋]/g, '').trim();
        this.elements.input.value = cleanText;
        this.sendMessage();
    }

    addUserMessage(message) {
        const messageDiv = this.createMessageElement(message, 'user');
        this.appendMessage(messageDiv);
    }

    addBotMessage(message) {
        const messageDiv = this.createMessageElement(message, 'bot');
        this.appendMessage(messageDiv);
    }

    createMessageElement(message, type) {
        this.messageId++;
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}-message`;
        messageDiv.id = `message-${this.messageId}`;
        messageDiv.textContent = message;
        
        return messageDiv;
    }

    appendMessage(messageElement) {
        this.elements.messages?.appendChild(messageElement);
        this.scrollToBottom();
    }

    scrollToBottom() {
        if (this.elements.messages) {
            this.elements.messages.scrollTop = this.elements.messages.scrollHeight;
        }
    }

    // ====================================================================
    // INDICADOR DE ESCRITURA
    // ====================================================================
    showTypingIndicator() {
        if (this.isTyping) return;
        
        // Asegurarnos de que no hay indicadores previos
        this.hideTypingIndicator();
        
        this.isTyping = true;
        const typingDiv = document.createElement('div');
        typingDiv.className = 'typing-indicator';
        typingDiv.id = 'typing-indicator-' + Date.now(); // ID único
        typingDiv.innerHTML = `
            <div class="typing-dots">
                <span></span>
                <span></span>
                <span></span>
            </div>
            <span class="typing-text">Angello está escribiendo...</span>
        `;
        
        this.appendMessage(typingDiv);
    }

    hideTypingIndicator() {
        // Buscar indicadores por ID y por clase
        const typingIndicator = document.getElementById('typing-indicator');
        const allTypingIndicators = document.querySelectorAll('.typing-indicator');
        
        // Función para remover indicador con animación
        const removeIndicator = (indicator) => {
            if (indicator && indicator.parentNode) {
                indicator.classList.add('hide');
                setTimeout(() => {
                    if (indicator.parentNode) {
                        indicator.parentNode.removeChild(indicator);
                    }
                }, 300);
            }
        };
        
        // Remover indicador específico
        if (typingIndicator) {
            removeIndicator(typingIndicator);
        }
        
        // Remover todos los indicadores de escritura
        allTypingIndicators.forEach(indicator => {
            removeIndicator(indicator);
        });
        
        this.isTyping = false;
    }

    // ====================================================================
    // GENERACIÓN DE RESPUESTAS INTELIGENTES
    // ====================================================================
    generateBotResponse(userMessage) {
        const message = userMessage.toLowerCase();
        
        // ========== HORARIOS Y ATENCIÓN ==========
        if (this.matchesKeywords(message, ['horario', 'hora', 'abierto', 'cerrado', 'atencion', 'atendemos', 'abre', 'cierra', 'cuando'])) {
            return {
                message: "🕐 **Nuestros horarios de atención son:**\n\n📅 **Martes a Domingo**\n⏰ **2:00 PM a 11:00 PM**\n\n⚠️ Los lunes estamos cerrados para mantenimiento.\n\n¿Te gustaría hacer una reserva o consultar sobre delivery?",
                suggestions: 'horarios'
            };
        }
        
        // ========== DELIVERY Y REPARTO ==========
        if (this.matchesKeywords(message, ['delivery', 'domicilio', 'entrega', 'reparto', 'llevar', 'envio', 'traer'])) {
            return {
                message: "🛵 **¡Sí, tenemos servicio de delivery!**\n\n📍 **Zonas de cobertura:** Cañete, Imperial y San Vicente\n⏰ **Horarios:** Martes a Domingo de 2:00 PM a 11:00 PM\n📞 **Pedidos:** (51) 987 654 321\n📱 **WhatsApp:** También puedes pedir por chat\n\n💡 Es muy fácil, ¡solo llámanos y te llevamos tu pedido!",
                suggestions: 'delivery'
            };
        }
        
        // ========== MENÚ Y CARTA ==========
        if (this.matchesKeywords(message, ['menu', 'carta', 'comida', 'platos', 'que venden', 'que ofrecen', 'especialidad', 'comer'])) {
            return {
                message: "🍽️ **Nuestro delicioso menú incluye:**\n\n🍗 **Pollos a la leña** - Nuestro plato estrella, marinado 24h\n🍕 **Pizzas artesanales** - Hawaiana, Pepperoni, Pizza Angello\n🍝 **Pastas frescas** - Al alfredo, boloñesa, al pesto\n🥗 **Ensaladas** - Frescas y nutritivas\n🍹 **Bebidas** - Refrescos, gaseosas, limonadas frozen\n\n¿Te interesa alguna categoría en particular?",
                suggestions: 'menu'
            };
        }
        
        // ========== PIZZAS ESPECÍFICAS ==========
        if (this.matchesKeywords(message, ['pizza', 'hawaiana', 'pepperoni', 'angello', 'mozzarella'])) {
            return {
                message: "🍕 **¡Nuestras pizzas son espectaculares!**\n\n🏝️ **Pizza Hawaiana** - Jamón, queso mozzarella, piña\n🌶️ **Pizza Pepperoni** - Pepperoni, queso mozzarella\n⭐ **Pizza Angello** - Nuestra especialidad con jamón, aceitunas, tocino, salame, cabanossi, pimiento\n\n💡 Puedes escoger dos sabores para tu pizza y agregar ingredientes extra.\n\n¿Te gustaría conocer los precios o hacer un pedido?",
                suggestions: 'pizza'
            };
        }
        
        // ========== POLLO A LA LEÑA ==========
        if (this.matchesKeywords(message, ['pollo', 'leña', 'asado', 'marinado', 'familiar'])) {
            return {
                message: "🍗 **¡Nuestro pollo a la leña es increíble!**\n\n✨ **Marinado por 24 horas** para máximo sabor\n🔥 **Cocido a la leña** - Jugoso por dentro, crujiente por fuera\n👨‍👩‍👧‍👦 **Promo Familiar:** 1 Pollo + Papas + Ensalada + Arroz + Camote + Gaseosa 1.5L\n\n🏆 Es nuestro plato estrella y el favorito de los clientes.\n\n¿Te gustaría conocer más sobre nuestras promociones?",
                suggestions: 'pollo'
            };
        }
        
        // ========== RESERVAS ==========
        if (this.matchesKeywords(message, ['reserva', 'reservar', 'mesa', 'cena', 'almuerzo', 'apartar'])) {
            return {
                message: "📋 **¡Perfecto! Te ayudo con tu reserva.**\n\n📞 **Teléfono:** (51) 987 654 321\n🌐 **Online:** También puedes reservar en nuestra página web\n\n⏰ **Horarios para reservas:**\n• Martes a Domingo: 2:00 PM - 11:00 PM\n• Lunes: Cerrado\n\n💡 Te recomendamos llamar con anticipación, especialmente fines de semana.\n\n¿Para cuántas personas sería la reserva?",
                suggestions: 'reserva'
            };
        }
        
        // ========== CONTACTO Y TELÉFONO ==========
        if (this.matchesKeywords(message, ['telefono', 'contacto', 'llamar', 'numero', 'whatsapp', 'celular'])) {
            return {
                message: "📞 **Información de contacto:**\n\n☎️ **Teléfono:** (51) 987 654 321\n📧 **Email:** contacto@ambito.com\n📱 **WhatsApp:** Disponible para pedidos\n\n🕐 **Horarios de atención telefónica:**\nMartes a Domingo de 2:00 PM a 11:00 PM\n\n💬 ¡Llámanos para pedidos, reservas o cualquier consulta!",
                suggestions: 'contacto'
            };
        }
        
        // ========== UBICACIÓN ==========
        if (this.matchesKeywords(message, ['donde', 'ubicacion', 'direccion', 'llegar', 'encuentran', 'quedan'])) {
            return {
                message: "📍 **Nuestra ubicación:**\n\n🏠 **Restaurante Angello**\nCañete, Perú\n\n🛵 **Zonas de delivery:**\n• Cañete\n• Imperial  \n• San Vicente\n\n🚗 Tenemos estacionamiento disponible\n📱 También puedes encontrarnos en redes sociales\n\n¿Necesitas que te enviemos la ubicación exacta por WhatsApp?",
                suggestions: 'ubicacion'
            };
        }
        
        // ========== PRECIOS ==========
        if (this.matchesKeywords(message, ['precio', 'costo', 'cuanto', 'vale', 'cobran', 'pagar'])) {
            return {
                message: "💰 **Información de precios:**\n\n🍕 **Pizzas:** Desde S/. 25 - S/. 35\n🍗 **Pollos:** Promo familiar completa\n🍝 **Pastas:** Precios accesibles\n🥗 **Ensaladas:** Opciones económicas\n\n📝 **Para ver precios completos:** Necesitas registrarte en nuestra página\n🎁 **Usuarios registrados:** Acceso a promociones exclusivas\n\n¿Te gustaría registrarte para ver todos los precios?",
                suggestions: 'precios'
            };
        }
        
        // ========== REGISTRO Y CUENTA ==========
        if (this.matchesKeywords(message, ['registro', 'cuenta', 'registrar', 'suscribir', 'usuario'])) {
            if (this.userData.isLoggedIn) {
                return {
                    message: `¡Hola ${this.userData.userName}! 👋\n\nYa tienes una cuenta activa en Restaurante Angello.\n\n✅ **Beneficios activos:**\n• Ver precios completos\n• Promociones exclusivas\n• Historial de pedidos\n• Reservas online\n\n¿Te gustaría ver nuestras promociones especiales?`,
                    suggestions: 'cuenta'
                };
            } else {
                return {
                    message: "📝 **¡Crear una cuenta es muy fácil!**\n\n🎁 **Beneficios de registrarte:**\n• Ver todos los precios\n• Promociones exclusivas\n• Pedidos más rápidos\n• Guardar favoritos\n• Newsletter con ofertas\n\n✨ El registro es completamente gratis y solo toma 1 minuto.\n\n¿Te gustaría que te guíe para registrarte?",
                    suggestions: 'registro'
                };
            }
        }
        
        // ========== PROMOCIONES ==========
        if (this.matchesKeywords(message, ['promocion', 'oferta', 'descuento', 'especial', 'combo'])) {
            if (this.userData.isLoggedIn) {
                return {
                    message: `🎉 **¡Promociones especiales para ti, ${this.userData.userName}!**\n\n🍗 **Promo Familiar:** 1 Pollo completo + acompañamientos + Gaseosa 1.5L\n🍕 **Combo Pizza:** 2 pizzas medianas + bebidas\n🌟 **Martes de Descuento:** 20% off en pastas\n\n📧 También recibirás ofertas exclusivas en tu email.\n\n¿Te interesa alguna promoción en particular?`,
                    suggestions: 'promociones'
                };
            } else {
                return {
                    message: "🎁 **¡Tenemos promociones increíbles!**\n\n🔐 **Para ver todas las promociones** necesitas registrarte\n✨ **Usuarios registrados** tienen acceso a:\n• Descuentos exclusivos\n• Combos especiales\n• Ofertas por temporada\n• Newsletter con cupones\n\n¿Te gustaría registrarte para acceder a todas las promociones?",
                    suggestions: 'registro'
                };
            }
        }
        
        // ========== SALUDOS Y DESPEDIDAS ==========
        if (this.matchesKeywords(message, ['hola', 'buenos', 'buenas', 'saludos'])) {
            const timeGreeting = this.getTimeGreeting();
            return {
                message: `${timeGreeting}! 😊\n\nBienvenido a Restaurante Angello, donde cada plato es una experiencia única.\n\n🍽️ ¿En qué puedo ayudarte hoy?\n• Ver nuestro menú\n• Hacer una reserva\n• Información de delivery\n• Conocer promociones`,
                suggestions: 'saludo'
            };
        }
        
        if (this.matchesKeywords(message, ['gracias', 'thank', 'agradezco'])) {
            return {
                message: "¡De nada! 😊 Ha sido un placer ayudarte.\n\n🍕 En Restaurante Angello siempre estamos para servirte.\n\n¿Hay algo más en lo que pueda asistirte?",
                suggestions: 'initial'
            };
        }
        
        if (this.matchesKeywords(message, ['adios', 'chau', 'bye', 'hasta luego', 'despedida'])) {
            return {
                message: "¡Hasta luego! 👋\n\n🍽️ Esperamos verte pronto en Restaurante Angello.\n\n📞 Recuerda que puedes llamarnos al (51) 987 654 321 para reservas o pedidos.\n\n¡Que tengas un excelente día!",
                suggestions: 'despedida'
            };
        }
        
        // ========== RESPUESTA POR DEFECTO ==========
        return {
            message: "🤔 Entiendo tu consulta, pero me gustaría ayudarte mejor.\n\n💡 **Puedo ayudarte con:**\n• 🍽️ Información del menú\n• 🕐 Horarios de atención\n• 📞 Datos de contacto\n• 🛵 Servicio de delivery\n• 📋 Hacer reservas\n• 💰 Precios y promociones\n\n¿Podrías ser más específico sobre lo que necesitas?",
            suggestions: 'general'
        };
    }

    // ====================================================================
    // FUNCIÓN AUXILIAR PARA RECONOCIMIENTO DE PALABRAS CLAVE
    // ====================================================================
    matchesKeywords(message, keywords) {
        return keywords.some(keyword => message.includes(keyword));
    }

    // ====================================================================
    // FUNCIÓN AUXILIAR PARA SALUDO SEGÚN HORA
    // ====================================================================
    getTimeGreeting() {
        const currentHour = new Date().getHours();
        if (currentHour >= 5 && currentHour < 12) {
            return '¡Buenos días';
        } else if (currentHour >= 12 && currentHour < 18) {
            return '¡Buenas tardes';
        } else {
            return '¡Buenas noches';
        }
    }

    // ====================================================================
    // SUGERENCIAS RÁPIDAS
    // ====================================================================
    updateQuickSuggestions(type = 'initial') {
        if (!this.elements.suggestions) return;
        
        const suggestions = this.getSuggestionsByType(type);
        
        this.elements.suggestions.innerHTML = suggestions
            .map(suggestion => `<button class="suggestion-btn">${suggestion}</button>`)
            .join('');
    }

    getSuggestionsByType(type) {
        const suggestionSets = {
            initial: [
                '🍽️ Ver menú',
                '🛵 Delivery',
                '📞 Contacto',
                '🕐 Horarios'
            ],
            menu: [
                '🍗 Pollo a la leña',
                '🍕 Pizzas',
                '🍝 Pastas',
                '🥗 Ensaladas'
            ],
            pizza: [
                '🏝️ Pizza Hawaiana',
                '🌶️ Pizza Pepperoni',
                '⭐ Pizza Angello',
                '💰 Ver precios'
            ],
            pollo: [
                '👨‍👩‍👧‍👦 Promo Familiar',
                '🔥 ¿Cómo lo preparan?',
                '📞 Hacer pedido',
                '🛵 Pedir delivery'
            ],
            reserva: [
                '📞 Llamar para reservar',
                '👥 Mesa para 4',
                '👥 Mesa para 6+',
                '🕐 Horarios disponibles'
            ],
            delivery: [
                '📞 Hacer pedido telefónico',
                '📱 Pedir por WhatsApp',
                '📍 Zona de cobertura',
                '🕐 Horarios de reparto'
            ],
            horarios: [
                '📅 ¿Abren los lunes?',
                '🛵 Horarios delivery',
                '📞 Teléfono',
                '📋 Hacer reserva'
            ],
            contacto: [
                '📞 Llamar ahora',
                '📱 WhatsApp',
                '📍 Ubicación',
                '🛵 Pedir delivery'
            ],
            ubicacion: [
                '🛵 Zonas de delivery',
                '🚗 ¿Hay estacionamiento?',
                '📱 Enviar ubicación',
                '📞 Cómo llegar'
            ],
            precios: [
                '📝 Registrarse para ver precios',
                '🎁 Ver promociones',
                '🍗 Precio promo familiar',
                '🍕 Precios de pizzas'
            ],
            promociones: [
                '🍗 Promo Familiar',
                '🍕 Combo Pizzas',
                '🌟 Descuento martes',
                '📧 Suscribirse ofertas'
            ],
            registro: [
                '📝 ¿Cómo registrarse?',
                '🎁 Beneficios registro',
                '🍕 Ver menú primero',
                '📞 Llamar mejor'
            ],
            cuenta: [
                '🎁 Ver promociones',
                '🍽️ Mi historial',
                '📧 Newsletter',
                '🔧 Actualizar datos'
            ],
            saludo: [
                '🍽️ Ver menú',
                '📋 Hacer reserva',
                '🛵 Pedir delivery',
                '📞 Contacto'
            ],
            despedida: [
                '📞 Llamar después',
                '📱 WhatsApp',
                '🍽️ Ver menú',
                '📋 Reservar mesa'
            ],
            general: [
                '🍽️ Ver menú completo',
                '📞 Contactar restaurante',
                '📋 Hacer una reserva',
                '🛵 Pedir por delivery'
            ]
        };
        
        return suggestionSets[type] || suggestionSets.initial;
    }

    // ====================================================================
    // UTILIDADES
    // ====================================================================
    autoResizeInput() {
        const input = this.elements.input;
        if (!input) return;
        
        input.style.height = 'auto';
        input.style.height = Math.min(input.scrollHeight, 120) + 'px';
        
        // Habilitar/deshabilitar botón de envío
        const hasText = input.value.trim().length > 0;
        this.elements.sendBtn?.toggleAttribute('disabled', !hasText);
    }

    // ====================================================================
    // API EXTERNA (para futuras integraciones)
    // ====================================================================
    async sendToServer(message) {
        try {
            const response = await fetch('/api/chatbot', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: message,
                    userId: this.userData.userId,
                    sessionId: 'current-session'
                })
            });
            
            if (response.ok) {
                const data = await response.json();
                return data.response;
            }
        } catch (error) {
            console.log('Error de conexión, usando respuestas locales');
        }
        
        return null;
    }
}

// ========================================================================
// INICIALIZACIÓN AUTOMÁTICA
// ========================================================================
document.addEventListener('DOMContentLoaded', function() {
    // Verificar que los elementos existan antes de inicializar
    if (document.getElementById('chatbot-toggle')) {
        window.angellloChatBot = new AngellloChatBot();
        console.log('✅ Chatbot Angello inicializado correctamente');
    } else {
        console.log('⚠️ Elementos del chatbot no encontrados');
    }
});

// Exportar para uso global si es necesario
window.AngellloChatBot = AngellloChatBot;
