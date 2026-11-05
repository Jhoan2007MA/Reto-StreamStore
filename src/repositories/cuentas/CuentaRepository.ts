import { WhereOptions } from "sequelize"
import { sequelize } from "../../config/database"
import { Cuenta, CuentaAttributes, CuentaCreationAttributes } from "../../models/Cuenta"
import { Pantalla, PantallaCreationAttributes } from "../../models/Pantalla"
import { Plataforma } from "../../models/Plataforma"

interface FiltrosCuenta {
    plataformaId?: number
    estado?: number
    limit: number
    offset: number
}

type PantallaNueva = Omit<PantallaCreationAttributes, "cuentaId">

const inventarioInclude = [
    { model: Plataforma, attributes: ["id", "nombre"] },
    { model: Pantalla, attributes: ["id", "nombrePerfil", "pin", "estado"] }
]

export class CuentaRepository {
    findPlataforma(id: number): Promise<Plataforma | null> {
        return Plataforma.findByPk(id, { attributes: ["id", "nombre", "maxPantallas", "estado"] })
    }

    async existsCorreo(plataformaId: number, correoAcceso: string): Promise<boolean> {
        const count = await Cuenta.count({ where: { plataformaId, correoAcceso } })
        return count > 0
    }

    async createConPantallas(cuenta: CuentaCreationAttributes, pantallas: PantallaNueva[]): Promise<number> {
        return sequelize.transaction(async (transaction) => {
            const creada = await Cuenta.create(cuenta, { transaction })
            await Pantalla.bulkCreate(
                pantallas.map((pantalla) => ({ ...pantalla, cuentaId: creada.id })),
                { transaction }
            )
            return creada.id
        })
    }

    findInventarioById(id: number): Promise<Cuenta | null> {
        return Cuenta.findByPk(id, {
            attributes: ["id", "plataformaId", "correoAcceso", "estado", "createdAt"],
            include: inventarioInclude,
            order: [[{ model: Pantalla, as: "pantallas" }, "id", "ASC"]]
        })
    }

    findAndCountInventario(filtros: FiltrosCuenta): Promise<{ count: number, rows: Cuenta[] }> {
        const where: WhereOptions<CuentaAttributes> = {}
        if (filtros.plataformaId !== undefined) where.plataformaId = filtros.plataformaId
        if (filtros.estado !== undefined) where.estado = filtros.estado
        return Cuenta.findAndCountAll({
            where,
            attributes: ["id", "plataformaId", "correoAcceso", "estado", "createdAt"],
            include: inventarioInclude,
            order: [["plataformaId", "ASC"], ["id", "ASC"], [{ model: Pantalla, as: "pantallas" }, "id", "ASC"]],
            limit: filtros.limit,
            offset: filtros.offset,
            distinct: true
        })
    }
}
