import { ESTADO_REGISTRO, TIPO_PRODUCTO } from "../../constants/estados"
import { ProductoAdmin } from "../../interfaces/Admin"
import { ProductoCatalogo, StockPlataforma, TipoProductoNombre } from "../../interfaces/Catalogo"
import { Producto } from "../../models/Producto"
import { ProductoRepository } from "../../repositories/productos/ProductoRepository"
import { HttpError } from "../../utils/httpError"
import { getOffset, pagination, PaginatedResult } from "../../utils/pagination"
import { EstadoInput } from "../../validators/CommonValidators"
import { CreateProductoInput, ListProductoAdminQuery, ListProductoQuery, UpdateProductoInput } from "../../validators/productos/ProductoValidators"

const TIPO_POR_NOMBRE: Record<TipoProductoNombre, number> = {
    cuenta: TIPO_PRODUCTO.CUENTA,
    pantalla: TIPO_PRODUCTO.PANTALLA
}

const SIN_STOCK: StockPlataforma = { cuenta: 0, pantalla: 0 }

export class ProductoService {
    constructor(private readonly repository: ProductoRepository) {}

    async list(query: ListProductoQuery): Promise<PaginatedResult<ProductoCatalogo>> {
        const result = await this.repository.findAndCountActivos({
            plataformaId: query.plataforma,
            tipo: query.tipo ? TIPO_POR_NOMBRE[query.tipo] : undefined,
            limit: query.limit,
            offset: getOffset(query.limit, query.page)
        })
        const stock = await this.repository.stockPorPlataforma(result.rows.map((producto) => producto.plataformaId))
        const rows = result.rows.map((producto) => this.toCatalogo(producto, stock.get(producto.plataformaId) ?? SIN_STOCK))
        return pagination({ count: result.count, rows }, query.limit, query.page)
    }

    async getById(id: number): Promise<ProductoCatalogo> {
        const producto = await this.repository.findActivoById(id)
        if (!producto) throw new HttpError("Producto no encontrado", 404)
        const stock = await this.repository.stockPorPlataforma([producto.plataformaId])
        return this.toCatalogo(producto, stock.get(producto.plataformaId) ?? SIN_STOCK)
    }

    async listAdmin(query: ListProductoAdminQuery): Promise<PaginatedResult<ProductoAdmin>> {
        const result = await this.repository.findAndCountAdmin({
            plataformaId: query.plataforma,
            tipo: query.tipo ? TIPO_POR_NOMBRE[query.tipo] : undefined,
            estado: query.estado,
            limit: query.limit,
            offset: getOffset(query.limit, query.page)
        })
        const stock = await this.repository.stockPorPlataforma(result.rows.map((producto) => producto.plataformaId))
        const rows = result.rows.map((producto) => this.toAdmin(producto, stock.get(producto.plataformaId) ?? SIN_STOCK))
        return pagination({ count: result.count, rows }, query.limit, query.page)
    }

    async getAdmin(id: number): Promise<ProductoAdmin> {
        const producto = await this.repository.findById(id)
        if (!producto) throw new HttpError("Producto no encontrado", 404)
        const stock = await this.repository.stockPorPlataforma([producto.plataformaId])
        return this.toAdmin(producto, stock.get(producto.plataformaId) ?? SIN_STOCK)
    }

    async create(input: CreateProductoInput, usuarioId: number): Promise<ProductoAdmin> {
        await this.validarPlataforma(input.plataformaId)
        const combinacion = { plataformaId: input.plataformaId, tipo: TIPO_POR_NOMBRE[input.tipo], duracionDias: input.duracionDias }
        if (await this.repository.existsCombinacion(combinacion)) {
            throw new HttpError(`Ya existe un producto de ${input.tipo} a ${input.duracionDias} días para esa plataforma`, 409)
        }
        const id = await this.repository.create({
            ...combinacion,
            precio: input.precio.toFixed(2),
            createdBy: usuarioId,
            updatedBy: usuarioId
        })
        return this.getAdmin(id)
    }

    async update(id: number, input: UpdateProductoInput, usuarioId: number): Promise<ProductoAdmin> {
        const producto = await this.repository.findById(id)
        if (!producto) throw new HttpError("Producto no encontrado", 404)

        const combinacion = {
            plataformaId: input.plataformaId ?? producto.plataformaId,
            tipo: input.tipo ? TIPO_POR_NOMBRE[input.tipo] : producto.tipo,
            duracionDias: input.duracionDias ?? producto.duracionDias
        }
        const cambiaIdentidad = combinacion.plataformaId !== producto.plataformaId || combinacion.tipo !== producto.tipo
        if (cambiaIdentidad && await this.repository.tieneVentas(id)) {
            throw new HttpError("Este producto ya tiene ventas: no se puede cambiar su plataforma ni su modalidad. Crea un producto nuevo", 400)
        }
        if (combinacion.plataformaId !== producto.plataformaId) await this.validarPlataforma(combinacion.plataformaId)
        if (await this.repository.existsCombinacion(combinacion, id)) {
            throw new HttpError("Ya existe otro producto con esa plataforma, modalidad y duración", 409)
        }

        await this.repository.update(id, {
            ...combinacion,
            ...(input.precio !== undefined ? { precio: input.precio.toFixed(2) } : {}),
            updatedBy: usuarioId
        })
        return this.getAdmin(id)
    }

    async cambiarEstado(id: number, input: EstadoInput, usuarioId: number): Promise<ProductoAdmin> {
        const producto = await this.repository.findById(id)
        if (!producto) throw new HttpError("Producto no encontrado", 404)
        await this.repository.update(id, { estado: input.estado, updatedBy: usuarioId })
        return this.getAdmin(id)
    }

    private async validarPlataforma(plataformaId: number): Promise<void> {
        const plataforma = await this.repository.findPlataforma(plataformaId)
        if (!plataforma) throw new HttpError("Plataforma no encontrada", 404)
        if (plataforma.estado !== ESTADO_REGISTRO.ACTIVO) throw new HttpError("La plataforma está inactiva", 403)
    }

    private toAdmin(producto: Producto, stockPlataforma: StockPlataforma): ProductoAdmin {
        const esCuenta = producto.tipo === TIPO_PRODUCTO.CUENTA
        return {
            id: producto.id,
            plataforma: {
                id: producto.plataforma?.id ?? producto.plataformaId,
                nombre: producto.plataforma?.nombre ?? "",
                estado: producto.plataforma?.estado ?? ESTADO_REGISTRO.INACTIVO
            },
            tipo: esCuenta ? "cuenta" : "pantalla",
            duracionDias: producto.duracionDias,
            precio: Number(producto.precio),
            estado: producto.estado,
            stock: esCuenta ? stockPlataforma.cuenta : stockPlataforma.pantalla,
            createdAt: producto.createdAt,
            updatedAt: producto.updatedAt
        }
    }

    private toCatalogo(producto: Producto, stockPlataforma: StockPlataforma): ProductoCatalogo {
        const esCuenta = producto.tipo === TIPO_PRODUCTO.CUENTA
        const stock = esCuenta ? stockPlataforma.cuenta : stockPlataforma.pantalla
        return {
            id: producto.id,
            plataforma: {
                id: producto.plataforma?.id ?? producto.plataformaId,
                nombre: producto.plataforma?.nombre ?? "",
                logoUrl: producto.plataforma?.logoUrl ?? null
            },
            tipo: esCuenta ? "cuenta" : "pantalla",
            duracionDias: producto.duracionDias,
            precio: Number(producto.precio),
            stock,
            agotado: stock === 0
        }
    }
}
