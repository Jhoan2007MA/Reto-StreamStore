import { TIPO_PRODUCTO } from "../../constants/estados"
import { ServicioCliente } from "../../interfaces/Servicio"
import { Servicio } from "../../models/Servicio"
import { ServicioRepository } from "../../repositories/servicios/ServicioRepository"
import { decrypt } from "../../utils/crypto"
import { logger } from "../../utils/logger"
import { diasRestantes, estadoVencimiento } from "../../utils/vencimiento"
import { ListServicioQuery } from "../../validators/servicios/ServicioValidators"

export class ServicioService {
    constructor(private readonly repository: ServicioRepository) {}

    async listMios(usuarioId: number, query: ListServicioQuery): Promise<ServicioCliente[]> {
        const ahora = new Date()
        const servicios = await this.repository.findPagadosByUsuario(usuarioId)
        const lista = servicios.map((servicio) => this.toCliente(servicio, ahora))
        const filtrados = query.estado ? lista.filter((servicio) => servicio.estado === query.estado) : lista
        return filtrados.sort((a, b) =>
            Number(a.estado === "vencido") - Number(b.estado === "vencido") ||
            a.fechaVencimiento.getTime() - b.fechaVencimiento.getTime()
        )
    }

    private descifrar(servicio: Servicio): string | null {
        const cifrada = servicio.cuenta?.contrasenaAcceso
        if (!cifrada) return null
        try {
            return decrypt(cifrada)
        } catch {
            logger.error(`No se pudo descifrar la contraseña de la cuenta ${servicio.cuentaId}`)
            return null
        }
    }

    private toCliente(servicio: Servicio, ahora: Date): ServicioCliente {
        const producto = servicio.compraItem?.producto
        const plataforma = servicio.cuenta?.plataforma
        const fechaVencimiento = new Date(servicio.fechaVencimiento)
        return {
            id: servicio.id,
            compraId: servicio.compraItem?.compraId ?? 0,
            producto: {
                id: producto?.id ?? 0,
                tipo: producto?.tipo === TIPO_PRODUCTO.CUENTA ? "cuenta" : "pantalla",
                duracionDias: producto?.duracionDias ?? 0
            },
            plataforma: {
                id: plataforma?.id ?? servicio.cuenta?.plataformaId ?? 0,
                nombre: plataforma?.nombre ?? "",
                logoUrl: plataforma?.logoUrl ?? null
            },
            credenciales: {
                correo: servicio.cuenta?.correoAcceso ?? "",
                contrasena: this.descifrar(servicio),
                perfil: servicio.pantalla?.nombrePerfil ?? null,
                pin: servicio.pantalla?.pin ?? null
            },
            fechaCompra: servicio.compraItem?.compra?.pagadaAt ?? servicio.fechaInicio,
            fechaInicio: servicio.fechaInicio,
            fechaVencimiento,
            diasRestantes: Math.max(diasRestantes(fechaVencimiento, ahora), 0),
            estado: estadoVencimiento(fechaVencimiento, ahora)
        }
    }
}
