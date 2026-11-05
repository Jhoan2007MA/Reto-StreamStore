import { Optional } from "sequelize"
import { BelongsTo, Column, Comment, DataType, ForeignKey, HasMany, Model, Table } from "sequelize-typescript"
import { CompraItem } from "./CompraItem"
import { User } from "./User"

export interface CompraAttributes {
    id: number
    usuarioId: number
    total: string
    estado: number
    metodoPago: string | null
    pagadaAt: Date | null
    createdBy: number | null
    updatedBy: number | null
    createdAt: Date
    updatedAt: Date
}

export type CompraCreationAttributes = Optional<CompraAttributes, "id" | "estado" | "metodoPago" | "pagadaAt" | "createdBy" | "updatedBy" | "createdAt" | "updatedAt">

@Table({ tableName: "compras", timestamps: true })
export class Compra extends Model<CompraAttributes, CompraCreationAttributes> {
    @Column({ type: DataType.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true })
    id!: number

    @ForeignKey(() => User)
    @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false })
    usuarioId!: number

    @Column({ type: DataType.DECIMAL(14, 2), allowNull: false })
    total!: string

    @Comment("1 = pendiente, 2 = pagada, 3 = cancelada")
    @Column({ type: DataType.TINYINT, allowNull: false, defaultValue: 1 })
    estado!: number

    @Column({ type: DataType.STRING(30), allowNull: true })
    metodoPago!: string | null

    @Column({ type: DataType.DATE, allowNull: true })
    pagadaAt!: Date | null

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

    @HasMany(() => CompraItem, "compraId")
    items?: CompraItem[]
}
