import { Optional } from "sequelize"
import { BelongsTo, Column, Comment, DataType, ForeignKey, HasMany, Model, Table } from "sequelize-typescript"
import { CompraItem } from "./CompraItem"
import { Cuenta } from "./Cuenta"
import { Notificacion } from "./Notificacion"
import { Pantalla } from "./Pantalla"
import { User } from "./User"

export interface ServicioAttributes {
    id: number
    compraItemId: number
    usuarioId: number
    cuentaId: number
    pantallaId: number | null
    fechaInicio: Date
    fechaVencimiento: Date
    estado: number
    createdBy: number | null
    updatedBy: number | null
    createdAt: Date
    updatedAt: Date
}

export type ServicioCreationAttributes = Optional<ServicioAttributes, "id" | "pantallaId" | "estado" | "createdBy" | "updatedBy" | "createdAt" | "updatedAt">

@Table({ tableName: "servicios", timestamps: true })
export class Servicio extends Model<ServicioAttributes, ServicioCreationAttributes> {
    @Column({ type: DataType.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true })
    id!: number

    @ForeignKey(() => CompraItem)
    @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false })
    compraItemId!: number

    @ForeignKey(() => User)
    @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false })
    usuarioId!: number

    @ForeignKey(() => Cuenta)
    @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false })
    cuentaId!: number

    @Comment("NULL si es cuenta completa")
    @ForeignKey(() => Pantalla)
    @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: true })
    pantallaId!: number | null

    @Column({ type: DataType.DATE, allowNull: false })
    fechaInicio!: Date

    @Column({ type: DataType.DATE, allowNull: false })
    fechaVencimiento!: Date

    @Comment("1 = activo, 2 = vencido")
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

    @BelongsTo(() => CompraItem, "compraItemId")
    compraItem?: CompraItem

    @BelongsTo(() => User, "usuarioId")
    usuario?: User

    @BelongsTo(() => Cuenta, "cuentaId")
    cuenta?: Cuenta

    @BelongsTo(() => Pantalla, "pantallaId")
    pantalla?: Pantalla

    @HasMany(() => Notificacion, "servicioId")
    notificaciones?: Notificacion[]
}
