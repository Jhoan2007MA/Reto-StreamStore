import { Optional } from "sequelize"
import { BelongsTo, Column, Comment, DataType, ForeignKey, HasMany, Model, Table } from "sequelize-typescript"
import { Pantalla } from "./Pantalla"
import { Plataforma } from "./Plataforma"

export interface CuentaAttributes {
    id: number
    plataformaId: number
    correoAcceso: string
    contrasenaAcceso: string
    estado: number
    createdBy: number | null
    updatedBy: number | null
    createdAt: Date
    updatedAt: Date
}

export type CuentaCreationAttributes = Optional<CuentaAttributes, "id" | "estado" | "createdBy" | "updatedBy" | "createdAt" | "updatedAt">

@Table({ tableName: "cuentas", timestamps: true })
export class Cuenta extends Model<CuentaAttributes, CuentaCreationAttributes> {
    @Column({ type: DataType.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true })
    id!: number

    @ForeignKey(() => Plataforma)
    @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false })
    plataformaId!: number

    @Column({ type: DataType.STRING(150), allowNull: false })
    correoAcceso!: string

    @Comment("Cifrada con AES-256-GCM")
    @Column({ type: DataType.STRING(512), allowNull: false })
    contrasenaAcceso!: string

    @Comment("1 = disponible, 2 = parcial, 3 = vendida, 0 = inactiva")
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

    @HasMany(() => Pantalla, "cuentaId")
    pantallas?: Pantalla[]
}
