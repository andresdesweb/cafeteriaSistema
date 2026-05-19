<?php
require 'conexion.php';
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Recibimos el arreglo del carrito
    $carrito = json_decode(file_get_contents("php://input"), true);
    
    if (empty($carrito)) {
        echo json_encode(["status" => "error", "message" => "El carrito está vacío."]);
        exit;
    }

    try {
        // Iniciamos la transacción
        $conn->beginTransaction();

        // 1. Calcular el total de la venta
        $totalVenta = 0;
        foreach ($carrito as $item) {
            $totalVenta += ($item['precio'] * $item['cantidad']);
        }

        // 2. Insertar en la tabla 'ventas'
        $sqlVenta = "INSERT INTO ventas (total) VALUES (:total)";
        $stmtVenta = $conn->prepare($sqlVenta);
        $stmtVenta->execute([':total' => $totalVenta]);
        
        // Obtener el ID de la venta recién creada
        $venta_id = $conn->lastInsertId();

        // Preparar las consultas para el detalle y la actualización de stock
        $sqlDetalle = "INSERT INTO detalle_ventas (venta_id, producto_id, cantidad, subtotal) VALUES (:venta_id, :producto_id, :cantidad, :subtotal)";
        $stmtDetalle = $conn->prepare($sqlDetalle);

        $sqlStock = "UPDATE productos SET stock = stock - :cantidad WHERE id = :producto_id";
        $stmtStock = $conn->prepare($sqlStock);

        // 3. Iterar sobre el carrito para guardar detalles y descontar stock
        foreach ($carrito as $item) {
            $subtotal = $item['precio'] * $item['cantidad'];
            
            // Insertar detalle
            $stmtDetalle->execute([
                ':venta_id' => $venta_id,
                ':producto_id' => $item['id'],
                ':cantidad' => $item['cantidad'],
                ':subtotal' => $subtotal
            ]);

            // Actualizar stock
            $stmtStock->execute([
                ':cantidad' => $item['cantidad'],
                ':producto_id' => $item['id']
            ]);
        }

        // Si todo salió bien, confirmamos la transacción
        $conn->commit();

        echo json_encode([
            "status" => "success", 
            "message" => "Venta completada con éxito.",
            "venta_id" => $venta_id
        ]);

    } catch (Exception $e) {
        // Si hay algún error, revertimos todos los cambios
        $conn->rollBack();
        echo json_encode(["status" => "error", "message" => "Error al procesar la venta: " . $e->getMessage()]);
    }
}

// --- NUEVO CÓDIGO PARA GET (Consultar Ventas e Historial) ---
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        if (isset($_GET['id'])) {
            // Detalle de una venta específica (se queda igual)
            $sql = "SELECT dv.cantidad, dv.subtotal, p.nombre 
                    FROM detalle_ventas dv 
                    JOIN productos p ON dv.producto_id = p.id 
                    WHERE dv.venta_id = :id";
            $stmt = $conn->prepare($sql);
            $stmt->execute([':id' => $_GET['id']]);
            $detalle = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            echo json_encode($detalle);
        } else {
            // Historial con filtro opcional de fecha
            $sql = "SELECT id, total, fecha FROM ventas";
            $params = [];

            // Verificamos si se envió el parámetro de fecha desde JavaScript
            if (isset($_GET['fecha']) && !empty($_GET['fecha'])) {
                $sql .= " WHERE DATE(fecha) = :fecha";
                $params[':fecha'] = $_GET['fecha'];
            }

            $sql .= " ORDER BY fecha DESC";
            $stmt = $conn->prepare($sql);
            $stmt->execute($params);
            $ventas = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            echo json_encode($ventas);
        }
    } catch (Exception $e) {
        echo json_encode(["error" => "Error al consultar las ventas: " . $e->getMessage()]);
    }
}
?>