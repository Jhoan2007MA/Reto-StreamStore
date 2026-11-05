import { Optional } from "sequelize"
import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from "sequelize-typescript"
import { Producto } from "./Producto"
import { User } from "./User"

export interface CarritoItemAttributes {
    id: number
    usuarioId: number
    productoId: number
    cantidad: number
    createdBy: number | null
    updatedBy: number | null
    createdAt: Date
    updatedAt: Date
}

export type CarritoItemCreationAttributes = Optional<CarritoItemAttributes, "id" | "createdBy" | "updatedBy" | "createdAt" | "updatedAt">

@Table({ tableName: "carritoItems", timestamps: true })
export class CarritoItem extends Model<CarritoItemAttributes, CarritoItemCreationAttributes> {
    @Column({ type: DataType.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true })
    id!: number

    @ForeignKey(() => User)
    @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false })
    usuarioId!: number

    @ForeignKey(() => Producto)
    @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false })
    productoId!: number

    @Column({ type: DataType.SMALLINT.UNSIGNED, allowNull: false, defaultValue: 1 })
    cantidad!: number

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

    @BelongsTo(() => Producto, "productoId")
    producto?: Producto
}
