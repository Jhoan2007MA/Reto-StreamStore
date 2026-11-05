import { Optional } from "sequelize"
import { Column, Comment, DataType, HasMany, Model, Table } from "sequelize-typescript"
import { User } from "./User"

export interface RolAttributes {
    id: number
    nombre: string
    descripcion: string | null
    estado: number
    createdBy: number | null
    updatedBy: number | null
    createdAt: Date
    updatedAt: Date
}

export type RolCreationAttributes = Optional<RolAttributes, "id" | "descripcion" | "estado" | "createdBy" | "updatedBy" | "createdAt" | "updatedAt">

@Table({ tableName: "roles", timestamps: true })
export class Rol extends Model<RolAttributes, RolCreationAttributes> {
    @Column({ type: DataType.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true })
    id!: number

    @Column({ type: DataType.STRING(50), allowNull: false, unique: true })
    nombre!: string

    @Column({ type: DataType.STRING(255), allowNull: true })
    descripcion!: string | null

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

    @HasMany(() => User, "rolId")
    usuarios?: User[]
}
