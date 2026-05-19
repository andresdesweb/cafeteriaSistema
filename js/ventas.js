let carrito = [];
let categoriaActual = 'Todos';
let productosGlobal = []; // Guardará el inventario real de tu base de datos

// ==========================================
// 1. OBTENER DATOS REALES (BACKEND)
// ==========================================
function cargarMenu() {
    fetch('api_productos.php')
    .then(response => response.json())
    .then(productos => {
        productosGlobal = productos; // Guardamos los datos para filtrar localmente
        document.getElementById('buscador').value = ''; // Limpiamos buscador
        renderizarTarjetas();
    })
    .catch(error => console.error('Error al cargar productos reales:', error));
}

// ==========================================
// 2. RENDERIZAR Y FILTRAR LA INTERFAZ
// ==========================================
function renderizarTarjetas() {
    const cuerpoMenu = document.getElementById('cuerpoMenu');
    cuerpoMenu.innerHTML = '';
    
    const textoBusqueda = document.getElementById('buscador').value.toLowerCase();

    // Filtramos los productos del arreglo global
    const productosFiltrados = productosGlobal.filter(producto => {
        const coincideCategoria = categoriaActual === 'Todos' || producto.categoria === categoriaActual;
        const coincideBusqueda = producto.nombre.toLowerCase().includes(textoBusqueda);
        return coincideCategoria && coincideBusqueda;
    });

    productosFiltrados.forEach(producto => {
        // Validación de seguridad por si un producto viejo no tiene imagen
        const urlImagen = (producto.imagen_url && producto.imagen_url.trim() !== '') 
                          ? producto.imagen_url 
                          : 'https://placehold.co/300x300/f8f9fa/333?text=Sin+Imagen';

        const tarjeta = document.createElement('div');
        tarjeta.className = 'producto-card';
        tarjeta.innerHTML = `
            <img src="${urlImagen}" alt="${producto.nombre}" class="producto-img">
            <div class="producto-info">
                <h3>${producto.nombre}</h3>
                <p>$${parseFloat(producto.precio).toFixed(2)}</p>
                <p style="font-size: 0.8em; color: #aaa;">Stock: ${producto.stock}</p>
            </div>
            <button class="btn-add-circular" onclick="agregarAlCarrito(${producto.id}, '${producto.nombre}', ${producto.precio}, '${urlImagen}')">+</button>
        `;
        cuerpoMenu.appendChild(tarjeta);
    });
}

function filtrarCategoria(categoria) {
    categoriaActual = categoria;
    
    const botones = document.querySelectorAll('.btn-categoria');
    botones.forEach(btn => {
        if(btn.innerText === categoria || (categoria === 'Todos' && btn.innerText === 'All Items')) {
            btn.classList.add('activa');
        } else {
            btn.classList.remove('activa');
        }
    });

    renderizarTarjetas(); // Solo repintamos, no hacemos un fetch nuevo a la BD
}

// Escuchamos el buscador
document.getElementById('buscador').addEventListener('input', renderizarTarjetas);

// ==========================================
// 3. LÓGICA DEL CARRITO 
// ==========================================
function agregarAlCarrito(id, nombre, precio, imagen) {
    const index = carrito.findIndex(item => item.id === id);
    if (index !== -1) {
        carrito[index].cantidad += 1;
    } else {
        carrito.push({ id, nombre, precio: parseFloat(precio), imagen, cantidad: 1 });
    }
    actualizarTicket();
}

function cambiarCantidad(id, delta) {
    const index = carrito.findIndex(item => item.id === id);
    if (index !== -1) {
        carrito[index].cantidad += delta;
        if (carrito[index].cantidad <= 0) {
            carrito.splice(index, 1);
        }
    }
    actualizarTicket();
}

function actualizarTicket() {
    const cuerpoTicket = document.getElementById('cuerpoTicket');
    const totalVentaElem = document.getElementById('totalVenta');
    cuerpoTicket.innerHTML = '';
    let total = 0;

    if(carrito.length === 0) {
        cuerpoTicket.innerHTML = '<p style="text-align:center; color:#999; margin-top:50px;">La orden está vacía</p>';
    }

    carrito.forEach(item => {
        const subtotal = item.cantidad * item.precio;
        total += subtotal;
        
        const fila = document.createElement('div');
        fila.className = 'cart-item';
        fila.innerHTML = `
            <img src="${item.imagen}" class="cart-item-img">
            <div class="cart-item-info">
                <h4>${item.nombre}</h4>
                <p>$${item.precio.toFixed(2)} c/u</p>
            </div>
            <div class="cart-item-actions">
                <button onclick="cambiarCantidad(${item.id}, -1)">-</button>
                <strong>${item.cantidad}</strong>
                <button onclick="cambiarCantidad(${item.id}, 1)">+</button>
            </div>
        `;
        cuerpoTicket.appendChild(fila);
    });
    
    totalVentaElem.innerText = total.toFixed(2);
}

// ==========================================
// 4. PROCESAR VENTA REAL EN MYSQL
// ==========================================
function procesarVenta() {
    if (carrito.length === 0) {
        alert("El ticket está vacío.");
        return;
    }

    const btnCobrar = document.getElementById('btnCobrar');
    btnCobrar.disabled = true;
    btnCobrar.innerText = "Procesando...";

    fetch('api_ventas.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(carrito)
    })
    .then(response => response.json())
    .then(data => {
        if(data.status === 'success') {
            imprimirTicket(carrito, data.venta_id);
            carrito = [];
            actualizarTicket();
            cargarMenu(); // Recargamos de la BD para actualizar los niveles de stock en pantalla
        } else {
            alert("Error: " + data.message);
        }
    })
    .catch(error => {
        console.error('Error al procesar la venta:', error);
        alert("Ocurrió un error en la comunicación con el servidor.");
    })
    .finally(() => {
        btnCobrar.disabled = false;
        btnCobrar.innerText = "Cobrar Orden";
    });
}

function imprimirTicket(carritoComprado, ventaId) {
    let total = 0;
    let ticketHTML = `
        <!DOCTYPE html>
        <html><head><title>Ticket</title><style>
            body { font-family: 'Courier New', Courier, monospace; font-size: 12px; margin: 0; padding: 10px; width: 250px; }
            .header, .footer { text-align: center; margin-bottom: 10px; }
            h2 { margin: 0; font-size: 16px; }
            p { margin: 2px 0; }
            hr { border: none; border-top: 1px dashed #000; margin: 5px 0; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
            th, td { text-align: left; padding: 2px 0; }
            th:last-child, td:last-child { text-align: right; }
            .total { text-align: right; font-weight: bold; font-size: 14px; margin-top: 5px; }
        </style></head><body>
        <div class="header">
            <h2>Cafetería Escolar</h2>
            <p>Folio Venta: #${ventaId}</p>
            <p>Fecha: ${new Date().toLocaleString('es-MX')}</p>
            <hr>
        </div>
        <table><thead><tr><th>Cant</th><th>Articulo</th><th>Subt</th></tr></thead><tbody>
    `;

    carritoComprado.forEach(item => {
        let subtotal = item.cantidad * item.precio;
        total += subtotal;
        ticketHTML += `<tr><td>${item.cantidad}</td><td>${item.nombre.substring(0, 12)}</td><td>$${subtotal.toFixed(2)}</td></tr>`;
    });

    ticketHTML += `
        </tbody></table><hr><div class="total">TOTAL: $${total.toFixed(2)}</div>
        <div class="footer"><hr><p>¡Gracias por su compra!</p></div>
        </body></html>
    `;

    let ventanaPrint = window.open('', '_blank', 'width=300,height=500');
    ventanaPrint.document.write(ticketHTML);
    ventanaPrint.document.close();
    ventanaPrint.focus();
    setTimeout(() => { ventanaPrint.print(); ventanaPrint.close(); }, 500);
}

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    cargarMenu();
    actualizarTicket();
});