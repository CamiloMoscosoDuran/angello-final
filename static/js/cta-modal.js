document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById('cta-modal');
    const closeBtn = document.getElementById('cta-close-btn');
    const body = document.body;
    
    // 1. Obtener el estado de login desde el atributo data-logged-in
    // El atributo es una cadena 'true' o 'false'.
    const loggedIn = body.dataset.loggedIn === 'true';
    
    // 2. Bandera de LocalStorage para saber si el usuario ya cerró el modal.
    // 'localStorage' persiste entre sesiones.
    const isDismissed = localStorage.getItem('ctaPromoDismissed');
    
    // Lógica de Aparición Única y para Visitantes:
    // Si el usuario ya está logueado O si ya cerró el modal antes, no hacemos nada.
    if (loggedIn || isDismissed === 'true') {
        return; 
    }

    // --- Funciones del Modal ---
    
    function showModal() {
        // Muestra el fondo (bg-opacity-50) y centra el contenido
        modal.classList.remove('hidden');
        modal.classList.add('flex'); 
    }

    function closeModal() {
        // Oculta el modal
        modal.classList.add('hidden');
        modal.classList.remove('flex');
        
        // Registrar en LocalStorage que el visitante ha cerrado el modal.
        localStorage.setItem('ctaPromoDismissed', 'true'); 
    }

    // Mostrar el modal automáticamente después de un pequeño retraso (1 segundo)
    setTimeout(showModal, 1000); 

    // Evento para cerrar el modal con el botón 'x'
    closeBtn.addEventListener('click', closeModal);

    // Evento para cerrar el modal al hacer clic en el fondo (fuera del contenido)
    modal.addEventListener('click', function(event) {
        if (event.target === modal) {
            closeModal();
        }
    });
});