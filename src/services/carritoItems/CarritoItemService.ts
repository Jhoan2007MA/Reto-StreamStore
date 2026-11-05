import { ESTADO_REGISTRO, TIPO_PRODUCTO } from "../../constants/estados"
import { CarritoLinea, CarritoResumen } from "../../interfaces/Carrito"
import { StockPlataforma } from "../../interfaces/Catalogo"
import { CarritoItem } from "../../models/CarritoItem"
import { Producto } from "../../models/Producto"
import { CarritoItemRepository } from "../../repositories/carritoItems/CarritoItemRepository"
import { ProductoRepository } from "../../repositories/productos/ProductoRepository"
import { HttpError } from "../../utils/httpError"
import { CreateCarritoItemInput, RenovarCarritoItemInput, UpdateCarritoItemInput } from "../../validators/carritoItems/CarritoItemValidators"

interface ProductoStock {
    plataformaId: number
    tipo: number
}

const SIN_STOCK: StockPlataforma = { cuenta: 0, pantalla: 0 }

const claveStock = (producto: ProductoStock): string => `${producto.plataformaId}-${producto.tipo}`

const stockDe = (producto: ProductoStock, stock: Map<number, StockPlataforma>): number => {
    const plataforma = stock.get(producto.plataformaId) ?? SIN_STOCK
    return producto.tipo === TIPO_PRODUCTO.CUENTA ? plataforma.cuenta : plataforma.pantalla
}

const nombreProducto = (producto: Producto): string =>
    `${producto.plataforma?.nombre ?? "Producto"} ${producto.tipo === TIPO_PRODUCTO.CUENTA ? "cuenta completa" : "pantalla"}`

const estaActivo = (producto: Producto | undefined): boolean =>
    producto?.estado === ESTADO_REGISTRO.ACTIVO && producto.plataforma?.estado === ESTADO_REGISTRO.ACTIVO

export class CarritoItemService {
    constructor(
        private readonly repository: CarritoItemRepository,
        private readonly productoRepository: ProductoRepository
    ) {}

    async get(usuarioId: number): Promise<CarritoResumen> {
        const items = await this.repository.findByUsuario(usuarioId)
        const stock = await this.productoRepository.stockPorPlataforma(
            items.flatMap((item) => (item.producto ? [item.producto.plataformaId] : []))
        )

        const enCarrito = new Map<string, number>()
        for (const item of items) {
            if (!item.producto || item.servicioId !== null) continue
            const clave = claveStock(item.producto)
            enCarrito.set(clave, (enCarrito.get(clave) ?? 0) + item.cantidad)
        }

        const lineas = items.map((item) => this.toLinea(item, stock, enCarrito))
        return {
            items: lineas,
            cantidadTotal: lineas.reduce((suma, linea) => suma + linea.cantidad, 0),
            total: lineas.reduce((suma, linea) => suma + linea.subtotal, 0),
            puedePagar: lineas.length > 0 && lineas.every((linea) => linea.stockSuficiente)
        }
    }

    async add(input: CreateCarritoItemInput, usuarioId: number): Promise<{ creado: boolean, carrito: CarritoResumen }> {
        const producto = await this.productoRepository.findActivoById(input.productoId)
        if (!producto) throw new HttpError("Producto no encontrado", 404)

        const items = await this.repository.findByUsuario(usuarioId)
        const existente = items.find((item) => item.productoId === input.productoId && item.servicioId === null)
        const cantidad = (existente?.cantidad ?? 0) + input.cantidad
        await this.validarStock(producto, cantidad, items.filter((item) => item.id !== existente?.id))

        if (existente) {
            await this.repository.updateCantidad(existente.id, cantidad, usuarioId)
        } else {
            await this.repository.create(usuarioId, input.productoId, cantidad)
        }
        return { creado: !existente, carrito: await this.get(usuarioId) }
    }

    async update(id: number, input: UpdateCarritoItemInput, usuarioId: number): Promise<CarritoResumen> {
        const item = await this.repository.findByIdUsuario(id, usuarioId)
        if (!item) throw new HttpError("El producto no está en tu carrito", 404)
        if (item.servicioId !== null) throw new HttpError("La renovación de un servicio es de una sola unidad", 400)

        const producto = await this.productoRepository.findActivoById(item.productoId)
        if (!producto) throw new HttpError("Este producto ya no está disponible, quítalo del carrito", 400)

        const items = await this.repository.findByUsuario(usuarioId)
        await this.validarStock(producto, input.cantidad, items.filter((otro) => otro.id !== id))
        await this.repository.updateCantidad(id, input.cantidad, usuarioId)
        return this.get(usuarioId)
    }

    async renovar(input: RenovarCarritoItemInput, usuarioId: number): Promise<CarritoResumen> {
        const servicio = await this.repository.findServicioDeUsuario(input.servicioId, usuarioId)
        if (!servicio || !servicio.cuenta || !servicio.compraItem) throw new HttpError("Servicio no encontrado", 404)

        const producto = await this.productoRepository.findActivoById(input.productoId ?? servicio.compraItem.productoId)
        if (!producto) throw new HttpError("El producto para renovar este servicio ya no está disponible", 400)

        const tipoServicio = servicio.pantallaId === null ? TIPO_PRODUCTO.CUENTA : TIPO_PRODUCTO.PANTALLA
        if (producto.plataformaId !== servicio.cuenta.plataformaId || producto.tipo !== tipoServicio) {
            throw new HttpError("Ese producto no corresponde a la plataforma y modalidad de este servicio", 400)
        }

        const items = await this.repository.findByUsuario(usuarioId)
        if (items.some((item) => item.servicioId === servicio.id)) {
            throw new HttpError("La renovación de este servicio ya está en tu carrito", 409)
        }
        await this.repository.create(usuarioId, producto.id, 1, servicio.id)
        return this.get(usuarioId)
    }

    async remove(id: number, usuarioId: number): Promise<CarritoResumen> {
        const item = await this.repository.findByIdUsuario(id, usuarioId)
        if (!item) throw new HttpError("El producto no está en tu carrito", 404)
        await this.repository.delete(id, usuarioId)
        return this.get(usuarioId)
    }

    async clear(usuarioId: number): Promise<CarritoResumen> {
        await this.repository.deleteByUsuario(usuarioId)
        return this.get(usuarioId)
    }

    private async validarStock(producto: Producto, cantidad: number, otrosItems: CarritoItem[]): Promise<void> {
        const stock = stockDe(producto, await this.productoRepository.stockPorPlataforma([producto.plataformaId]))
        const clave = claveStock(producto)
        const mismoStock = otrosItems
            .filter((item) => item.servicioId === null && item.producto && claveStock(item.producto) === clave)
            .reduce((suma, item) => suma + item.cantidad, 0)

        if (stock === 0) throw new HttpError(`${nombreProducto(producto)} está agotado`, 400)
        if (cantidad + mismoStock > stock) {
            const disponibles = Math.max(stock - mismoStock, 0)
            const detalle = mismoStock > 0 ? ` (ya tienes ${mismoStock} de otra duración en el carrito)` : ""
            throw new HttpError(
                `Solo puedes llevar ${disponibles} de ${nombreProducto(producto)}: hay ${stock} ${stock === 1 ? "disponible" : "disponibles"}${detalle}`,
                400,
                { stock, disponibles }
            )
        }
    }

    private toLinea(item: CarritoItem, stock: Map<number, StockPlataforma>, enCarrito: Map<string, number>): CarritoLinea {
        const producto = item.producto
        const disponible = estaActivo(producto)
        const stockActual = producto && disponible ? stockDe(producto, stock) : 0
        const esRenovacion = item.servicioId !== null
        const solicitado = producto ? enCarrito.get(claveStock(producto)) ?? item.cantidad : item.cantidad
        const precio = Number(producto?.precio ?? 0)
        return {
            id: item.id,
            producto: {
                id: item.productoId,
                plataforma: {
                    id: producto?.plataforma?.id ?? producto?.plataformaId ?? 0,
                    nombre: producto?.plataforma?.nombre ?? "",
                    logoUrl: producto?.plataforma?.logoUrl ?? null
                },
                tipo: producto?.tipo === TIPO_PRODUCTO.CUENTA ? "cuenta" : "pantalla",
                duracionDias: producto?.duracionDias ?? 0,
                precio,
                disponible
            },
            renovacion: esRenovacion && item.servicio
                ? { servicioId: item.servicio.id, fechaVencimiento: item.servicio.fechaVencimiento }
                : null,
            cantidad: item.cantidad,
            subtotal: precio * item.cantidad,
            stock: stockActual,
            stockSuficiente: disponible && (esRenovacion || solicitado <= stockActual)
        }
    }
}
