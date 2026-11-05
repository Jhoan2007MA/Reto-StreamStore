import { Request, Response } from "express"
import { ProductoRepository } from "../../repositories/productos/ProductoRepository"
import { ProductoService } from "../../services/productos/ProductoService"
import { ApiResponse } from "../../utils/apiResponse"
import { IdParam } from "../../validators/CommonValidators"
import { ListProductoQuery } from "../../validators/productos/ProductoValidators"

const service = new ProductoService(new ProductoRepository())

export class ProductoController {
    static async list(_req: Request, res: Response): Promise<Response> {
        try {
            const productos = await service.list(res.locals.query as ListProductoQuery)
            return ApiResponse.success(res, "Catálogo de productos", productos)
        } catch (error) {
            return ApiResponse.error(res, error)
        }
    }

    static async getById(_req: Request, res: Response): Promise<Response> {
        try {
            const { id } = res.locals.params as IdParam
            const producto = await service.getById(id)
            return ApiResponse.success(res, "Detalle del producto", producto)
        } catch (error) {
            return ApiResponse.error(res, error)
        }
    }
}
