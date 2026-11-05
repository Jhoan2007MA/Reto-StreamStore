import { Op } from "sequelize"
import { sequelize } from "../../config/database"
import { RecuperacionContrasena } from "../../models/RecuperacionContrasena"
import { User } from "../../models/User"

export class RecuperacionContrasenaRepository {
    findUsuarioPorCorreo(correo: string): Promise<User | null> {
        return User.findOne({ where: { correo }, attributes: ["id", "nombre", "correo", "estado"] })
    }

    findUltimaPendiente(usuarioId: number): Promise<RecuperacionContrasena | null> {
        return RecuperacionContrasena.findOne({
            where: { usuarioId, usadoAt: null },
            attributes: ["id", "createdAt"],
            order: [["createdAt", "DESC"], ["id", "DESC"]]
        })
    }

    async crear(usuarioId: number, tokenHash: string, expiraAt: Date): Promise<void> {
        await sequelize.transaction(async (transaction) => {
            await RecuperacionContrasena.update(
                { usadoAt: new Date() },
                { where: { usuarioId, usadoAt: null }, transaction }
            )
            await RecuperacionContrasena.create({ usuarioId, tokenHash, expiraAt }, { transaction })
        })
    }

    async eliminar(tokenHash: string): Promise<void> {
        await RecuperacionContrasena.destroy({ where: { tokenHash } })
    }

    async restablecer(tokenHash: string, contrasena: string, ahora: Date): Promise<boolean> {
        return sequelize.transaction(async (transaction) => {
            const recuperacion = await RecuperacionContrasena.findOne({
                where: { tokenHash, usadoAt: null, expiraAt: { [Op.gt]: ahora } },
                attributes: ["id", "usuarioId"],
                transaction,
                lock: transaction.LOCK.UPDATE
            })
            if (!recuperacion) return false

            const usuario = await User.findByPk(recuperacion.usuarioId, { transaction })
            if (!usuario) return false

            usuario.contrasenaHash = contrasena
            usuario.refreshToken = null
            usuario.updatedBy = usuario.id
            await usuario.save({ transaction })
            await RecuperacionContrasena.update(
                { usadoAt: ahora, updatedBy: usuario.id },
                { where: { usuarioId: usuario.id, usadoAt: null }, transaction }
            )
            return true
        })
    }
}
