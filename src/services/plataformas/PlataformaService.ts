import { PlataformaAdmin } from "../../interfaces/Admin"
import { PlataformaPublica, StockPlataforma } from "../../interfaces/Catalogo"
import { Plataforma } from "../../models/Plataforma"
import { PlataformaRepository } from "../../repositories/plataformas/PlataformaRepository"
import { ProductoRepository } from "../../repositories/productos/ProductoRepository"
import { HttpError } from "../../utils/httpError"
import { getOffset, pagination, PaginatedResult } from "../../utils/pagination"
import { EstadoInput } from "../../validators/CommonValidators"
import { CreatePlataformaInput, ListPlataformaQuery, UpdatePlataformaInput } from "../../validators/plataformas/PlataformaValidators"

const SIN_STOCK: StockPlataforma = { cuenta: 0, pantalla: 0 }

export class PlataformaService {
    constructor(
        private readonly repository: PlataformaRepository,
        private readonly productoRepository: ProductoRepository
    ) {}

    async listActivas(): Promise<PlataformaPublica[]> {
        const plataformas = await this.repository.findActivas()
        return plataformas.map((plataforma) => ({
            id: plataforma.id,
            nombre: plataforma.nombre,
            descripcion: plataforma.descripcion,
            logoUrl: plataforma.logoUrl,
            maxPantallas: plataforma.maxPantallas
        }))
    }

    async listAdmin(query: ListPlataformaQuery): Promise<PaginatedResult<PlataformaAdmin>> {
        const result = await this.repository.findAndCountAdmin({
            estado: query.estado,
            buscar: query.buscar,
            limit: query.limit,
            offset: getOffset(query.limit, query.page)
        })
        const stock = await this.productoRepository.stockPorPlataforma(result.rows.map((plataforma) => plataforma.id))
        const rows = result.rows.map((plataforma) => this.toAdmin(plataforma, stock.get(plataforma.id) ?? SIN_STOCK))
        return pagination({ count: result.count, rows }, query.limit, query.page)
    }

    async getAdmin(id: number): Promise<PlataformaAdmin> {
        const plataforma = await this.repository.findById(id)
        if (!plataforma) throw new HttpError("Plataforma no encontrada", 404)
        const stock = await this.productoRepository.stockPorPlataforma([id])
        return this.toAdmin(plataforma, stock.get(id) ?? SIN_STOCK)
    }

    async create(input: CreatePlataformaInput, usuarioId: number): Promise<PlataformaAdmin> {
        if (await this.repository.existsNombre(input.nombre)) {
            throw new HttpError("Ya existe una plataforma con ese nombre", 409)
        }
        const id = await this.repository.create({
            nombre: input.nombre,
            descripcion: input.descripcion ?? null,
            logoUrl: input.logoUrl ?? null,
            maxPantallas: input.maxPantallas,
            createdBy: usuarioId,
            updatedBy: usuarioId
        })
        return this.getAdmin(id)
    }

    async update(id: number, input: UpdatePlataformaInput, usuarioId: number): Promise<PlataformaAdmin> {
        const plataforma = await this.repository.findById(id)
        if (!plataforma) throw new HttpError("Plataforma no encontrada", 404)
        if (input.nombre !== undefined && await this.repository.existsNombre(input.nombre, id)) {
            throw new HttpError("Ya existe una plataforma con ese nombre", 409)
        }
        await this.repository.update(id, { ...input, updatedBy: usuarioId })
        return this.getAdmin(id)
    }

    async cambiarEstado(id: number, input: EstadoInput, usuarioId: number): Promise<PlataformaAdmin> {
        const plataforma = await this.repository.findById(id)
        if (!plataforma) throw new HttpError("Plataforma no encontrada", 404)
        await this.repository.update(id, { estado: input.estado, updatedBy: usuarioId })
        return this.getAdmin(id)
    }

    private toAdmin(plataforma: Plataforma, stock: StockPlataforma): PlataformaAdmin {
        return {
            id: plataforma.id,
            nombre: plataforma.nombre,
            descripcion: plataforma.descripcion,
            logoUrl: plataforma.logoUrl,
            maxPantallas: plataforma.maxPantallas,
            estado: plataforma.estado,
            stock,
            createdAt: plataforma.createdAt,
            updatedAt: plataforma.updatedAt
        }
    }
}
