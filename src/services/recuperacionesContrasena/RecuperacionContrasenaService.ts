import { createHash, randomBytes } from "crypto"
import { config } from "../../config/config"
import { ESTADO_REGISTRO } from "../../constants/estados"
import { RecuperacionContrasenaRepository } from "../../repositories/recuperacionesContrasena/RecuperacionContrasenaRepository"
import { HttpError } from "../../utils/httpError"
import { logger } from "../../utils/logger"
import { Mailer } from "../../utils/mailer"
import { RecuperarContrasenaInput, RestablecerContrasenaInput } from "../../validators/AuthValidators"
import { correoRecuperacion } from "./plantillas"

const MINUTOS_VIGENCIA = 30
const SEGUNDOS_ENTRE_SOLICITUDES = 60

const hashToken = (token: string): string => createHash("sha256").update(token).digest("hex")

export class RecuperacionContrasenaService {
    constructor(
        private readonly repository: RecuperacionContrasenaRepository,
        private readonly mailer: Mailer
    ) {}

    async solicitar(input: RecuperarContrasenaInput, ahora = new Date()): Promise<void> {
        const usuario = await this.repository.findUsuarioPorCorreo(input.correo)
        if (!usuario || usuario.estado !== ESTADO_REGISTRO.ACTIVO) return

        const ultima = await this.repository.findUltimaPendiente(usuario.id)
        if (ultima && ahora.getTime() - new Date(ultima.createdAt).getTime() < SEGUNDOS_ENTRE_SOLICITUDES * 1000) return

        const token = randomBytes(32).toString("base64url")
        const tokenHash = hashToken(token)
        await this.repository.crear(usuario.id, tokenHash, new Date(ahora.getTime() + MINUTOS_VIGENCIA * 60 * 1000))

        const url = `${config.clientUrls[0] ?? ""}/restablecer-contrasena?token=${token}`
        try {
            await this.mailer.send(correoRecuperacion(usuario.nombre, usuario.correo, url, MINUTOS_VIGENCIA))
        } catch (error) {
            await this.repository.eliminar(tokenHash)
            logger.error(`No se pudo enviar el correo de recuperación al usuario ${usuario.id}: ${error instanceof Error ? error.message : String(error)}`)
        }
    }

    async restablecer(input: RestablecerContrasenaInput, ahora = new Date()): Promise<void> {
        const ok = await this.repository.restablecer(hashToken(input.token), input.contrasena, ahora)
        if (!ok) throw new HttpError("El enlace no es válido o ya expiró. Solicita uno nuevo", 400)
    }
}
