import { Optional } from "sequelize"
import { BelongsTo, Column, Comment, DataType, ForeignKey, HasMany, Model, Table } from "sequelize-typescript"
import { Compra } from "./Compra"
import { Producto } from "./Producto"
import { Servicio } from "./Servicio"

export interface CompraItemAttributes {
    id: number
    compraId: number
    productoId: number
    servicioId: number | null
    cantidad: number
    precioUnitario: string
    subtotal: string
    createdBy: number | null
    updatedBy: number | null
    createdAt: Date
    updatedAt: Date
}

export type CompraItemCreationAttributes = Optional<CompraItemAttributes, "id" | "servicioId" | "createdBy" | "updatedBy" | "createdAt" | "updatedAt">

@Table({ tableName: "compraItems", timestamps: true })
export class CompraItem extends Model<CompraItemAttributes, CompraItemCreationAttributes> {
    @Column({ type: DataType.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true })
    id!: number

    @ForeignKey(() => Compra)
    @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false })
    compraId!: number

    @ForeignKey(() => Producto)
    @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false })
    productoId!: number

    @Comment("Servicio que se renueva; NULL si es compra nueva")
    @ForeignKey(() => Servicio)
    @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: true })
    servicioId!: number | null

    @Column({ type: DataType.SMALLINT.UNSIGNED, allowNull: false })
    cantidad!: number

    @Column({ type: DataType.DECIMAL(14, 2), allowNull: false })
    precioUnitario!: string

    @Column({ type: DataType.DECIMAL(14, 2), allowNull: false })
    subtotal!: string

    @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: true })
    createdBy!: number | null

    @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: true })
    updatedBy!: number | null

    @Column({ type: DataType.DATE, allowNull: false })
    createdAt!: Date

    @Column({ type: DataType.DATE, allowNull: false })
    updatedAt!: Date

    @BelongsTo(() => Compra, "compraId")
    compra?: Compra

    @BelongsTo(() => Producto, "productoId")
    producto?: Producto

    @BelongsTo(() => Servicio, "servicioId")
    servicioRenovado?: Servicio

    @HasMany(() => Servicio, "compraItemId")
    servicios?: Servicio[]
}
