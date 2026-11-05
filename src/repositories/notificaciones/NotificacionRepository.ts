import { Op, UniqueConstraintError } from "sequelize"
import { ESTADO_COMPRA, ESTADO_SERVICIO } from "../../constants/estados"
import { Compra } from "../../models/Compra"
import { CompraItem } from "../../models/CompraItem"
import { Cuenta } from "../../models/Cuenta"
import { Notificacion } from "../../models/Notificacion"
import { Plataforma } from "../../models/Plataforma"
import { Servicio } from "../../models/Servicio"
import { User } from "../../models/User"

export class NotificacionRepository {
    findActivosQueVencenAntesDe(limite: Date): Promise<Servicio[]> {
        return Servicio.findAll({
            where: {
                estado: ESTADO_SERVICIO.ACTIVO,
                fechaVencimiento: { [Op.lt]: limite }
            },
            attributes: ["id", "pantallaId", "fechaVencimiento"],
            include: [
                { model: User, attributes: ["id", "nombre", "correo"] },
                {
                    model: CompraItem,
                    attributes: ["id"],
                    required: true,
                    include: [
                        { model: Compra, attributes: ["id"], where: { estado: ESTADO_COMPRA.PAGADA }, required: true }
                    ]
                },
                {
                    model: Cuenta,
                    attributes: ["id"],
                    include: [{ model: Plataforma, attributes: ["id", "nombre"] }]
                }
            ],
            order: [["fechaVencimiento", "ASC"], ["id", "ASC"]]
        })
    }

    async reservar(servicioId: number, tipo: number): Promise<boolean> {
        try {
            await Notificacion.create({ servicioId, tipo, enviadaAt: new Date() })
            return true
        } catch (error) {
            if (error instanceof UniqueConstraintError) return false
            throw error
        }
    }

    async liberar(servicioId: number, tipo: number): Promise<void> {
        await Notificacion.destroy({ where: { servicioId, tipo } })
    }

    async marcarVencidos(ahora: Date): Promise<number> {
        const [actualizados] = await Servicio.update(
            { estado: ESTADO_SERVICIO.VENCIDO },
            { where: { estado: ESTADO_SERVICIO.ACTIVO, fechaVencimiento: { [Op.lte]: ahora } } }
        )
        return actualizados
    }
}
