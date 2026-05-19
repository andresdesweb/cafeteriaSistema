// La función ahora acepta un parámetro de fecha opcional
function cargarVentas(fecha = '') {
    // Construimos la URL dependiendo de si hay fecha o no
    let url = 'api_ventas.php';
    if (fecha !== '') {
        url += `?fecha=${fecha}`;
    }

    fetch(url)
    .then(response => response.json())
    .then(ventas => {
        const cuerpoVentas = document.getElementById('cuerpoVentas');
        cuerpoVentas.innerHTML = '';
        
        ventas.forEach(venta => {
            const fila = document.createElement('tr');
            const fechaFormateada = new Date(venta.fecha).toLocaleString('es-MX');
            
            fila.innerHTML = `
                <td>#${venta.id}</td>
                <td>${fechaFormateada}</td>
                <td>$${parseFloat(venta.total).toFixed(2)}</td>
                <td class="columna-acciones">
                    <button class="btn-detalles" onclick="verDetalles(${venta.id})">Ver Detalles</button>
                </td>
            `;
            cuerpoVentas.appendChild(fila);
        });
    })
    .catch(error => console.error('Error al cargar historial:', error));
}

// Lógica del Modal (Se queda igual)
function verDetalles(ventaId) {
    fetch(`api_ventas.php?id=${ventaId}`)
    .then(response => response.json())
    .then(detalles => {
        const cuerpoDetalle = document.getElementById('cuerpoDetalle');
        cuerpoDetalle.innerHTML = '';

        detalles.forEach(item => {
            const fila = document.createElement('tr');
            fila.innerHTML = `
                <td>${item.cantidad}</td>
                <td>${item.nombre}</td>
                <td>$${parseFloat(item.subtotal).toFixed(2)}</td>
            `;
            cuerpoDetalle.appendChild(fila);
        });

        document.getElementById('tituloModal').innerText = `Detalle de Venta #${ventaId}`;
        document.getElementById('modalDetalle').style.display = 'flex';
    })
    .catch(error => console.error('Error al cargar detalles:', error));
}

function cerrarModal() {
    document.getElementById('modalDetalle').style.display = 'none';
}

window.onclick = function(event) {
    const modal = document.getElementById('modalDetalle');
    if (event.target === modal) {
        cerrarModal();
    }
}

// ==========================================
// NUEVAS FUNCIONALIDADES
// ==========================================

// 1. Filtrado por fecha
document.getElementById('filtroFecha').addEventListener('change', function(e) {
    cargarVentas(e.target.value);
});

document.getElementById('btnLimpiarFiltro').addEventListener('click', function() {
    document.getElementById('filtroFecha').value = '';
    cargarVentas(); // Carga todas
});

// 2. Exportar a Excel (Formato CSV)
document.getElementById('btnExportar').addEventListener('click', function() {
    let csvContent = "data:text/csv;charset=utf-8,";
    // Encabezados
    csvContent += "Folio,Fecha,Total Cobrado\n";

    // Recorremos las filas de la tabla (ignorando la última columna de acciones)
    const filas = document.querySelectorAll("#cuerpoVentas tr");
    filas.forEach(function(fila) {
        let columnas = fila.querySelectorAll("td");
        if(columnas.length > 0) {
            let folio = columnas[0].innerText.replace('#', ''); // Quitamos el #
            let fecha = columnas[1].innerText;
            // Quitamos el signo $ y las comas para que Excel lo lea como número
            let total = columnas[2].innerText.replace('$', '').replace(/,/g, ''); 
            
            // Agregamos la fila al string CSV (encerrando en comillas por si hay espacios en la fecha)
            csvContent += `${folio},"${fecha}",${total}\n`;
        }
    });

    // Creamos un enlace invisible para forzar la descarga
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    // Le ponemos la fecha actual al nombre del archivo
    let nombreArchivo = "Reporte_Ventas_" + new Date().toISOString().split('T')[0] + ".csv";
    link.setAttribute("download", nombreArchivo);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
});

// 3. Imprimir el resumen
document.getElementById('btnImprimir').addEventListener('click', function() {
    window.print(); // Dispara el diálogo de impresión del navegador
});

// Inicialización
document.addEventListener('DOMContentLoaded', () => cargarVentas());