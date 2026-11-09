import { Op } from "sequelize"
import { sequelize } from "../../config/database"
import { User } from "../../models/User"
import { VerificacionCorreo } from "../../models/VerificacionCorreo"

export class VerificacionCorreoRepository {
    findUsuarioPorCorreo(correo: string): Promise<User | null> {
        return User.findOne({ where: { correo }, attributes: ["id", "nombre", "correo", "estado", "verificadoAt"] })
    }

    findUltimaPendiente(usuarioId: number): Promise<VerificacionCorreo | null> {
        return VerificacionCorreo.findOne({
            where: { usuarioId, usadoAt: null },
            attributes: ["id", "codigoHash", "expiraAt", "intentos", "createdAt"],
            order: [["createdAt", "DESC"], ["id", "DESC"]]
        })
    }

    async crear(usuarioId: number, codigoHash: string, expiraAt: Date): Promise<number> {
        return sequelize.transaction(async (transaction) => {
            await VerificacionCorreo.update(
                { usadoAt: new Date(), updatedBy: usuarioId },
                { where: { usuarioId, usadoAt: null }, transaction }
            )
            const verificacion = await VerificacionCorreo.create(
                { usuarioId, codigoHash, expiraAt, createdBy: usuarioId, updatedBy: usuarioId },
                { transaction }
            )
            return verificacion.id
        })
    }

    async eliminar(id: number): Promise<void> {
        await VerificacionCorreo.destroy({ where: { id } })
    }

    async sumarIntento(id: number, maximo: number): Promise<boolean> {
        const [afectadas] = await VerificacionCorreo.update(
            { intentos: sequelize.literal("intentos + 1") },
            { where: { id, usadoAt: null, intentos: { [Op.lt]: maximo } } }
        )
        return afectadas > 0
    }

    async confirmar(id: number, usuarioId: number, ahora: Date): Promise<boolean> {
        return sequelize.transaction(async (transaction) => {
            const [afectadas] = await VerificacionCorreo.update(
                { usadoAt: ahora, updatedBy: usuarioId },
                { where: { id, usuarioId, usadoAt: null }, transaction }
            )
            if (afectadas === 0) return false
            await User.update(
                { verificadoAt: ahora, updatedBy: usuarioId },
                { where: { id: usuarioId, verificadoAt: null }, transaction }
            )
            return true
        })
    }
}
