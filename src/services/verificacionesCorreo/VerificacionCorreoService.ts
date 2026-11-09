import { createHmac, randomInt, timingSafeEqual } from "crypto"
import { config } from "../../config/config"
import { ESTADO_REGISTRO } from "../../constants/estados"
import { VerificacionCorreoRepository } from "../../repositories/verificacionesCorreo/VerificacionCorreoRepository"
import { HttpError } from "../../utils/httpError"
import { logger } from "../../utils/logger"
import { Mailer } from "../../utils/mailer"
import { ReenviarCodigoInput, VerificarCorreoInput } from "../../validators/AuthValidators"
import { correoVerificacion } from "./plantillas"

const MINUTOS_VIGENCIA = 15
const SEGUNDOS_ENTRE_SOLICITUDES = 60
const MAXIMO_INTENTOS = 5

const hashCodigo = (codigo: string): string => createHmac("sha256", config.credentialsSecret).update(codigo).digest("hex")

const mismoHash = (a: string, b: string): boolean => {
    const bufferA = Buffer.from(a, "hex")
    const bufferB = Buffer.from(b, "hex")
    return bufferA.length === bufferB.length && timingSafeEqual(bufferA, bufferB)
}

export interface DestinatarioVerificacion {
    id: number
    nombre: string
    correo: string
}

export class VerificacionCorreoService {
    constructor(
        private readonly repository: VerificacionCorreoRepository,
        private readonly mailer: Mailer
    ) {}

    async enviar(usuario: DestinatarioVerificacion, ahora = new Date()): Promise<void> {
        const codigo = randomInt(0, 1_000_000).toString().padStart(6, "0")
        const id = await this.repository.crear(usuario.id, hashCodigo(codigo), new Date(ahora.getTime() + MINUTOS_VIGENCIA * 60 * 1000))
        try {
            await this.mailer.send(correoVerificacion(usuario.nombre, usuario.correo, codigo, MINUTOS_VIGENCIA))
        } catch (error) {
            await this.repository.eliminar(id)
            logger.error(`No se pudo enviar el código de verificación al usuario ${usuario.id}: ${error instanceof Error ? error.message : String(error)}`)
        }
    }

    async reenviar(input: ReenviarCodigoInput, ahora = new Date()): Promise<void> {
        const usuario = await this.repository.findUsuarioPorCorreo(input.correo)
        if (!usuario || usuario.verificadoAt || usuario.estado !== ESTADO_REGISTRO.ACTIVO) return

        const ultima = await this.repository.findUltimaPendiente(usuario.id)
        if (ultima && ahora.getTime() - new Date(ultima.createdAt).getTime() < SEGUNDOS_ENTRE_SOLICITUDES * 1000) return

        await this.enviar(usuario, ahora)
    }

    async verificar(input: VerificarCorreoInput, ahora = new Date()): Promise<number> {
        const usuario = await this.repository.findUsuarioPorCorreo(input.correo)
        if (!usuario) throw new HttpError("El código no es válido. Solicita uno nuevo", 400)
        if (usuario.verificadoAt) throw new HttpError("Esta cuenta ya fue verificada. Inicia sesión", 409)
        if (usuario.estado !== ESTADO_REGISTRO.ACTIVO) throw new HttpError("Usuario inactivo", 403)

        const verificacion = await this.repository.findUltimaPendiente(usuario.id)
        if (!verificacion || new Date(verificacion.expiraAt).getTime() <= ahora.getTime()) {
            throw new HttpError("El código venció. Solicita uno nuevo", 400)
        }
        if (!(await this.repository.sumarIntento(verificacion.id, MAXIMO_INTENTOS))) {
            throw new HttpError("Superaste el número de intentos. Solicita un código nuevo", 400)
        }
        if (!mismoHash(hashCodigo(input.codigo), verificacion.codigoHash)) {
            const restantes = MAXIMO_INTENTOS - verificacion.intentos - 1
            throw new HttpError(restantes > 0 ? `Código incorrecto. Te ${restantes === 1 ? "queda 1 intento" : `quedan ${restantes} intentos`}` : "Código incorrecto. Solicita un código nuevo", 400)
        }
        if (!(await this.repository.confirmar(verificacion.id, usuario.id, ahora))) {
            throw new HttpError("El código no es válido. Solicita uno nuevo", 400)
        }
        return usuario.id
    }
}
