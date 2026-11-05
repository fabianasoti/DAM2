fun main() {
    // 1. Lista inmutable de stock
    val stock: List<Int> = listOf(25, 0, 8, -3, 50, 3)

    // 2. Proveedor opcional (String?) con valor por defecto si es null
    val proveedor: String? = null
    val nombreProveedor = proveedor ?: "Sin proveedor"
    println("Proveedor: $nombreProveedor")

    var agotados = 0
    var stockBajo = 0
    var totalUnidades = 0
    var productosValidos = 0

    // 3. Recorrido y numeración de productos
    for ((index, uds) in stock.withIndex()) {
        val numProducto = index + 1

        // 4. Validación de datos erróneos (unidades negativas)
        if (uds < 0) {
            println("Producto $numProducto: Dato erróneo")
            continue
        }

        // Clasificación de stock
        val estado = when (uds) {
            0 -> {
                agotados++
                "Agotado"
            }
            in 1..9 -> {
                stockBajo++
                "Stock bajo"
            }
            in 10..29 -> "Stock normal"
            else -> "Stock alto"
        }

        println("Producto $numProducto: $uds uds ($estado)")

        // Acumuladores para total y media
        totalUnidades += uds
        productosValidos++
    }

    // 5. Cálculos y resumen final
    val media = if (productosValidos > 0) totalUnidades / productosValidos else 0
    val necesitaPedido = if (agotados > 0 || stockBajo > 0) "Hay que hacer un pedido." else "No hace falta pedido."

    println("Agotados: $agotados. Stock bajo: $stockBajo. Total: $totalUnidades uds. Media: $media. $necesitaPedido")
}