import { Optional } from "sequelize"
import { BelongsTo, Column, Comment, DataType, ForeignKey, Model, Table } from "sequelize-typescript"
import { Producto } from "./Producto"
import { Servicio } from "./Servicio"
import { User } from "./User"

export interface CarritoItemAttributes {
    id: number
    usuarioId: number
    productoId: number
    servicioId: number | null
    cantidad: number
    createdBy: number | null
    updatedBy: number | null
    createdAt: Date
    updatedAt: Date
}

export type CarritoItemCreationAttributes = Optional<CarritoItemAttributes, "id" | "servicioId" | "createdBy" | "updatedBy" | "createdAt" | "updatedAt">

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

    @Comment("Servicio que se renueva; NULL si es compra nueva")
    @ForeignKey(() => Servicio)
    @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: true })
    servicioId!: number | null

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

    @BelongsTo(() => Servicio, "servicioId")
    servicio?: Servicio
}
