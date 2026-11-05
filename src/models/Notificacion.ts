import { Optional } from "sequelize"
import { BelongsTo, Column, Comment, DataType, ForeignKey, Model, Table } from "sequelize-typescript"
import { Servicio } from "./Servicio"

export interface NotificacionAttributes {
    id: number
    servicioId: number
    tipo: number
    enviadaAt: Date
    createdBy: number | null
    updatedBy: number | null
    createdAt: Date
    updatedAt: Date
}

export type NotificacionCreationAttributes = Optional<NotificacionAttributes, "id" | "createdBy" | "updatedBy" | "createdAt" | "updatedAt">

@Table({ tableName: "notificaciones", timestamps: true })
export class Notificacion extends Model<NotificacionAttributes, NotificacionCreationAttributes> {
    @Column({ type: DataType.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true })
    id!: number

    @ForeignKey(() => Servicio)
    @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false })
    servicioId!: number

    @Comment("1 = 3 días, 2 = 1 día, 3 = vencido")
    @Column({ type: DataType.TINYINT, allowNull: false })
    tipo!: number

    @Column({ type: DataType.DATE, allowNull: false })
    enviadaAt!: Date

    @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: true })
    createdBy!: number | null

    @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: true })
    updatedBy!: number | null

    @Column({ type: DataType.DATE, allowNull: false })
    createdAt!: Date

    @Column({ type: DataType.DATE, allowNull: false })
    updatedAt!: Date

    @BelongsTo(() => Servicio, "servicioId")
    servicio?: Servicio
}
