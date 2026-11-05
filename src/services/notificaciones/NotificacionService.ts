import { config } from "../../config/config"
import { TIPO_NOTIFICACION } from "../../constants/estados"
import { CorreoFallido, CorreoEnviado, ResultadoRevision, TipoNotificacionNombre } from "../../interfaces/Notificacion"
import { Servicio } from "../../models/Servicio"
import { NotificacionRepository } from "../../repositories/notificaciones/NotificacionRepository"
import { formatDate } from "../../utils/formatters"
import { logger } from "../../utils/logger"
import { Correo, Mailer } from "../../utils/mailer"
import { diasRestantes } from "../../utils/vencimiento"
import { correoVencimiento } from "./plantillas"

const DIA_MS = 24 * 60 * 60 * 1000

const NOMBRE_TIPO: Record<number, TipoNotificacionNombre> = {
    [TIPO_NOTIFICACION.TRES_DIAS]: "3_dias",
    [TIPO_NOTIFICACION.UN_DIA]: "1_dia",
    [TIPO_NOTIFICACION.VENCIDO]: "vencido"
}

const tipoPorDias = (dias: number): number | null => {
    if (dias === 3) return TIPO_NOTIFICACION.TRES_DIAS
    if (dias === 1) return TIPO_NOTIFICACION.UN_DIA
    if (dias === 0) return TIPO_NOTIFICACION.VENCIDO
    return null
}

let enCurso: Promise<ResultadoRevision> | null = null

export class NotificacionService {
    constructor(
        private readonly repository: NotificacionRepository,
        private readonly mailer: Mailer
    ) {}

    revisarVencimientos(ahora = new Date()): Promise<ResultadoRevision> {
        enCurso ??= this.ejecutar(ahora).finally(() => {
            enCurso = null
        })
        return enCurso
    }

    private async ejecutar(ahora: Date): Promise<ResultadoRevision> {
        const servicios = await this.repository.findActivosQueVencenAntesDe(new Date(ahora.getTime() + 4 * DIA_MS))
        const enviados: CorreoEnviado[] = []
        const fallidos: CorreoFallido[] = []
        let omitidos = 0

        for (const servicio of servicios) {
            const tipo = tipoPorDias(diasRestantes(new Date(servicio.fechaVencimiento), ahora))
            if (tipo === null || !servicio.usuario) {
                omitidos++
                continue
            }
            if (!await this.repository.reservar(servicio.id, tipo)) {
                omitidos++
                continue
            }
            const registro = { servicioId: servicio.id, tipo: NOMBRE_TIPO[tipo], correo: servicio.usuario.correo }
            try {
                await this.mailer.send(this.armarCorreo(servicio, ahora))
                enviados.push(registro)
            } catch (error) {
                await this.repository.liberar(servicio.id, tipo)
                const motivo = error instanceof Error ? error.message : String(error)
                logger.error(`No se pudo enviar el aviso del servicio ${servicio.id}: ${motivo}`)
                fallidos.push({ ...registro, motivo: "No se pudo enviar el correo" })
            }
        }

        const vencidosMarcados = await this.repository.marcarVencidos(ahora)
        const resultado = { ejecutadaAt: ahora, revisados: servicios.length, enviados, omitidos, fallidos, vencidosMarcados }
        logger.info(`Revisión de vencimientos: ${enviados.length} enviados, ${fallidos.length} fallidos, ${vencidosMarcados} marcados como vencidos`)
        return resultado
    }

    private armarCorreo(servicio: Servicio, ahora: Date): Correo {
        const vencimiento = new Date(servicio.fechaVencimiento)
        return correoVencimiento({
            cliente: servicio.usuario?.nombre ?? "",
            correo: servicio.usuario?.correo ?? "",
            plataforma: servicio.cuenta?.plataforma?.nombre ?? "tu plataforma",
            modalidad: servicio.pantallaId === null ? "cuenta" : "pantalla",
            fechaVencimiento: formatDate(vencimiento),
            dias: diasRestantes(vencimiento, ahora),
            urlRenovar: `${config.clientUrls[0] ?? ""}/mi-cuenta?renovar=${servicio.id}`
        })
    }
}
