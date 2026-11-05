import { Optional } from "sequelize"
import { BelongsTo, Column, Comment, DataType, ForeignKey, Model, Table } from "sequelize-typescript"
import { Plataforma } from "./Plataforma"

export interface ProductoAttributes {
    id: number
    plataformaId: number
    tipo: number
    duracionDias: number
    precio: string
    estado: number
    createdBy: number | null
    updatedBy: number | null
    createdAt: Date
    updatedAt: Date
}

export type ProductoCreationAttributes = Optional<ProductoAttributes, "id" | "estado" | "createdBy" | "updatedBy" | "createdAt" | "updatedAt">

@Table({ tableName: "productos", timestamps: true })
export class Producto extends Model<ProductoAttributes, ProductoCreationAttributes> {
    @Column({ type: DataType.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true })
    id!: number

    @ForeignKey(() => Plataforma)
    @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false })
    plataformaId!: number

    @Comment("1 = cuenta completa, 2 = pantalla")
    @Column({ type: DataType.TINYINT, allowNull: false })
    tipo!: number

    @Column({ type: DataType.SMALLINT.UNSIGNED, allowNull: false })
    duracionDias!: number

    @Column({ type: DataType.DECIMAL(14, 2), allowNull: false })
    precio!: string

    @Comment("1 = activo, 0 = inactivo")
    @Column({ type: DataType.TINYINT, allowNull: false, defaultValue: 1 })
    estado!: number

    @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: true })
    createdBy!: number | null

    @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: true })
    updatedBy!: number | null

    @Column({ type: DataType.DATE, allowNull: false })
    createdAt!: Date

    @Column({ type: DataType.DATE, allowNull: false })
    updatedAt!: Date

    @BelongsTo(() => Plataforma, "plataformaId")
    plataforma?: Plataforma
}
