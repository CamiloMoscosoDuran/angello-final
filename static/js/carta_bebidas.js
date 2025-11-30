document.addEventListener('DOMContentLoaded', function () {
  const cards = document.querySelectorAll('[data-target]');
  const sections = {
    'section-bebidas': document.getElementById('section-bebidas'),
    'section-barras': document.getElementById('section-barras'),
    'section-vino': document.getElementById('section-vino')
  };

  // Crear botón Mostrar todo
  const showAllBtn = document.createElement('button');
  showAllBtn.textContent = 'Mostrar todo';
  showAllBtn.className = 'show-all-btn';
  showAllBtn.style.position = 'fixed';
  showAllBtn.style.right = '16px';
  showAllBtn.style.bottom = '16px';
  showAllBtn.style.zIndex = '60';
  showAllBtn.style.padding = '10px 14px';
  showAllBtn.style.background = '#7a2b1f';
  showAllBtn.style.color = '#fff';
  showAllBtn.style.borderRadius = '6px';
  showAllBtn.style.border = 'none';
  showAllBtn.style.cursor = 'pointer';
  showAllBtn.style.display = 'none';
  document.body.appendChild(showAllBtn);

  function showSection(targetId) {
    Object.values(sections).forEach(function (s) {
      if (s) s.style.display = 'none';
    });
    const target = sections[targetId];
    if (target) {
      target.style.display = 'block';
      // marcar estado filtrado para aplicar estilos
      document.body.classList.add('filtered');
      if (document.documentElement) document.documentElement.classList.add('filtered');
      // ocultar el nav de secciones
      const nav = document.getElementById('sections-nav');
      if (nav) nav.style.display = 'none';
      // NO hacer scroll, dejar que el contenido se posicione naturalmente
      // después de que se reajuste el layout
      setTimeout(function() {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 100);
      showAllBtn.style.display = 'block';
    }
  }

  function showAll() {
    Object.values(sections).forEach(function (s) {
      if (s) s.style.display = 'block';
    });
    // quitar estado filtrado para restaurar fondo original
    document.body.classList.remove('filtered');
    if (document.documentElement) document.documentElement.classList.remove('filtered');
    // restaurar nav de secciones
    const nav = document.getElementById('sections-nav');
    if (nav) nav.style.display = 'flex';
    showAllBtn.style.display = 'none';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cards.forEach(function (card) {
    card.addEventListener('click', function (e) {
      e.preventDefault();
      const target = card.getAttribute('data-target');
      if (target) showSection(target);
    });
  });

  showAllBtn.addEventListener('click', showAll);

  // Manejar el botón "Volver a la Carta"
  const backBtn = document.getElementById('back-to-sections');
  if (backBtn) {
    backBtn.addEventListener('click', function(e) {
      e.preventDefault();
      // Si estamos en modo filtrado (viendo una sección), volver a mostrar todas las secciones
      if (document.body.classList.contains('filtered')) {
        showAll();
      } else {
        // Si ya estamos viendo todas las secciones, ir a la página principal de cartas
        window.location.href = '/nuestra-carta';
      }
    });
  }
});
