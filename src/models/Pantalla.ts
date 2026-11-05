import { Optional } from "sequelize"
import { BelongsTo, Column, Comment, DataType, ForeignKey, Model, Table } from "sequelize-typescript"
import { Cuenta } from "./Cuenta"

export interface PantallaAttributes {
    id: number
    cuentaId: number
    nombrePerfil: string
    pin: string
    estado: number
    createdBy: number | null
    updatedBy: number | null
    createdAt: Date
    updatedAt: Date
}

export type PantallaCreationAttributes = Optional<PantallaAttributes, "id" | "estado" | "createdBy" | "updatedBy" | "createdAt" | "updatedAt">

@Table({ tableName: "pantallas", timestamps: true })
export class Pantalla extends Model<PantallaAttributes, PantallaCreationAttributes> {
    @Column({ type: DataType.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true })
    id!: number

    @ForeignKey(() => Cuenta)
    @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false })
    cuentaId!: number

    @Column({ type: DataType.STRING(50), allowNull: false })
    nombrePerfil!: string

    @Column({ type: DataType.STRING(10), allowNull: false })
    pin!: string

    @Comment("1 = disponible, 2 = vendida")
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

    @BelongsTo(() => Cuenta, "cuentaId")
    cuenta?: Cuenta
}
