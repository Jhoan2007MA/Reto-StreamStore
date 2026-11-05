import { Request, Response } from "express"
import { RecuperacionContrasenaRepository } from "../../repositories/recuperacionesContrasena/RecuperacionContrasenaRepository"
import { RecuperacionContrasenaService } from "../../services/recuperacionesContrasena/RecuperacionContrasenaService"
import { ApiResponse } from "../../utils/apiResponse"
import { NodemailerMailer } from "../../utils/mailer"
import { RecuperarContrasenaInput, RestablecerContrasenaInput } from "../../validators/AuthValidators"

const service = new RecuperacionContrasenaService(new RecuperacionContrasenaRepository(), new NodemailerMailer())

export class RecuperacionContrasenaController {
    static async solicitar(req: Request, res: Response): Promise<Response> {
        try {
            await service.solicitar(req.body as RecuperarContrasenaInput)
            return ApiResponse.success(res, "Si el correo está registrado, te enviamos un enlace para restablecer tu contraseña")
        } catch (error) {
            return ApiResponse.error(res, error)
        }
    }

    static async restablecer(req: Request, res: Response): Promise<Response> {
        try {
            await service.restablecer(req.body as RestablecerContrasenaInput)
            return ApiResponse.success(res, "Tu contraseña fue actualizada. Ya puedes iniciar sesión")
        } catch (error) {
            return ApiResponse.error(res, error)
        }
    }
}
