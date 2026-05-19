let carrito = [];

function cargarMenu() {
    fetch('api_productos.php')
    .then(response => response.json())
    .then(productos => {
        const cuerpoMenu = document.getElementById('cuerpoMenu');
        cuerpoMenu.innerHTML = '';
        productos.forEach(producto => {
            const fila = document.createElement('tr');
            fila.className = 'fila-producto';
            fila.innerHTML = `
                <td class="nombre-producto">${producto.nombre}</td>
                <td>$${parseFloat(producto.precio).toFixed(2)}</td>
                <td>${producto.stock}</td>
                <td><button class="btn-agregar" onclick="agregarAlCarrito(${producto.id}, '${producto.nombre}', ${producto.precio})">+</button></td>
            `;
            cuerpoMenu.appendChild(fila);
        });
        document.getElementById('buscador').value = '';
        filtrarMenu(); 
    })
    .catch(error => console.error('Error:', error));
}

function filtrarMenu() {
    const textoBusqueda = document.getElementById('buscador').value.toLowerCase();
    const filas = document.querySelectorAll('.fila-producto');

    filas.forEach(fila => {
        const nombreProducto = fila.querySelector('.nombre-producto').innerText.toLowerCase();
        if (nombreProducto.includes(textoBusqueda)) {
            fila.style.display = '';
        } else {
            fila.style.display = 'none';
        }
    });
}

function agregarAlCarrito(id, nombre, precio) {
    const index = carrito.findIndex(item => item.id === id);
    if (index !== -1) {
        carrito[index].cantidad += 1;
    } else {
        carrito.push({ id: id, nombre: nombre, precio: parseFloat(precio), cantidad: 1 });
    }
    actualizarTicket();
}

function removerDelCarrito(id) {
    carrito = carrito.filter(item => item.id !== id);
    actualizarTicket();
}

function actualizarTicket() {
    const cuerpoTicket = document.getElementById('cuerpoTicket');
    const totalVentaElem = document.getElementById('totalVenta');
    cuerpoTicket.innerHTML = '';
    let total = 0;

    carrito.forEach(item => {
        const subtotal = item.cantidad * item.precio;
        total += subtotal;
        const fila = document.createElement('tr');
        fila.innerHTML = `
            <td>${item.cantidad}</td>
            <td>${item.nombre}</td>
            <td>$${subtotal.toFixed(2)}</td>
            <td><button class="btn-eliminar" onclick="removerDelCarrito(${item.id})">X</button></td>
        `;
        cuerpoTicket.appendChild(fila);
    });
    totalVentaElem.innerText = total.toFixed(2);
}

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
            cargarMenu(); 
        } else {
            alert("Error: " + data.message);
        }
    })
    .catch(error => alert("Ocurrió un error."))
    .finally(() => {
        btnCobrar.disabled = false;
        btnCobrar.innerText = "Completar Venta";
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
            hr { border: none; border-top: 1px dashed #000; margin: 5px 0; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
            th, td { text-align: left; padding: 2px 0; }
            th:last-child, td:last-child { text-align: right; }
            .total { text-align: right; font-weight: bold; font-size: 14px; margin-top: 5px; }
        </style></head><body>
        <div class="header"><h2>Cafetería Escolar</h2><p>Folio Venta: #${ventaId}</p><p>Fecha: ${new Date().toLocaleString('es-MX')}</p><hr></div>
        <table><thead><tr><th>Cant</th><th>Articulo</th><th>Subt</th></tr></thead><tbody>
    `;

    carritoComprado.forEach(item => {
        let subtotal = item.cantidad * item.precio;
        total += subtotal;
        ticketHTML += `<tr><td>${item.cantidad}</td><td>${item.nombre.substring(0, 12)}</td><td>$${subtotal.toFixed(2)}</td></tr>`;
    });

    ticketHTML += `</tbody></table><hr><div class="total">TOTAL: $${total.toFixed(2)}</div><div class="footer"><hr><p>¡Gracias por su compra!</p></div></body></html>`;

    let ventanaPrint = window.open('', '_blank', 'width=300,height=500');
    ventanaPrint.document.write(ticketHTML);
    ventanaPrint.document.close();
    ventanaPrint.focus();
    setTimeout(() => { ventanaPrint.print(); ventanaPrint.close(); }, 500);
}

document.addEventListener('DOMContentLoaded', () => {
    cargarMenu();
    document.getElementById('buscador').addEventListener('input', filtrarMenu);
});