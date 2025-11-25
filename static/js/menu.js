// static/js/menu.js
// Lógica mejorada para el menú responsivo con diseño optimizado

document.addEventListener('DOMContentLoaded', function() {
    function initResponsiveNav() {
        const MOBILE_BREAKPOINT = 768; // px
        const TABLET_BREAKPOINT = 1024; // px
        const navs = document.querySelectorAll('nav.navbar');

        // Limpiar elementos duplicados existentes antes de crear nuevos
        navs.forEach(nav => {
            const existingToggles = nav.querySelectorAll('.nav-toggle');
            const existingMenus = nav.querySelectorAll('.nav-mobile-menu');
            
            // Remover duplicados (mantener solo el primero si existe)
            if (existingToggles.length > 1) {
                for (let i = 1; i < existingToggles.length; i++) {
                    existingToggles[i].remove();
                }
            }
            
            if (existingMenus.length > 1) {
                for (let i = 1; i < existingMenus.length; i++) {
                    existingMenus[i].remove();
                }
            }
        });

        navs.forEach(nav => {
            const linksContainer = nav.querySelector('.links');
            const userActions = nav.querySelector('.user-actions');
            
            if (!linksContainer) return;

            // Verificar si ya existe un botón hamburguesa para evitar duplicados
            if (nav.querySelector('.nav-toggle')) {
                return; // Ya se procesó este navbar
            }

            // Crear botón hamburguesa
            const toggle = document.createElement('button');
            toggle.setAttribute('aria-expanded', 'false');
            toggle.setAttribute('aria-label', 'Abrir menú');
            toggle.className = 'nav-toggle';
            toggle.innerHTML = `
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            `;

            // Insertar el botón antes de las acciones de usuario
            if (userActions) {
                nav.insertBefore(toggle, userActions);
            } else {
                nav.appendChild(toggle);
            }

            // Crear contenedor del menú móvil
            const existingMobileMenu = nav.querySelector('.nav-mobile-menu');
            let mobileMenu;
            
            if (existingMobileMenu) {
                mobileMenu = existingMobileMenu;
            } else {
                mobileMenu = document.createElement('div');
                mobileMenu.className = 'nav-mobile-menu';
                mobileMenu.style.display = 'none';
                nav.appendChild(mobileMenu);
            }

            // Función para mover elementos al menú móvil
            function populateMobileMenu() {
                // Limpiar menú móvil
                mobileMenu.innerHTML = '';
                
                // Obtener todos los enlaces del navbar principal
                const allLinks = linksContainer.querySelectorAll('a');
                const userActionElements = userActions ? userActions.querySelectorAll('a, button, .saludo') : [];
                
                // En móvil: mover TODOS los enlaces al menú
                // En tablet/desktop: mover solo los que no tienen clase 'main-link'
                const windowWidth = window.innerWidth;
                
                if (windowWidth <= MOBILE_BREAKPOINT) {
                    // Móvil: agregar todos los enlaces
                    allLinks.forEach(link => {
                        const menuItem = link.cloneNode(true);
                        menuItem.style.display = 'block';
                        mobileMenu.appendChild(menuItem);
                    });
                    
                    // Agregar separador si hay acciones de usuario
                    if (userActionElements.length > 0) {
                        const separator = document.createElement('div');
                        separator.style.borderTop = '1px solid rgba(255, 184, 107, 0.3)';
                        separator.style.margin = '0.5rem 0';
                        mobileMenu.appendChild(separator);
                        
                        // Agregar acciones de usuario
                        userActionElements.forEach(element => {
                            const menuItem = element.cloneNode(true);
                            menuItem.style.display = 'block';
                            mobileMenu.appendChild(menuItem);
                        });
                    }
                } else if (windowWidth <= TABLET_BREAKPOINT) {
                    // Tablet/Desktop: solo agregar enlaces que no son principales
                    allLinks.forEach(link => {
                        if (!link.classList.contains('main-link')) {
                            const menuItem = link.cloneNode(true);
                            menuItem.style.display = 'block';
                            mobileMenu.appendChild(menuItem);
                        }
                    });
                }
            }

            // Función para actualizar la visibilidad de elementos
            function updateNavVisibility() {
                const windowWidth = window.innerWidth;
                
                if (windowWidth <= MOBILE_BREAKPOINT) {
                    // Móvil: ocultar enlaces principales y acciones de usuario, mostrar toggle
                    linksContainer.style.display = 'none';
                    if (userActions) userActions.style.display = 'none';
                    toggle.style.display = 'block';
                    
                    // Ocultar texto del logo en móvil
                    const logoText = nav.querySelector('.logo span');
                    if (logoText) logoText.style.display = 'none';
                    
                } else if (windowWidth <= TABLET_BREAKPOINT) {
                    // Tablet/Desktop: mostrar algunos enlaces principales, ocultar otros
                    linksContainer.style.display = 'flex';
                    if (userActions) userActions.style.display = 'flex';
                    toggle.style.display = 'block';
                    
                    // Mostrar texto del logo
                    const logoText = nav.querySelector('.logo span');
                    if (logoText) logoText.style.display = 'inline';
                    
                    // Ocultar enlaces que no son principales
                    const allLinks = linksContainer.querySelectorAll('a');
                    allLinks.forEach(link => {
                        if (link.classList.contains('main-link')) {
                            link.style.display = 'block';
                        } else {
                            link.style.display = 'none';
                        }
                    });
                    
                } else {
                    // Desktop grande: mostrar todo, ocultar toggle
                    linksContainer.style.display = 'flex';
                    if (userActions) userActions.style.display = 'flex';
                    toggle.style.display = 'none';
                    mobileMenu.style.display = 'none';
                    
                    // Mostrar todos los enlaces
                    const allLinks = linksContainer.querySelectorAll('a');
                    allLinks.forEach(link => {
                        link.style.display = 'block';
                    });
                    
                    // Mostrar texto del logo
                    const logoText = nav.querySelector('.logo span');
                    if (logoText) logoText.style.display = 'inline';
                }
                
                populateMobileMenu();
                
                // Actualizar posición del menú móvil
                const rect = nav.getBoundingClientRect();
                mobileMenu.style.top = `${nav.offsetHeight + 8}px`;
            }

            // Event listener para el botón toggle
            toggle.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                const isOpen = toggle.getAttribute('aria-expanded') === 'true';
                
                if (isOpen) {
                    mobileMenu.style.display = 'none';
                    toggle.setAttribute('aria-expanded', 'false');
                } else {
                    mobileMenu.style.display = 'block';
                    toggle.setAttribute('aria-expanded', 'true');
                }
            });

            // Cerrar menú al hacer clic fuera
            document.addEventListener('click', function(e) {
                if (!nav.contains(e.target)) {
                    mobileMenu.style.display = 'none';
                    toggle.setAttribute('aria-expanded', 'false');
                }
            });

            // Event listener para resize
            let resizeTimer;
            window.addEventListener('resize', function() {
                clearTimeout(resizeTimer);
                resizeTimer = setTimeout(function() {
                    mobileMenu.style.display = 'none';
                    toggle.setAttribute('aria-expanded', 'false');
                    updateNavVisibility();
                }, 100);
            });

            // Inicializar
            updateNavVisibility();
        });
    }

    initResponsiveNav();
});

