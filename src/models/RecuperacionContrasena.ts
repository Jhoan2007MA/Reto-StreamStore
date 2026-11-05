import { Optional } from "sequelize"
import { BelongsTo, Column, Comment, DataType, ForeignKey, Model, Table } from "sequelize-typescript"
import { User } from "./User"

export interface RecuperacionContrasenaAttributes {
    id: number
    usuarioId: number
    tokenHash: string
    expiraAt: Date
    usadoAt: Date | null
    createdBy: number | null
    updatedBy: number | null
    createdAt: Date
    updatedAt: Date
}

export type RecuperacionContrasenaCreationAttributes = Optional<RecuperacionContrasenaAttributes, "id" | "usadoAt" | "createdBy" | "updatedBy" | "createdAt" | "updatedAt">

@Table({ tableName: "recuperacionesContrasena", timestamps: true })
export class RecuperacionContrasena extends Model<RecuperacionContrasenaAttributes, RecuperacionContrasenaCreationAttributes> {
    @Column({ type: DataType.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true })
    id!: number

    @ForeignKey(() => User)
    @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false })
    usuarioId!: number

    @Comment("SHA-256 del token enviado por correo")
    @Column({ type: DataType.CHAR(64), allowNull: false, unique: true })
    tokenHash!: string

    @Column({ type: DataType.DATE, allowNull: false })
    expiraAt!: Date

    @Comment("NULL mientras el enlace no se haya usado ni invalidado")
    @Column({ type: DataType.DATE, allowNull: true })
    usadoAt!: Date | null

    @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: true })
    createdBy!: number | null

    @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: true })
    updatedBy!: number | null

    @Column({ type: DataType.DATE, allowNull: false })
    createdAt!: Date

    @Column({ type: DataType.DATE, allowNull: false })
    updatedAt!: Date

    @BelongsTo(() => User, "usuarioId")
    usuario?: User
}
