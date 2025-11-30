const btnAbrir = document.getElementById('abrirMesa');
const modal = document.getElementById('modalMesa');
const overlay = document.getElementById('overlay');
const btnConfirmar = document.getElementById('confirmarMesa');
const btnCerrar = document.getElementById('cerrarMesa');
const inputMesa = document.getElementById('mesaSeleccionada');

// Abrir modal
btnAbrir.addEventListener('click', () => {
  modal.style.display = 'flex';
  overlay.style.display = 'block';
});

// Confirmar mesa
btnConfirmar.addEventListener('click', () => {
  inputMesa.value = "Mesa seleccionada";
  alert('Mesa confirmada correctamente.');
  modal.style.display = 'none';
  overlay.style.display = 'none';
});

// Cerrar modal
btnCerrar.addEventListener('click', () => {
  modal.style.display = 'none';
  overlay.style.display = 'none';
});

// Cerrar al hacer clic en overlay
overlay.addEventListener('click', () => {
  modal.style.display = 'none';
  overlay.style.display = 'none';
});
