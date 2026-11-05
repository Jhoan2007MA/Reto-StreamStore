import { Request, Response } from "express"
import { ProductoRepository } from "../../repositories/productos/ProductoRepository"
import { ResumenRepository } from "../../repositories/resumen/ResumenRepository"
import { ResumenService } from "../../services/resumen/ResumenService"
import { ApiResponse } from "../../utils/apiResponse"

const service = new ResumenService(new ResumenRepository(), new ProductoRepository())

export class ResumenController {
    static async get(_req: Request, res: Response): Promise<Response> {
        try {
            const resumen = await service.get()
            return ApiResponse.success(res, "Resumen de ventas e inventario", resumen)
        } catch (error) {
            return ApiResponse.error(res, error)
        }
    }
}
