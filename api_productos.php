<?php
require 'conexion.php';
header('Content-Type: application/json');

// --- CÓDIGO PARA POST (Guardar Nuevo Producto) ---
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    
    // Agregamos categoria e imagen_url a la consulta
    $sql = "INSERT INTO productos (nombre, descripcion, precio, stock, categoria, imagen_url) 
            VALUES (:nombre, :descripcion, :precio, :stock, :categoria, :imagen_url)";
    $stmt = $conn->prepare($sql);
    
    try {
        $stmt->execute([
            ':nombre' => $data['nombre'],
            ':descripcion' => $data['descripcion'],
            ':precio' => $data['precio'],
            ':stock' => $data['stock'],
            ':categoria' => $data['categoria'],
            ':imagen_url' => $data['imagen_url']
        ]);
        echo json_encode(["status" => "success", "message" => "Producto registrado exitosamente."]);
    } catch (Exception $e) {
        echo json_encode(["status" => "error", "message" => "Error al guardar el producto: " . $e->getMessage()]);
    }
}

// --- CÓDIGO PARA GET (Consultar Inventario) ---
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        // Agregamos categoria e imagen_url al SELECT
        $sql = "SELECT id, nombre, descripcion, precio, stock, categoria, imagen_url 
                FROM productos WHERE activo = TRUE";
        $stmt = $conn->query($sql);
        $productos = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode($productos);
    } catch (Exception $e) {
        echo json_encode(["error" => "Error al consultar los productos: " . $e->getMessage()]);
    }
}

// --- CÓDIGO PARA PUT (Actualizar Stock) ---
if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    $data = json_decode(file_get_contents("php://input"), true);
    
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