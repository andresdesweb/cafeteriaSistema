<?php
require 'conexion.php';
header('Content-Type: application/json');

// Solo aceptamos peticiones POST para guardar
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    
    $sql = "INSERT INTO productos (nombre, descripcion, precio, stock) VALUES (:nombre, :descripcion, :precio, :stock)";
    $stmt = $conn->prepare($sql);
    
    try {
        $stmt->execute([
            ':nombre' => $data['nombre'],
            ':descripcion' => $data['descripcion'],
            ':precio' => $data['precio'],
            ':stock' => $data['stock']
        ]);
        echo json_encode(["status" => "success", "message" => "Producto registrado exitosamente."]);
    } catch (Exception $e) {
        echo json_encode(["status" => "error", "message" => "Error al guardar el producto."]);
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        // Consultamos solo los productos activos
        $sql = "SELECT id, nombre, descripcion, precio, stock FROM productos WHERE activo = TRUE";
        $stmt = $conn->query($sql);
        
        // Obtenemos los resultados como un arreglo asociativo
        $productos = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Retornamos el JSON con la lista
        echo json_encode($productos);
    } catch (Exception $e) {
        echo json_encode(["error" => "Error al consultar los productos: " . $e->getMessage()]);
    }
}

// --- NUEVO CÓDIGO PARA PUT (Actualizar Stock) ---
if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    // Obtenemos los datos enviados en formato JSON
    $data = json_decode(file_get_contents("php://input"), true);
    
    // Verificamos que nos hayan enviado el ID y el nuevo stock
    if (isset($data['id']) && isset($data['stock'])) {
        $sql = "UPDATE productos SET stock = :stock WHERE id = :id";
        $stmt = $conn->prepare($sql);
        
        try {
            $stmt->execute([
                ':stock' => $data['stock'],
                ':id' => $data['id']
            ]);
            echo json_encode(["status" => "success", "message" => "Stock actualizado correctamente."]);
        } catch (Exception $e) {
            echo json_encode(["status" => "error", "message" => "Error al actualizar: " . $e->getMessage()]);
        }
    } else {
        echo json_encode(["status" => "error", "message" => "Datos incompletos para actualizar."]);
    }
}
?>