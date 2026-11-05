import bcrypt from "bcrypt"
import { Optional } from "sequelize"
import { BeforeSave, BelongsTo, Column, Comment, DataType, ForeignKey, Model, Table } from "sequelize-typescript"
import { Rol } from "./Rol"

export interface UserAttributes {
    id: number
    nombre: string
    correo: string
    contrasenaHash: string
    rolId: number
    estado: number
    refreshToken: string | null
    createdBy: number | null
    updatedBy: number | null
    createdAt: Date
    updatedAt: Date
}

export type UserCreationAttributes = Optional<UserAttributes, "id" | "estado" | "refreshToken" | "createdBy" | "updatedBy" | "createdAt" | "updatedAt">

@Table({ tableName: "usuarios", timestamps: true })
export class User extends Model<UserAttributes, UserCreationAttributes> {
    @Column({ type: DataType.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true })
    id!: number

    @Column({ type: DataType.STRING(100), allowNull: false })
    nombre!: string

    @Column({ type: DataType.STRING(150), allowNull: false, unique: true })
    correo!: string

    @Column({ type: DataType.STRING(255), allowNull: false })
    contrasenaHash!: string

    @ForeignKey(() => Rol)
    @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false })
    rolId!: number

    @Comment("1 = activo, 0 = inactivo")
    @Column({ type: DataType.TINYINT, allowNull: false, defaultValue: 1 })
    estado!: number

    @Column({ type: DataType.STRING(512), allowNull: true })
    refreshToken!: string | null

    @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: true })
    createdBy!: number | null

    @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: true })
    updatedBy!: number | null

    @Column({ type: DataType.DATE, allowNull: false })
    createdAt!: Date

    @Column({ type: DataType.DATE, allowNull: false })
    updatedAt!: Date

    @BelongsTo(() => Rol, "rolId")
    rol?: Rol

    @BeforeSave
    static async hashContrasena(user: User): Promise<void> {
        if (user.changed("contrasenaHash")) {
            user.contrasenaHash = await bcrypt.hash(user.contrasenaHash, 10)
        }
    }
}
