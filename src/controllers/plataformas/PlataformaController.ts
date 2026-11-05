import { Request, Response } from "express"
import { PlataformaRepository } from "../../repositories/plataformas/PlataformaRepository"
import { PlataformaService } from "../../services/plataformas/PlataformaService"
import { ApiResponse } from "../../utils/apiResponse"

const service = new PlataformaService(new PlataformaRepository())

export class PlataformaController {
    static async list(_req: Request, res: Response): Promise<Response> {
        try {
            const plataformas = await service.listActivas()
            return ApiResponse.success(res, "Plataformas disponibles", plataformas)
        } catch (error) {
            return ApiResponse.error(res, error)
        }
    }
}
