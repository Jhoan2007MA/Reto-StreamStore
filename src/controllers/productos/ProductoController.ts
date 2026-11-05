import { Request, Response } from "express"
import { ProductoRepository } from "../../repositories/productos/ProductoRepository"
import { ProductoService } from "../../services/productos/ProductoService"
import { ApiResponse } from "../../utils/apiResponse"
import { EstadoInput, IdParam } from "../../validators/CommonValidators"
import { CreateProductoInput, ListProductoAdminQuery, ListProductoQuery, UpdateProductoInput } from "../../validators/productos/ProductoValidators"

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

    static async listAdmin(_req: Request, res: Response): Promise<Response> {
        try {
            const productos = await service.listAdmin(res.locals.query as ListProductoAdminQuery)
            return ApiResponse.success(res, "Productos", productos)
        } catch (error) {
            return ApiResponse.error(res, error)
        }
    }

    static async getAdmin(_req: Request, res: Response): Promise<Response> {
        try {
            const { id } = res.locals.params as IdParam
            const producto = await service.getAdmin(id)
            return ApiResponse.success(res, "Detalle del producto", producto)
        } catch (error) {
            return ApiResponse.error(res, error)
        }
    }

    static async create(req: Request, res: Response): Promise<Response> {
        try {
            const producto = await service.create(req.body as CreateProductoInput, req.user!.id)
            return ApiResponse.created(res, "Producto creado", producto)
        } catch (error) {
            return ApiResponse.error(res, error)
        }
    }

    static async update(req: Request, res: Response): Promise<Response> {
        try {
            const { id } = res.locals.params as IdParam
            const producto = await service.update(id, req.body as UpdateProductoInput, req.user!.id)
            return ApiResponse.success(res, "Producto actualizado", producto)
        } catch (error) {
            return ApiResponse.error(res, error)
        }
    }

    static async cambiarEstado(req: Request, res: Response): Promise<Response> {
        try {
            const { id } = res.locals.params as IdParam
            const producto = await service.cambiarEstado(id, req.body as EstadoInput, req.user!.id)
            return ApiResponse.success(res, producto.estado === 1 ? "Producto activado" : "Producto inactivado", producto)
        } catch (error) {
            return ApiResponse.error(res, error)
        }
    }
}
