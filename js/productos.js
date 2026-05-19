function cargarInventario() {
    fetch('api_productos.php')
    .then(response => response.json())
    .then(productos => {
        const cuerpoTabla = document.getElementById('cuerpoTabla');
        cuerpoTabla.innerHTML = '';
        productos.forEach(producto => {
            const fila = document.createElement('tr');
            fila.innerHTML = `
                <td>${producto.id}</td>
                <td>${producto.nombre}</td>
                <td>${producto.descripcion}</td>
                <td>$${parseFloat(producto.precio).toFixed(2)}</td>
                <td><strong>${producto.stock}</strong></td>
                <td>
                    <button class="btn-editar" onclick="modificarStock(${producto.id}, '${producto.nombre}', ${producto.stock})">Actualizar Stock</button>
                </td>
            `;
            cuerpoTabla.appendChild(fila);
        });
    })
    .catch(error => console.error('Error:', error));
}

function modificarStock(id, nombre, stockActual) {
    let nuevoStock = prompt(`Ingrese el NUEVO stock total para "${nombre}":\n(Stock actual: ${stockActual})`, stockActual);
    if (nuevoStock === null || nuevoStock.trim() === "") return;
    
    nuevoStock = parseInt(nuevoStock);
    if (isNaN(nuevoStock) || nuevoStock < 0) {
        alert("Por favor, ingrese una cantidad válida.");
        return;
    }

    fetch('api_productos.php', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: id, stock: nuevoStock })
    })
    .then(response => response.json())
    .then(data => {
        if(data.status === 'success') {
            cargarInventario(); 
        } else {
            alert("Error: " + data.message);
        }
    })
    .catch(error => console.error('Error al actualizar:', error));
}

document.addEventListener('DOMContentLoaded', () => {
    cargarInventario();

    document.getElementById('formProducto').addEventListener('submit', function(e) {
        e.preventDefault();
        const producto = {
            nombre: document.getElementById('nombre').value,
            descripcion: document.getElementById('descripcion').value,
            precio: document.getElementById('precio').value,
            stock: document.getElementById('stock').value
        };

        fetch('api_productos.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(producto)
        })
        .then(response => response.json())
        .then(data => {
            document.getElementById('mensaje').innerHTML = `<p style="color: green;">${data.message}</p>`;
            if(data.status === 'success') {
                document.getElementById('formProducto').reset();
                cargarInventario(); 
            }
        })
        .catch(error => console.error('Error:', error));
    });
});