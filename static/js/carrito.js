// ============================================
//   🔥 ALERTA BONITA
// ============================================
function alerta(msg) {
    // Reutiliza un contenedor de alertas para manejar varias notificaciones
    let container = document.getElementById('alertas-global');
    if (!container) {
        container = document.createElement('div');
        container.id = 'alertas-global';
        container.style.position = 'fixed';
        container.style.right = '20px';
        container.style.top = '24%';
        container.style.zIndex = '2200';
        container.style.display = 'flex';
        container.style.flexDirection = 'column';
        container.style.gap = '8px';
        document.body.appendChild(container);
    }

    const div = document.createElement('div');
    div.className = 'alerta-carrito';
    div.setAttribute('role', 'status');
    div.setAttribute('aria-live', 'polite');
    div.innerHTML = `✅ ${msg}`;

    container.appendChild(div);

    // for accessibility: focus briefly off-screen (non intrusive)
    // mostrar animación
    requestAnimationFrame(() => div.classList.add('show'));

    // auto-hide timer
    setTimeout(() => div.classList.remove('show'), 1500);
    setTimeout(() => div.remove(), 1900);

    // small pulse on the contador if exists
    const contador = document.getElementById('contador-carrito');
    if (contador) {
        contador.classList.add('contador-pulse');
        setTimeout(() => contador.classList.remove('contador-pulse'), 900);
    }
}

// ============================================
//   🔢 ACTUALIZAR CONTADOR
// ============================================
function actualizarContadorCarrito(cantidad) {
    let contador = document.getElementById("contador-carrito");
    if (contador) contador.innerText = cantidad;
}

// ============================================
//   🛒 AGREGAR AL CARRITO (VERSIÓN FINAL)
// ============================================
function agregarAlCarrito(id, nombre, precio, img = "") {

    fetch("/agregar_carrito", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            id: id,
            nombre: nombre,
            precio: precio,
            img: img,
            cantidad: 1
        })
    })
    .then(res => {
        if (res.status === 403) {
            alerta("Debes iniciar sesión");
            window.location.href = "/inicio_secion";
            return;
        }
        return res.json();
    })
    .then(data => {
        if (!data) return;

        actualizarContadorCarrito(data.cart_count);
        alerta("Producto añadido");

        mostrarCarritoFlotante(data.items);
    })
    .catch(err => {
        console.error("Error:", err);
        alerta("Error al agregar al carrito");
    });
}

// ============================================
//   🛒 CARRITO FLOTANTE
// ============================================
function mostrarCarritoFlotante(items) {
    let lista = document.getElementById("lista-carrito");
    let panel = document.getElementById("carrito-flotante");

    if (!lista || !panel) return;

    lista.innerHTML = "";
    // crear elementos con miniatura si está disponible
    items.forEach((item, index) => {
        let li = document.createElement("li");
        li.classList.add('carrito-item');
        if (item.img) {
            li.innerHTML = `<img src="${item.img}" alt="${item.nombre}" class="thumb"> <div><strong>${item.nombre}</strong> <div style="font-size:0.9rem;color:var(--muted,#e0d9c4)">x${item.cantidad} — S/ ${item.precio}</div></div>`;
        } else {
            li.innerHTML = `<div><strong>${item.nombre}</strong> <div style="font-size:0.9rem;color:var(--muted,#e0d9c4)">x${item.cantidad} — S/ ${item.precio}</div></div>`;
        }

        // mark newest item for a richer effect
        if (index === 0) li.classList.add('new');

        lista.appendChild(li);
    });

    // mostrar panel con animación
    panel.classList.add('show');

    // animar items con pequeño retraso escalonado
    const itemsNodes = lista.querySelectorAll('.carrito-item');
    itemsNodes.forEach((n, idx) => {
        n.style.animationDelay = (idx * 70) + 'ms';
        // trigger
        requestAnimationFrame(() => n.classList.add('animate'));
    });

    // permitir que el usuario mantenga el panel visible al posar el ratón
    let hideKey = 'carritoHideTimer';
    if (panel[hideKey]) clearTimeout(panel[hideKey]);

    const startHideTimer = () => {
        panel[hideKey] = setTimeout(() => panel.classList.remove('show'), 3000);
    };

    panel.addEventListener('mouseenter', () => { if (panel[hideKey]) clearTimeout(panel[hideKey]); });
    panel.addEventListener('mouseleave', () => startHideTimer());

    // iniciar el timer la primera vez
    startHideTimer();
}

// ============================================
//   🗑 ELIMINAR PRODUCTO
// ============================================
function eliminarProducto(id) {

    fetch("/eliminar_carrito", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
    })
    .then(() => location.reload())
    .catch(() => alerta("Error al eliminar producto"));
}

// ============================================
//   🔄 ACTUALIZAR CANTIDAD
// ============================================
function actualizarCantidad(id, cantidad) {

    fetch("/actualizar_cantidad", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, cantidad })
    })
    .then(() => location.reload())
    .catch(() => alerta("Error al actualizar cantidad"));
}

// ============================================
//   🎯 CAPTURAR CLICK DE LOS BOTONES
// ============================================
document.addEventListener("click", e => {

    if (e.target.classList.contains("add-to-cart") ||
        e.target.classList.contains("btn-add-cart") ||
        e.target.classList.contains("add-to-cart-btn") ||
        e.target.classList.contains("btn-añadir")) {

        e.preventDefault();

        let btn = e.target;

        let nombre = btn.dataset.nombre;
        let precio = parseFloat(btn.dataset.precio);
        let img = btn.dataset.img || "";

        if (!nombre || !precio) {
            console.error("Faltan datos en el botón:", btn);
            return alerta("Error: botón mal configurado.");
        }

        // Enviar solo el nombre, el backend buscará el ID
        agregarAlCarrito(null, nombre, precio, img);
    }
});
