import { Optional } from "sequelize"
import { BelongsTo, Column, Comment, DataType, ForeignKey, Model, Table } from "sequelize-typescript"
import { User } from "./User"

export interface VerificacionCorreoAttributes {
    id: number
    usuarioId: number
    codigoHash: string
    expiraAt: Date
    intentos: number
    usadoAt: Date | null
    createdBy: number | null
    updatedBy: number | null
    createdAt: Date
    updatedAt: Date
}

export type VerificacionCorreoCreationAttributes = Optional<VerificacionCorreoAttributes, "id" | "intentos" | "usadoAt" | "createdBy" | "updatedBy" | "createdAt" | "updatedAt">

@Table({ tableName: "verificacionesCorreo", timestamps: true })
export class VerificacionCorreo extends Model<VerificacionCorreoAttributes, VerificacionCorreoCreationAttributes> {
    @Column({ type: DataType.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true })
    id!: number

    @ForeignKey(() => User)
    @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false })
    usuarioId!: number

    @Comment("HMAC-SHA256 del código enviado por correo")
    @Column({ type: DataType.CHAR(64), allowNull: false })
    codigoHash!: string

    @Column({ type: DataType.DATE, allowNull: false })
    expiraAt!: Date

    @Comment("Intentos de verificación realizados con este código")
    @Column({ type: DataType.TINYINT.UNSIGNED, allowNull: false, defaultValue: 0 })
    intentos!: number

    @Comment("NULL mientras el código no se haya usado ni invalidado")
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
