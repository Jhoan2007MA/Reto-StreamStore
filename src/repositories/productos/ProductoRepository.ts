import { QueryTypes, WhereOptions } from "sequelize"
import { sequelize } from "../../config/database"
import { ESTADO_CUENTA, ESTADO_PANTALLA, ESTADO_REGISTRO } from "../../constants/estados"
import { StockPlataforma } from "../../interfaces/Catalogo"
import { Plataforma } from "../../models/Plataforma"
import { Producto, ProductoAttributes } from "../../models/Producto"

interface FiltrosProducto {
    plataformaId?: number
    tipo?: number
    limit: number
    offset: number
}

interface StockRow {
    plataformaId: number
    stockCuenta: number | string
    stockPantalla: number | string
}

const CUENTAS_VENDIBLES = `${ESTADO_CUENTA.DISPONIBLE}, ${ESTADO_CUENTA.PARCIAL}`

const STOCK_SQL = `
    SELECT
        p.id AS plataformaId,
        (
            SELECT COUNT(*) FROM cuentas c
            WHERE c.plataformaId = p.id
                AND c.estado IN (${CUENTAS_VENDIBLES})
                AND NOT EXISTS (
                    SELECT 1 FROM pantallas pa
                    WHERE pa.cuentaId = c.id AND pa.estado = ${ESTADO_PANTALLA.VENDIDA}
                )
        ) AS stockCuenta,
        (
            SELECT COUNT(*) FROM pantallas pa
            INNER JOIN cuentas c ON c.id = pa.cuentaId
            WHERE c.plataformaId = p.id
                AND c.estado IN (${CUENTAS_VENDIBLES})
                AND pa.estado = ${ESTADO_PANTALLA.DISPONIBLE}
        ) AS stockPantalla
    FROM plataformas p
    WHERE p.id IN (:ids)
`

const plataformaInclude = {
    model: Plataforma,
    attributes: ["id", "nombre", "logoUrl"],
    where: { estado: ESTADO_REGISTRO.ACTIVO },
    required: true
}

export class ProductoRepository {
    findAndCountActivos(filtros: FiltrosProducto): Promise<{ count: number, rows: Producto[] }> {
        const where: WhereOptions<ProductoAttributes> = { estado: ESTADO_REGISTRO.ACTIVO }
        if (filtros.plataformaId !== undefined) where.plataformaId = filtros.plataformaId
        if (filtros.tipo !== undefined) where.tipo = filtros.tipo
        return Producto.findAndCountAll({
            where,
            attributes: ["id", "plataformaId", "tipo", "duracionDias", "precio"],
            include: [plataformaInclude],
            order: [[{ model: Plataforma, as: "plataforma" }, "nombre", "ASC"], ["tipo", "ASC"], ["duracionDias", "ASC"]],
            limit: filtros.limit,
            offset: filtros.offset
        })
    }

    findActivoById(id: number): Promise<Producto | null> {
        return Producto.findOne({
            where: { id, estado: ESTADO_REGISTRO.ACTIVO },
            attributes: ["id", "plataformaId", "tipo", "duracionDias", "precio"],
            include: [plataformaInclude]
        })
    }

    async stockPorPlataforma(plataformaIds: number[]): Promise<Map<number, StockPlataforma>> {
        const stock = new Map<number, StockPlataforma>()
        if (plataformaIds.length === 0) return stock
        const rows = await sequelize.query<StockRow>(STOCK_SQL, {
            type: QueryTypes.SELECT,
            replacements: { ids: [...new Set(plataformaIds)] }
        })
        for (const row of rows) {
            stock.set(Number(row.plataformaId), {
                cuenta: Number(row.stockCuenta),
                pantalla: Number(row.stockPantalla)
            })
        }
        return stock
    }
}
