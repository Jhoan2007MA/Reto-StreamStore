import { Op, QueryTypes } from "sequelize"
import { sequelize } from "../../config/database"
import { ESTADO_COMPRA, ESTADO_SERVICIO, ROLES } from "../../constants/estados"
import { VentasPeriodo } from "../../interfaces/Admin"
import { Compra } from "../../models/Compra"
import { Plataforma } from "../../models/Plataforma"
import { Servicio } from "../../models/Servicio"
import { User } from "../../models/User"

interface CuentasEstadoRow {
    plataformaId: number
    estado: number
    total: number | string
}

export class ResumenRepository {
    async ventasEntre(desde: Date, hasta: Date): Promise<VentasPeriodo> {
        const where = { estado: ESTADO_COMPRA.PAGADA, pagadaAt: { [Op.gte]: desde, [Op.lt]: hasta } }
        const [compras, total] = await Promise.all([
            Compra.count({ where }),
            Compra.sum("total", { where })
        ])
        return { compras, total: Number(total ?? 0) }
    }

    findPlataformas(): Promise<Plataforma[]> {
        return Plataforma.findAll({ attributes: ["id", "nombre", "estado"], order: [["nombre", "ASC"]] })
    }

    async cuentasPorEstado(): Promise<CuentasEstadoRow[]> {
        return sequelize.query<CuentasEstadoRow>(
            "SELECT plataformaId, estado, COUNT(*) AS total FROM cuentas GROUP BY plataformaId, estado",
            { type: QueryTypes.SELECT }
        )
    }

    async contarServicios(ahora: Date, limitePorVencer: Date): Promise<{ activos: number, porVencer: number, vencidos: number }> {
        const activo = ESTADO_SERVICIO.ACTIVO
        const [activos, porVencer, vencidos] = await Promise.all([
            Servicio.count({ where: { estado: activo, fechaVencimiento: { [Op.gte]: limitePorVencer } } }),
            Servicio.count({ where: { estado: activo, fechaVencimiento: { [Op.gt]: ahora, [Op.lt]: limitePorVencer } } }),
            Servicio.count({
                where: {
                    [Op.or]: [
                        { estado: ESTADO_SERVICIO.VENCIDO },
                        { estado: activo, fechaVencimiento: { [Op.lte]: ahora } }
                    ]
                }
            })
        ])
        return { activos, porVencer, vencidos }
    }

    contarClientes(): Promise<number> {
        return User.count({ where: { rolId: ROLES.CLIENTE } })
    }
}
