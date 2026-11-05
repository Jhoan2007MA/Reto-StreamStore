import { Optional } from "sequelize"
import { Column, Comment, DataType, HasMany, Model, Table } from "sequelize-typescript"
import { Cuenta } from "./Cuenta"
import { Producto } from "./Producto"

export interface PlataformaAttributes {
    id: number
    nombre: string
    descripcion: string | null
    logoUrl: string | null
    maxPantallas: number
    estado: number
    createdBy: number | null
    updatedBy: number | null
    createdAt: Date
    updatedAt: Date
}

export type PlataformaCreationAttributes = Optional<PlataformaAttributes, "id" | "descripcion" | "logoUrl" | "maxPantallas" | "estado" | "createdBy" | "updatedBy" | "createdAt" | "updatedAt">

@Table({ tableName: "plataformas", timestamps: true })
export class Plataforma extends Model<PlataformaAttributes, PlataformaCreationAttributes> {
    @Column({ type: DataType.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true })
    id!: number

    @Column({ type: DataType.STRING(80), allowNull: false, unique: true })
    nombre!: string

    @Column({ type: DataType.STRING(255), allowNull: true })
    descripcion!: string | null

    @Column({ type: DataType.STRING(500), allowNull: true })
    logoUrl!: string | null

    @Column({ type: DataType.TINYINT.UNSIGNED, allowNull: false, defaultValue: 5 })
    maxPantallas!: number

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

    @HasMany(() => Producto, "plataformaId")
    productos?: Producto[]

    @HasMany(() => Cuenta, "plataformaId")
    cuentas?: Cuenta[]
}
