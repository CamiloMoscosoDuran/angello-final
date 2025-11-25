/**
 * Registro.js - Manejo del formulario de registro
 * Funcionalidades: Validación, UX mejorada, y manejo de errores
 */

document.addEventListener('DOMContentLoaded', function() {
    const form = document.querySelector('form');
    const nombreInput = document.getElementById('nombre');
    const correoInput = document.getElementById('correo');
    const contrasenaInput = document.getElementById('contrasena');
    const submitButton = document.querySelector('.btn-submit');

    // Elementos para mostrar mensajes de validación
    let validationMessages = {};

    /**
     * Crear elemento para mostrar mensajes de validación
     */
    function createValidationMessage(inputElement, message) {
        removeValidationMessage(inputElement);
        
        const messageElement = document.createElement('div');
        messageElement.className = 'validation-message text-red-500 text-sm mt-1';
        messageElement.textContent = message;
        
        inputElement.parentNode.appendChild(messageElement);
        validationMessages[inputElement.id] = messageElement;
    }

    /**
     * Remover mensaje de validación
     */
    function removeValidationMessage(inputElement) {
        if (validationMessages[inputElement.id]) {
            validationMessages[inputElement.id].remove();
            delete validationMessages[inputElement.id];
        }
    }

    /**
     * Validar nombre de usuario
     */
    function validateNombre(value) {
        if (!value) {
            return 'El nombre de usuario es requerido';
        }
        if (value.length < 3) {
            return 'El nombre debe tener al menos 3 caracteres';
        }
        if (value.length > 50) {
            return 'El nombre no puede tener más de 50 caracteres';
        }
        if (!/^[a-zA-Z0-9\s_-]+$/.test(value)) {
            return 'El nombre solo puede contener letras, números, espacios, guiones y guiones bajos';
        }
        return null;
    }

    /**
     * Validar correo electrónico
     */
    function validateCorreo(value) {
        if (!value) {
            return 'El correo electrónico es requerido';
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
            return 'Por favor ingresa un correo electrónico válido';
        }
        return null;
    }

    /**
     * Validar contraseña
     */
    function validateContrasena(value) {
        if (!value) {
            return 'La contraseña es requerida';
        }
        if (value.length < 6) {
            return 'La contraseña debe tener al menos 6 caracteres';
        }
        if (value.length > 100) {
            return 'La contraseña es demasiado larga';
        }
        return null;
    }

    /**
     * Validar campo individual
     */
    function validateField(inputElement) {
        const value = inputElement.value.trim();
        let error = null;

        switch (inputElement.id) {
            case 'nombre':
                error = validateNombre(value);
                break;
            case 'correo':
                error = validateCorreo(value);
                break;
            case 'contrasena':
                error = validateContrasena(value);
                break;
        }

        if (error) {
            inputElement.classList.add('border-red-500');
            inputElement.classList.remove('border-green-500');
            createValidationMessage(inputElement, error);
            return false;
        } else {
            inputElement.classList.remove('border-red-500');
            inputElement.classList.add('border-green-500');
            removeValidationMessage(inputElement);
            return true;
        }
    }

    /**
     * Validar todo el formulario
     */
    function validateForm() {
        const isNombreValid = validateField(nombreInput);
        const isCorreoValid = validateField(correoInput);
        const isContrasenaValid = validateField(contrasenaInput);

        const isFormValid = isNombreValid && isCorreoValid && isContrasenaValid;
        
        // Habilitar/deshabilitar botón de envío
        if (isFormValid) {
            submitButton.disabled = false;
            submitButton.classList.remove('opacity-50', 'cursor-not-allowed');
        } else {
            submitButton.disabled = true;
            submitButton.classList.add('opacity-50', 'cursor-not-allowed');
        }

        return isFormValid;
    }

    /**
     * Mostrar indicador de carga
     */
    function showLoadingState() {
        submitButton.disabled = true;
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Creando cuenta...';
        submitButton.classList.add('opacity-75');
    }

    /**
     * Ocultar indicador de carga
     */
    function hideLoadingState() {
        submitButton.disabled = false;
        submitButton.innerHTML = 'Crear Cuenta';
        submitButton.classList.remove('opacity-75');
    }

    /**
     * Animar entrada del formulario
     */
    function animateFormEntry() {
        const formCard = document.querySelector('.form-card');
        formCard.style.opacity = '0';
        formCard.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            formCard.style.transition = 'all 0.5s ease-out';
            formCard.style.opacity = '1';
            formCard.style.transform = 'translateY(0)';
        }, 100);
    }

    /**
     * Inicializar efectos visuales
     */
    function initializeVisualEffects() {
        // Animar entrada del formulario
        animateFormEntry();

        // Efectos de focus en los inputs
        const inputs = [nombreInput, correoInput, contrasenaInput];
        inputs.forEach(input => {
            input.addEventListener('focus', function() {
                this.parentNode.classList.add('transform', 'scale-105');
                this.parentNode.style.transition = 'transform 0.2s ease';
            });

            input.addEventListener('blur', function() {
                this.parentNode.classList.remove('transform', 'scale-105');
            });
        });

        // Efecto ripple en el botón
        submitButton.addEventListener('click', function(e) {
            const ripple = document.createElement('span');
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            
            ripple.style.cssText = `
                position: absolute;
                border-radius: 50%;
                transform: scale(0);
                animation: ripple 0.6s linear;
                background-color: rgba(255, 255, 255, 0.7);
                width: ${size}px;
                height: ${size}px;
                left: ${x}px;
                top: ${y}px;
            `;
            
            this.style.position = 'relative';
            this.style.overflow = 'hidden';
            this.appendChild(ripple);
            
            setTimeout(() => ripple.remove(), 600);
        });
    }

    // Event Listeners
    nombreInput.addEventListener('input', () => validateField(nombreInput));
    correoInput.addEventListener('input', () => validateField(correoInput));
    contrasenaInput.addEventListener('input', () => validateField(contrasenaInput));
    
    nombreInput.addEventListener('blur', () => validateField(nombreInput));
    correoInput.addEventListener('blur', () => validateField(correoInput));
    contrasenaInput.addEventListener('blur', () => validateField(contrasenaInput));

    // Validación en tiempo real del formulario completo
    form.addEventListener('input', validateForm);

    // Manejo del envío del formulario
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        if (!validateForm()) {
            // Enfocar el primer campo con error
            const firstErrorField = document.querySelector('.border-red-500');
            if (firstErrorField) {
                firstErrorField.focus();
                firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            return;
        }

        showLoadingState();

        // Simular delay para mejor UX
        setTimeout(() => {
            // Enviar el formulario
            this.submit();
        }, 500);
    });

    // Inicializar efectos visuales
    initializeVisualEffects();

    // Validación inicial
    validateForm();

    // CSS para animaciones
    const style = document.createElement('style');
    style.textContent = `
        @keyframes ripple {
            to {
                transform: scale(4);
                opacity: 0;
            }
        }
        
        .validation-message {
            animation: slideDown 0.3s ease-out;
        }
        
        @keyframes slideDown {
            from {
                opacity: 0;
                transform: translateY(-10px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
    `;
    document.head.appendChild(style);

    console.log('🎉 Registro.js cargado correctamente');
});