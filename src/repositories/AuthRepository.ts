import { Rol } from "../models/Rol"
import { User, UserCreationAttributes } from "../models/User"

const rolInclude = { model: Rol, attributes: ["id", "nombre"] }

export class AuthRepository {
    findByCorreo(correo: string): Promise<User | null> {
        return User.findOne({
            where: { correo },
            attributes: ["id", "nombre", "correo", "telefono", "contrasenaHash", "rolId", "estado", "verificadoAt"],
            include: [rolInclude]
        })
    }

    findById(id: number): Promise<User | null> {
        return User.findByPk(id, {
            attributes: ["id", "nombre", "correo", "telefono", "rolId", "estado"],
            include: [rolInclude]
        })
    }

    findRefreshTokenById(id: number): Promise<User | null> {
        return User.findByPk(id, {
            attributes: ["id", "nombre", "correo", "telefono", "rolId", "estado", "refreshToken"],
            include: [rolInclude]
        })
    }

    async create(data: UserCreationAttributes): Promise<number> {
        const user = await User.create(data)
        return user.id
    }

    async updateRefreshToken(id: number, refreshToken: string | null): Promise<void> {
        await User.update({ refreshToken }, { where: { id } })
    }
}
