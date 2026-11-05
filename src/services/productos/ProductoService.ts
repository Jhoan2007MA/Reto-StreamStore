import { TIPO_PRODUCTO } from "../../constants/estados"
import { ProductoCatalogo, StockPlataforma, TipoProductoNombre } from "../../interfaces/Catalogo"
import { Producto } from "../../models/Producto"
import { ProductoRepository } from "../../repositories/productos/ProductoRepository"
import { HttpError } from "../../utils/httpError"
import { getOffset, pagination, PaginatedResult } from "../../utils/pagination"
import { ListProductoQuery } from "../../validators/productos/ProductoValidators"

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
