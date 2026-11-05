import cron from "node-cron"
import { config } from "../config/config"
import { NotificacionRepository } from "../repositories/notificaciones/NotificacionRepository"
import { NotificacionService } from "../services/notificaciones/NotificacionService"
import { logger } from "../utils/logger"
import { NodemailerMailer } from "../utils/mailer"

const service = new NotificacionService(new NotificacionRepository(), new NodemailerMailer())

export const iniciarJobVencimientos = (): void => {
    if (!config.cron.enabled) {
        logger.info("Tarea de vencimientos desactivada (CRON_ENABLED=false)")
        return
    }
    cron.schedule(config.cron.vencimientos, async () => {
        try {
            await service.revisarVencimientos()
        } catch (error) {
            logger.error(`Falló la revisión de vencimientos: ${error instanceof Error ? error.message : String(error)}`)
        }
    }, { timezone: config.appTimezone })
    logger.info(`Tarea de vencimientos programada: "${config.cron.vencimientos}" (${config.appTimezone})`)
}
