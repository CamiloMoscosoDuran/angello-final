// --- AGREGAR ---
function agregarAlCarrito(id, nombre, precio) {
    fetch("/agregar_carrito", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, nombre, precio })
    })
    .then(r => r.json())
    .then(data => {
        document.getElementById("contador-carrito").innerText = data.cantidad;
        mostrarCarritoFlotante(data.items);
    });
}

// --- MOSTRAR CARRITO FLOTANTE ---
function mostrarCarritoFlotante(items) {
    let lista = document.getElementById("lista-carrito");
    lista.innerHTML = "";

    items.forEach(item => {
        let li = document.createElement("li");
        li.textContent = `${item.nombre} x${item.cantidad}`;
        lista.appendChild(li);
    });

    document.getElementById("carrito-flotante").classList.remove("hidden");
}

// --- ELIMINAR ---
function eliminarProducto(id) {
    fetch("/eliminar_carrito", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
    }).then(() => location.reload());
}

// --- ACTUALIZAR CANTIDAD ---
function actualizarCantidad(id, cantidad) {
    fetch("/actualizar_cantidad", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, cantidad })
    }).then(() => location.reload());
}
