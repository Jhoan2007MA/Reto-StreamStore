import { Op, WhereOptions } from "sequelize"
import { ESTADO_REGISTRO } from "../../constants/estados"
import { Plataforma, PlataformaAttributes, PlataformaCreationAttributes } from "../../models/Plataforma"

interface FiltrosPlataforma {
    estado?: number
    buscar?: string
    limit: number
    offset: number
}

const adminAttributes = ["id", "nombre", "descripcion", "logoUrl", "maxPantallas", "estado", "createdAt", "updatedAt"]

export class PlataformaRepository {
    findActivas(): Promise<Plataforma[]> {
        return Plataforma.findAll({
            where: { estado: ESTADO_REGISTRO.ACTIVO },
            attributes: ["id", "nombre", "descripcion", "logoUrl", "maxPantallas"],
            order: [["nombre", "ASC"]]
        })
    }

    findAndCountAdmin(filtros: FiltrosPlataforma): Promise<{ count: number, rows: Plataforma[] }> {
        const where: WhereOptions<PlataformaAttributes> = {}
        if (filtros.estado !== undefined) where.estado = filtros.estado
        if (filtros.buscar) where.nombre = { [Op.like]: `%${filtros.buscar}%` }
        return Plataforma.findAndCountAll({
            where,
            attributes: adminAttributes,
            order: [["nombre", "ASC"]],
            limit: filtros.limit,
            offset: filtros.offset
        })
    }

    findById(id: number): Promise<Plataforma | null> {
        return Plataforma.findByPk(id, { attributes: adminAttributes })
    }

    async existsNombre(nombre: string, excluirId?: number): Promise<boolean> {
        const where: WhereOptions<PlataformaAttributes> = { nombre }
        if (excluirId !== undefined) where.id = { [Op.ne]: excluirId }
        const count = await Plataforma.count({ where })
        return count > 0
    }

    async create(data: PlataformaCreationAttributes): Promise<number> {
        const plataforma = await Plataforma.create(data)
        return plataforma.id
    }

    async update(id: number, data: Partial<PlataformaAttributes>): Promise<void> {
        await Plataforma.update(data, { where: { id } })
    }
}
