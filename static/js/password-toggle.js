// Función simple para mostrar/ocultar contraseña
function togglePassword() {
    const passwordInput = document.getElementById('contrasena');
    const eyeToggle = document.getElementById('eyeToggle');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        eyeToggle.innerHTML = '🙈';
    } else {
        passwordInput.type = 'password';
        eyeToggle.innerHTML = '👁️';
    }
}