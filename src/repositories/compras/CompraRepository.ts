import { DatabaseError, QueryTypes, Transaction, WhereOptions } from "sequelize"
import { sequelize } from "../../config/database"
import { ESTADO_COMPRA, ESTADO_CUENTA, ESTADO_PANTALLA } from "../../constants/estados"
import { CarritoItem } from "../../models/CarritoItem"
import { Compra, CompraAttributes } from "../../models/Compra"
import { CompraItem } from "../../models/CompraItem"
import { Cuenta } from "../../models/Cuenta"
import { Pantalla } from "../../models/Pantalla"
import { Plataforma } from "../../models/Plataforma"
import { Producto } from "../../models/Producto"
import { Servicio, ServicioCreationAttributes } from "../../models/Servicio"

interface ItemNuevo {
    productoId: number
    cantidad: number
    precioUnitario: string
    subtotal: string
}

interface FiltrosCompra {
    usuarioId: number
    estado?: number
    limit: number
    offset: number
}

interface PantallaLibreRow {
    pantallaId: number
    cuentaId: number
}

const MAX_INTENTOS = 3

const esDeadlock = (error: unknown): boolean =>
    error instanceof DatabaseError && "code" in error.parent && error.parent.code === "ER_LOCK_DEADLOCK"

const productoInclude = {
    model: Producto,
    attributes: ["id", "plataformaId", "tipo", "duracionDias"],
    include: [{ model: Plataforma, attributes: ["id", "nombre", "logoUrl"] }]
}

export class CompraRepository {
    async transaction<T>(fn: (transaction: Transaction) => Promise<T>): Promise<T> {
        for (let intento = 1; ; intento++) {
            try {
                return await sequelize.transaction(fn)
            } catch (error) {
                if (!esDeadlock(error) || intento >= MAX_INTENTOS) throw error
            }
        }
    }

    async createConItems(usuarioId: number, total: string, items: ItemNuevo[]): Promise<number> {
        return sequelize.transaction(async (transaction) => {
            await Compra.update(
                { estado: ESTADO_COMPRA.CANCELADA, updatedBy: usuarioId },
                { where: { usuarioId, estado: ESTADO_COMPRA.PENDIENTE }, transaction }
            )
            const compra = await Compra.create(
                { usuarioId, total, estado: ESTADO_COMPRA.PENDIENTE, createdBy: usuarioId, updatedBy: usuarioId },
                { transaction }
            )
            await CompraItem.bulkCreate(
                items.map((item) => ({ ...item, compraId: compra.id, createdBy: usuarioId, updatedBy: usuarioId })),
                { transaction }
            )
            return compra.id
        })
    }

    findParaPagar(id: number, usuarioId: number, transaction: Transaction): Promise<Compra | null> {
        return Compra.findOne({
            where: { id, usuarioId },
            attributes: ["id", "estado"],
            transaction,
            lock: transaction.LOCK.UPDATE
        })
    }

    findItems(compraId: number, transaction: Transaction): Promise<CompraItem[]> {
        return CompraItem.findAll({
            where: { compraId },
            attributes: ["id", "productoId", "cantidad"],
            include: [productoInclude],
            order: [["id", "ASC"]],
            transaction
        })
    }

    async tomarCuentaCompleta(plataformaId: number, transaction: Transaction): Promise<number | null> {
        const rows = await sequelize.query<{ cuentaId: number }>(`
            SELECT c.id AS cuentaId
            FROM cuentas c
            WHERE c.plataformaId = :plataformaId
                AND c.estado = :disponible
                AND NOT EXISTS (
                    SELECT 1 FROM pantallas pa
                    WHERE pa.cuentaId = c.id AND pa.estado = :vendida
                )
            ORDER BY c.id
            LIMIT 1
            FOR UPDATE
        `, {
            type: QueryTypes.SELECT,
            replacements: { plataformaId, disponible: ESTADO_CUENTA.DISPONIBLE, vendida: ESTADO_PANTALLA.VENDIDA },
            transaction
        })
        return rows[0]?.cuentaId ?? null
    }

    async marcarCuentaVendida(cuentaId: number, usuarioId: number, transaction: Transaction): Promise<void> {
        await Pantalla.update(
            { estado: ESTADO_PANTALLA.VENDIDA, updatedBy: usuarioId },
            { where: { cuentaId }, transaction }
        )
        await Cuenta.update(
            { estado: ESTADO_CUENTA.VENDIDA, updatedBy: usuarioId },
            { where: { id: cuentaId }, transaction }
        )
    }

    async tomarPantalla(plataformaId: number, transaction: Transaction): Promise<PantallaLibreRow | null> {
        const rows = await sequelize.query<PantallaLibreRow>(`
            SELECT pa.id AS pantallaId, c.id AS cuentaId
            FROM pantallas pa
            INNER JOIN cuentas c ON c.id = pa.cuentaId
            WHERE c.plataformaId = :plataformaId
                AND c.estado IN (:disponible, :parcial)
                AND pa.estado = :libre
            ORDER BY c.estado = :parcial DESC, c.id, pa.id
            LIMIT 1
            FOR UPDATE
        `, {
            type: QueryTypes.SELECT,
            replacements: {
                plataformaId,
                disponible: ESTADO_CUENTA.DISPONIBLE,
                parcial: ESTADO_CUENTA.PARCIAL,
                libre: ESTADO_PANTALLA.DISPONIBLE
            },
            transaction
        })
        return rows[0] ?? null
    }

    async marcarPantallaVendida(pantalla: PantallaLibreRow, usuarioId: number, transaction: Transaction): Promise<void> {
        await Pantalla.update(
            { estado: ESTADO_PANTALLA.VENDIDA, updatedBy: usuarioId },
            { where: { id: pantalla.pantallaId }, transaction }
        )
        const libres = await Pantalla.count({
            where: { cuentaId: pantalla.cuentaId, estado: ESTADO_PANTALLA.DISPONIBLE },
            transaction
        })
        await Cuenta.update(
            { estado: libres === 0 ? ESTADO_CUENTA.VENDIDA : ESTADO_CUENTA.PARCIAL, updatedBy: usuarioId },
            { where: { id: pantalla.cuentaId }, transaction }
        )
    }

    async createServicios(servicios: ServicioCreationAttributes[], transaction: Transaction): Promise<void> {
        await Servicio.bulkCreate(servicios, { transaction })
    }

    async marcarPagada(id: number, metodoPago: string, pagadaAt: Date, usuarioId: number, transaction: Transaction): Promise<void> {
        await Compra.update(
            { estado: ESTADO_COMPRA.PAGADA, metodoPago, pagadaAt, updatedBy: usuarioId },
            { where: { id }, transaction }
        )
    }

    async vaciarCarrito(usuarioId: number, transaction: Transaction): Promise<void> {
        await CarritoItem.destroy({ where: { usuarioId }, transaction })
    }

    findAndCountByUsuario(filtros: FiltrosCompra): Promise<{ count: number, rows: Compra[] }> {
        const where: WhereOptions<CompraAttributes> = { usuarioId: filtros.usuarioId }
        if (filtros.estado !== undefined) where.estado = filtros.estado
        return Compra.findAndCountAll({
            where,
            attributes: ["id", "estado", "total", "metodoPago", "createdAt", "pagadaAt"],
            include: [{ model: CompraItem, attributes: ["id", "cantidad"] }],
            order: [["createdAt", "DESC"], ["id", "DESC"]],
            limit: filtros.limit,
            offset: filtros.offset,
            distinct: true
        })
    }

    findDetalle(id: number, usuarioId: number): Promise<Compra | null> {
        return Compra.findOne({
            where: { id, usuarioId },
            attributes: ["id", "estado", "total", "metodoPago", "createdAt", "pagadaAt"],
            include: [{
                model: CompraItem,
                attributes: ["id", "productoId", "cantidad", "precioUnitario", "subtotal"],
                include: [
                    productoInclude,
                    { model: Servicio, attributes: ["id", "fechaInicio", "fechaVencimiento"] }
                ]
            }],
            order: [[{ model: CompraItem, as: "items" }, "id", "ASC"]]
        })
    }
}
