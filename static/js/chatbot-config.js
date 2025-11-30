// ========================================================================
// CONFIGURACIÓN DE DATOS DEL CHATBOT
// ========================================================================

// Función para obtener datos del usuario desde elementos meta del HTML
function getChatbotUserData() {
    // Buscar datos en elementos meta o data attributes
    const userDataElement = document.querySelector('[data-user-info]');
    
    if (userDataElement) {
        try {
            return JSON.parse(userDataElement.getAttribute('data-user-info'));
        } catch (e) {
            console.warn('Error parsing user data:', e);
        }
    }
    
    // Fallback: buscar en localStorage o elementos específicos
    const isLoggedIn = document.body.hasAttribute('data-logged-in');
    const userName = document.body.getAttribute('data-user-name') || '';
    const userId = document.body.getAttribute('data-user-id') || null;
    
    return {
        isLoggedIn: isLoggedIn,
        userName: userName,
        userId: userId ? parseInt(userId) : null
    };
}

// Configuración global del chatbot
window.getChatbotUserData = getChatbotUserData;