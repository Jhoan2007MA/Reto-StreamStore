import { Request, Response } from "express"
import { ServicioRepository } from "../../repositories/servicios/ServicioRepository"
import { ServicioService } from "../../services/servicios/ServicioService"
import { ApiResponse } from "../../utils/apiResponse"
import { ListServicioQuery } from "../../validators/servicios/ServicioValidators"

const service = new ServicioService(new ServicioRepository())

export class ServicioController {
    static async listMios(req: Request, res: Response): Promise<Response> {
        try {
            const servicios = await service.listMios(req.user!.id, res.locals.query as ListServicioQuery)
            return ApiResponse.success(res, "Tus servicios", servicios)
        } catch (error) {
            return ApiResponse.error(res, error)
        }
    }
}
