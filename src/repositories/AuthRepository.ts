import { Rol } from "../models/Rol"
import { User } from "../models/User"

const rolInclude = { model: Rol, attributes: ["id", "nombre"] }

export class AuthRepository {
    findByCorreo(correo: string): Promise<User | null> {
        return User.findOne({
            where: { correo },
            attributes: ["id", "nombre", "correo", "contrasenaHash", "rolId", "estado"],
            include: [rolInclude]
        })
    }

    findById(id: number): Promise<User | null> {
        return User.findByPk(id, {
            attributes: ["id", "nombre", "correo", "rolId", "estado"],
            include: [rolInclude]
        })
    }

    findRefreshTokenById(id: number): Promise<User | null> {
        return User.findByPk(id, {
            attributes: ["id", "nombre", "correo", "rolId", "estado", "refreshToken"],
            include: [rolInclude]
        })
    }

    async updateRefreshToken(id: number, refreshToken: string | null): Promise<void> {
        await User.update({ refreshToken }, { where: { id } })
    }
}
