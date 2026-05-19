// Función para obtener y mostrar los productos
function cargarInventario() {
    fetch('api_productos.php')
    .then(response => response.json())
    .then(productos => {
        const cuerpoTabla = document.getElementById('cuerpoTabla');
        cuerpoTabla.innerHTML = ''; // Limpiamos la tabla
        
        productos.forEach(producto => {
            const fila = document.createElement('tr');
            fila.innerHTML = `
                <td>${producto.id}</td>
                <td>
                    <img src="${producto.imagen_url}" alt="${producto.nombre}" style="width: 40px; height: 40px; object-fit: cover; border-radius: 5px; border: 1px solid #eee;">
                </td>
                <td>${producto.nombre}</td>
                <td><span style="background: #e9ecef; padding: 3px 8px; border-radius: 12px; font-size: 0.8em; color: #495057;">${producto.categoria}</span></td>
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

// Función para modificar el stock (se mantiene igual)
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

// Lógica de inicialización y guardado
document.addEventListener('DOMContentLoaded', () => {
    // 1. Cargar la tabla al iniciar
    cargarInventario();

    // 2. Escuchar el envío del formulario
    document.getElementById('formProducto').addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Verificamos si dejaron la imagen vacía para poner la de por defecto
        let urlImg = document.getElementById('imagen_url').value.trim();
        if(urlImg === '') {
            urlImg = 'https://placehold.co/300x300/f8f9fa/333?text=Sin+Imagen';
        }

        const producto = {
            nombre: document.getElementById('nombre').value,
            categoria: document.getElementById('categoria').value, // Nuevo campo
            descripcion: document.getElementById('descripcion').value,
            precio: document.getElementById('precio').value,
            stock: document.getElementById('stock').value,
            imagen_url: urlImg // Nuevo campo
        };

        fetch('api_productos.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(producto)
        })
        .then(response => response.json())
        .then(data => {
            document.getElementById('mensaje').innerHTML = `<p style="color: green; margin-top:10px;">${data.message}</p>`;
            if(data.status === 'success') {
                document.getElementById('formProducto').reset();
                cargarInventario(); 
                
                // Limpiar el mensaje de éxito después de 3 segundos
                setTimeout(() => { document.getElementById('mensaje').innerHTML = ''; }, 3000);
            }
        })
        .catch(error => console.error('Error:', error));
    });
});