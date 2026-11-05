import { Request, Response } from "express"
import { NotificacionRepository } from "../../repositories/notificaciones/NotificacionRepository"
import { NotificacionService } from "../../services/notificaciones/NotificacionService"
import { ApiResponse } from "../../utils/apiResponse"
import { NodemailerMailer } from "../../utils/mailer"

const service = new NotificacionService(new NotificacionRepository(), new NodemailerMailer())

export class NotificacionController {
    static async ejecutar(_req: Request, res: Response): Promise<Response> {
        try {
            const resultado = await service.revisarVencimientos()
            return ApiResponse.success(res, `Revisión ejecutada: ${resultado.enviados.length} correos enviados`, resultado)
        } catch (error) {
            return ApiResponse.error(res, error)
        }
    }
}
