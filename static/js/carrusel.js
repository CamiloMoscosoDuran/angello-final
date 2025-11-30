let slideIndex = 1;
let slideInterval; // Variable para almacenar el temporizador automático

// 1. Inicialización: Muestra la primera diapositiva y comienza el carrusel automático
showSlides(slideIndex);
startAutoCarousel();

// 2. Controles Manuales (Llamados por los botones "<" y ">" y los puntos)
// Estas funciones detienen el ciclo automático momentáneamente y lo reinician.
function plusSlides(n) {
    stopAutoCarousel(); // Detiene el contador
    showSlides(slideIndex += n); // Muestra la siguiente diapositiva
    startAutoCarousel(); // Reinicia el contador
}

function currentSlide(n) {
    stopAutoCarousel(); // Detiene el contador
    showSlides(slideIndex = n); // Salta a la diapositiva específica
    startAutoCarousel(); // Reinicia el contador
}

// 3. Lógica Principal de Visualización
function showSlides(n) {
    let i;
    let slides = document.getElementsByClassName("carrusel-slide");
    let dots = document.getElementsByClassName("dot");

    // Lógica para que el carrusel dé la vuelta (loop)
    if (n > slides.length) { slideIndex = 1 }
    if (n < 1) { slideIndex = slides.length }

    // Ocultar todas las diapositivas y desactivar todos los puntos
    for (i = 0; i < slides.length; i++) {
        slides[i].style.display = "none";
    }
    for (i = 0; i < dots.length; i++) {
        dots[i].className = dots[i].className.replace(" active", "");
    }

    // Mostrar la diapositiva actual y activar su punto
    slides[slideIndex - 1].style.display = "block";
    dots[slideIndex - 1].className += " active";
}

// 4. Funciones de Automatización
function autoAdvance() {
    // Llama a showSlides, incrementando el índice en 1
    showSlides(slideIndex += 1);
}

function startAutoCarousel() {
    // Primero borra cualquier intervalo existente para evitar duplicados
    stopAutoCarousel(); 
    // Configura el intervalo para avanzar cada 3 segundos (3000 milisegundos)
    slideInterval = setInterval(autoAdvance, 3000); 
}

function stopAutoCarousel() {
    clearInterval(slideInterval);
}
