document.querySelectorAll('.cart-item').forEach(item => {
const price = parseFloat(item.dataset.price || 0);
item.dataset.tooltip = `Total: $${price.toFixed(2)}`;
});

function highlightTotal() {
const totalElem = document.querySelector('.total');
totalElem.classList.add('highlight');
setTimeout(() => totalElem.classList.remove('highlight'), 800);
}

// Llamar highlightTotal() cuando se actualice el carrito
// Ejemplo:
// document.querySelector('.btn-add').addEventListener('click', highlightTotal);
