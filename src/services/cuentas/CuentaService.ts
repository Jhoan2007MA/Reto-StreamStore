import { randomInt } from "crypto"
import { ESTADO_CUENTA, ESTADO_PANTALLA, ESTADO_REGISTRO } from "../../constants/estados"
import { CuentaInventario, EstadoCuentaNombre, EstadoPantallaNombre } from "../../interfaces/Inventario"
import { Cuenta } from "../../models/Cuenta"
import { CuentaRepository } from "../../repositories/cuentas/CuentaRepository"
import { encrypt } from "../../utils/crypto"
import { HttpError } from "../../utils/httpError"
import { getOffset, pagination, PaginatedResult } from "../../utils/pagination"
import { CreateCuentaInput, ListCuentaQuery } from "../../validators/cuentas/CuentaValidators"

const ESTADO_CUENTA_POR_NOMBRE: Record<EstadoCuentaNombre, number> = {
    disponible: ESTADO_CUENTA.DISPONIBLE,
    parcial: ESTADO_CUENTA.PARCIAL,
    vendida: ESTADO_CUENTA.VENDIDA,
    inactiva: ESTADO_CUENTA.INACTIVA
}

const NOMBRE_ESTADO_CUENTA = new Map<number, EstadoCuentaNombre>(
    Object.entries(ESTADO_CUENTA_POR_NOMBRE).map(([nombre, codigo]) => [codigo, nombre as EstadoCuentaNombre])
)

const generarPin = (): string => randomInt(0, 10000).toString().padStart(4, "0")

export class CuentaService {
    constructor(private readonly repository: CuentaRepository) {}

    async create(input: CreateCuentaInput, usuarioId: number): Promise<CuentaInventario> {
        const plataforma = await this.repository.findPlataforma(input.plataformaId)
        if (!plataforma) throw new HttpError("Plataforma no encontrada", 404)
        if (plataforma.estado !== ESTADO_REGISTRO.ACTIVO) throw new HttpError("La plataforma está inactiva", 403)
        if (await this.repository.existsCorreo(input.plataformaId, input.correoAcceso)) {
            throw new HttpError(`Ya existe una cuenta de ${plataforma.nombre} con ese correo`, 409)
        }

        const auditoria = { createdBy: usuarioId, updatedBy: usuarioId }
        const pantallas = Array.from({ length: plataforma.maxPantallas }, (_, index) => ({
            nombrePerfil: `Perfil ${index + 1}`,
            pin: generarPin(),
            ...auditoria
        }))
        const id = await this.repository.createConPantallas({
            plataformaId: input.plataformaId,
            correoAcceso: input.correoAcceso,
            contrasenaAcceso: encrypt(input.contrasenaAcceso),
            ...auditoria
        }, pantallas)

        const cuenta = await this.repository.findInventarioById(id)
        if (!cuenta) throw new HttpError("No se pudo crear la cuenta", 500)
        return this.toInventario(cuenta)
    }

    async list(query: ListCuentaQuery): Promise<PaginatedResult<CuentaInventario>> {
        const result = await this.repository.findAndCountInventario({
            plataformaId: query.plataforma,
            estado: query.estado ? ESTADO_CUENTA_POR_NOMBRE[query.estado] : undefined,
            limit: query.limit,
            offset: getOffset(query.limit, query.page)
        })
        const rows = result.rows.map((cuenta) => this.toInventario(cuenta))
        return pagination({ count: result.count, rows }, query.limit, query.page)
    }

    private toInventario(cuenta: Cuenta): CuentaInventario {
        const pantallas = (cuenta.pantallas ?? []).map((pantalla) => ({
            id: pantalla.id,
            nombrePerfil: pantalla.nombrePerfil,
            pin: pantalla.pin,
            estado: (pantalla.estado === ESTADO_PANTALLA.VENDIDA ? "vendida" : "disponible") as EstadoPantallaNombre
        }))
        const vendidas = pantallas.filter((pantalla) => pantalla.estado === "vendida").length
        return {
            id: cuenta.id,
            plataforma: {
                id: cuenta.plataforma?.id ?? cuenta.plataformaId,
                nombre: cuenta.plataforma?.nombre ?? ""
            },
            correoAcceso: cuenta.correoAcceso,
            estado: NOMBRE_ESTADO_CUENTA.get(cuenta.estado) ?? "inactiva",
            pantallasTotal: pantallas.length,
            pantallasDisponibles: pantallas.length - vendidas,
            pantallasVendidas: vendidas,
            pantallas,
            createdAt: cuenta.createdAt
        }
    }
}
