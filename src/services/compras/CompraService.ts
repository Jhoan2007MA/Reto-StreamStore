import { Transaction } from "sequelize"
import { config } from "../../config/config"
import { ESTADO_COMPRA, ESTADO_SERVICIO, TIPO_PRODUCTO } from "../../constants/estados"
import { ClienteCompra, CompraAdmin, CompraDetalleAdmin } from "../../interfaces/Admin"
import { CompraDetalle, CompraResumen, EstadoCompraNombre } from "../../interfaces/Compra"
import { Compra } from "../../models/Compra"
import { CompraItem } from "../../models/CompraItem"
import { ServicioCreationAttributes } from "../../models/Servicio"
import { CompraRepository } from "../../repositories/compras/CompraRepository"
import { inicioDelDia, sumarDias } from "../../utils/fechas"
import { HttpError } from "../../utils/httpError"
import { logger } from "../../utils/logger"
import { Mailer } from "../../utils/mailer"
import { getOffset, pagination, PaginatedResult } from "../../utils/pagination"
import { ListCompraAdminQuery, ListCompraQuery, PagarCompraInput } from "../../validators/compras/CompraValidators"
import { CarritoItemService } from "../carritoItems/CarritoItemService"
import { correoConfirmacion } from "./plantillas"

const DIA_MS = 24 * 60 * 60 * 1000

const ESTADO_POR_NOMBRE: Record<EstadoCompraNombre, number> = {
    pendiente: ESTADO_COMPRA.PENDIENTE,
    pagada: ESTADO_COMPRA.PAGADA,
    cancelada: ESTADO_COMPRA.CANCELADA
}

const NOMBRE_ESTADO = new Map<number, EstadoCompraNombre>(
    Object.entries(ESTADO_POR_NOMBRE).map(([nombre, codigo]) => [codigo, nombre as EstadoCompraNombre])
)

const nombreProducto = (item: CompraItem): string =>
    `${item.producto?.plataforma?.nombre ?? "Producto"} ${item.producto?.tipo === TIPO_PRODUCTO.CUENTA ? "cuenta completa" : "pantalla"}`

export class CompraService {
    constructor(
        private readonly repository: CompraRepository,
        private readonly carritoService: CarritoItemService,
        private readonly mailer: Mailer
    ) {}

    async checkout(usuarioId: number): Promise<CompraDetalle> {
        const carrito = await this.carritoService.get(usuarioId)
        if (carrito.items.length === 0) throw new HttpError("Tu carrito está vacío", 400)

        const noDisponible = carrito.items.find((item) => !item.producto.disponible)
        if (noDisponible) {
            throw new HttpError(`${noDisponible.producto.plataforma.nombre} ${noDisponible.producto.tipo} ya no está disponible, quítalo del carrito`, 400, { itemId: noDisponible.id })
        }
        const sinStock = carrito.items.find((item) => !item.stockSuficiente)
        if (sinStock) {
            throw new HttpError(
                `No hay stock suficiente de ${sinStock.producto.plataforma.nombre} ${sinStock.producto.tipo}: quedan ${sinStock.stock}. Ajusta tu carrito`,
                400,
                { itemId: sinStock.id, stock: sinStock.stock }
            )
        }

        const id = await this.repository.createConItems(usuarioId, carrito.total.toFixed(2), carrito.items.map((item) => ({
            productoId: item.producto.id,
            servicioId: item.renovacion?.servicioId ?? null,
            cantidad: item.cantidad,
            precioUnitario: item.producto.precio.toFixed(2),
            subtotal: item.subtotal.toFixed(2)
        })))
        return this.getById(id, usuarioId)
    }

    async pagar(id: number, input: PagarCompraInput, usuarioId: number): Promise<CompraDetalle> {
        await this.repository.transaction(async (transaction) => {
            const compra = await this.repository.findParaPagar(id, usuarioId, transaction)
            if (!compra) throw new HttpError("Compra no encontrada", 404)
            if (compra.estado === ESTADO_COMPRA.PAGADA) throw new HttpError("Esta compra ya fue pagada", 400)
            if (compra.estado === ESTADO_COMPRA.CANCELADA) throw new HttpError("Esta compra fue cancelada, vuelve a hacer el checkout", 400)

            const items = await this.repository.findItems(id, transaction)
            const ordenados = [...items].sort((a, b) =>
                (a.producto?.tipo ?? 0) - (b.producto?.tipo ?? 0) || a.productoId - b.productoId
            )

            const ahora = new Date()
            const servicios: ServicioCreationAttributes[] = []
            for (const item of ordenados) {
                servicios.push(...await this.asignar(item, usuarioId, ahora, transaction))
            }

            await this.repository.createServicios(servicios, transaction)
            await this.repository.marcarPagada(id, input.metodoPago, ahora, usuarioId, transaction)
            await this.repository.vaciarCarrito(usuarioId, transaction)
        })

        const compra = await this.repository.findDetalle(id, usuarioId)
        if (!compra) throw new HttpError("Compra no encontrada", 404)
        const detalle = this.toDetalle(compra)
        void this.enviarConfirmacion(detalle, this.toCliente(compra))
        return detalle
    }

    private async enviarConfirmacion(compra: CompraDetalle, cliente: ClienteCompra): Promise<void> {
        try {
            await this.mailer.send(correoConfirmacion(compra, cliente, `${config.clientUrls[0] ?? ""}/mi-cuenta`))
        } catch (error) {
            logger.error(`No se pudo enviar la confirmación de la compra ${compra.id}: ${error instanceof Error ? error.message : String(error)}`)
        }
    }

    async listMias(usuarioId: number, query: ListCompraQuery): Promise<PaginatedResult<CompraResumen>> {
        const result = await this.repository.findAndCountByUsuario({
            usuarioId,
            estado: query.estado ? ESTADO_POR_NOMBRE[query.estado] : undefined,
            limit: query.limit,
            offset: getOffset(query.limit, query.page)
        })
        const rows = result.rows.map((compra) => this.toResumen(compra))
        return pagination({ count: result.count, rows }, query.limit, query.page)
    }

    async listAdmin(query: ListCompraAdminQuery): Promise<PaginatedResult<CompraAdmin>> {
        const result = await this.repository.findAndCountAdmin({
            estado: query.estado ? ESTADO_POR_NOMBRE[query.estado] : undefined,
            cliente: query.cliente,
            desde: query.desde ? inicioDelDia(query.desde) : undefined,
            hasta: query.hasta ? inicioDelDia(sumarDias(query.hasta, 1)) : undefined,
            limit: query.limit,
            offset: getOffset(query.limit, query.page)
        })
        const rows = result.rows.map((compra) => ({ ...this.toResumen(compra), cliente: this.toCliente(compra) }))
        return pagination({ count: result.count, rows }, query.limit, query.page)
    }

    async getByIdAdmin(id: number): Promise<CompraDetalleAdmin> {
        const compra = await this.repository.findDetalle(id)
        if (!compra) throw new HttpError("Compra no encontrada", 404)
        return { ...this.toDetalle(compra), cliente: this.toCliente(compra) }
    }

    async getById(id: number, usuarioId: number): Promise<CompraDetalle> {
        const compra = await this.repository.findDetalle(id, usuarioId)
        if (!compra) throw new HttpError("Compra no encontrada", 404)
        return this.toDetalle(compra)
    }

    private toCliente(compra: Compra): ClienteCompra {
        return {
            id: compra.usuario?.id ?? compra.usuarioId,
            nombre: compra.usuario?.nombre ?? "",
            correo: compra.usuario?.correo ?? ""
        }
    }

    private toDetalle(compra: Compra): CompraDetalle {
        return {
            ...this.toResumen(compra),
            items: (compra.items ?? []).map((item) => ({
                id: item.id,
                producto: {
                    id: item.productoId,
                    plataforma: {
                        id: item.producto?.plataforma?.id ?? item.producto?.plataformaId ?? 0,
                        nombre: item.producto?.plataforma?.nombre ?? "",
                        logoUrl: item.producto?.plataforma?.logoUrl ?? null
                    },
                    tipo: item.producto?.tipo === TIPO_PRODUCTO.CUENTA ? "cuenta" : "pantalla",
                    duracionDias: item.producto?.duracionDias ?? 0
                },
                renovacionDe: item.servicioId,
                cantidad: item.cantidad,
                precioUnitario: Number(item.precioUnitario),
                subtotal: Number(item.subtotal),
                servicios: [...(item.servicios ?? []), ...(item.servicioRenovado ? [item.servicioRenovado] : [])].map((servicio) => ({
                    id: servicio.id,
                    fechaInicio: servicio.fechaInicio,
                    fechaVencimiento: servicio.fechaVencimiento
                }))
            }))
        }
    }

    private async asignar(item: CompraItem, usuarioId: number, ahora: Date, transaction: Transaction): Promise<ServicioCreationAttributes[]> {
        const producto = item.producto
        if (!producto) throw new HttpError("Un producto de la compra ya no existe", 400)

        if (item.servicioId !== null) {
            const servicio = await this.repository.findServicioParaRenovar(item.servicioId, usuarioId, transaction)
            if (!servicio) throw new HttpError("El servicio que intentas renovar ya no existe", 400, { productoId: item.productoId })
            const desde = Math.max(new Date(servicio.fechaVencimiento).getTime(), ahora.getTime())
            await this.repository.extenderServicio(servicio.id, new Date(desde + producto.duracionDias * DIA_MS), usuarioId, transaction)
            return []
        }

        const fechaVencimiento = new Date(ahora.getTime() + producto.duracionDias * DIA_MS)
        const base = {
            compraItemId: item.id,
            usuarioId,
            fechaInicio: ahora,
            fechaVencimiento,
            estado: ESTADO_SERVICIO.ACTIVO,
            createdBy: usuarioId,
            updatedBy: usuarioId
        }
        const agotado = (): HttpError => new HttpError(
            `${nombreProducto(item)} se agotó: no hay unidades suficientes para tu pedido. Ajusta tu carrito e intenta de nuevo`,
            400,
            { productoId: item.productoId }
        )

        const servicios: ServicioCreationAttributes[] = []
        for (let unidad = 0; unidad < item.cantidad; unidad++) {
            if (producto.tipo === TIPO_PRODUCTO.CUENTA) {
                const cuentaId = await this.repository.tomarCuentaCompleta(producto.plataformaId, transaction)
                if (cuentaId === null) throw agotado()
                await this.repository.marcarCuentaVendida(cuentaId, usuarioId, transaction)
                servicios.push({ ...base, cuentaId, pantallaId: null })
            } else {
                const pantalla = await this.repository.tomarPantalla(producto.plataformaId, transaction)
                if (!pantalla) throw agotado()
                await this.repository.marcarPantallaVendida(pantalla, usuarioId, transaction)
                servicios.push({ ...base, cuentaId: pantalla.cuentaId, pantallaId: pantalla.pantallaId })
            }
        }
        return servicios
    }

    private toResumen(compra: Compra): CompraResumen {
        return {
            id: compra.id,
            estado: NOMBRE_ESTADO.get(compra.estado) ?? "pendiente",
            total: Number(compra.total),
            metodoPago: compra.metodoPago,
            cantidadItems: (compra.items ?? []).reduce((suma, item) => suma + item.cantidad, 0),
            createdAt: compra.createdAt,
            pagadaAt: compra.pagadaAt
        }
    }
}
