import { Request, Response } from "express"
import { CarritoItemRepository } from "../../repositories/carritoItems/CarritoItemRepository"
import { CompraRepository } from "../../repositories/compras/CompraRepository"
import { ProductoRepository } from "../../repositories/productos/ProductoRepository"
import { CarritoItemService } from "../../services/carritoItems/CarritoItemService"
import { CompraService } from "../../services/compras/CompraService"
import { ApiResponse } from "../../utils/apiResponse"
import { IdParam } from "../../validators/CommonValidators"
import { ListCompraAdminQuery, ListCompraQuery, PagarCompraInput } from "../../validators/compras/CompraValidators"

const service = new CompraService(
    new CompraRepository(),
    new CarritoItemService(new CarritoItemRepository(), new ProductoRepository())
)

export class CompraController {
    static async checkout(req: Request, res: Response): Promise<Response> {
        try {
            const compra = await service.checkout(req.user!.id)
            return ApiResponse.created(res, "Pedido creado. Confirma el pago para recibir tus accesos", compra)
        } catch (error) {
            return ApiResponse.error(res, error)
        }
    }

    static async pagar(req: Request, res: Response): Promise<Response> {
        try {
            const { id } = res.locals.params as IdParam
            const compra = await service.pagar(id, req.body as PagarCompraInput, req.user!.id)
            return ApiResponse.success(res, "Pago exitoso. Ya puedes ver tus accesos en Mis servicios", compra)
        } catch (error) {
            return ApiResponse.error(res, error)
        }
    }

    static async listMias(req: Request, res: Response): Promise<Response> {
        try {
            const compras = await service.listMias(req.user!.id, res.locals.query as ListCompraQuery)
            return ApiResponse.success(res, "Historial de compras", compras)
        } catch (error) {
            return ApiResponse.error(res, error)
        }
    }

    static async getById(req: Request, res: Response): Promise<Response> {
        try {
            const { id } = res.locals.params as IdParam
            const compra = await service.getById(id, req.user!.id)
            return ApiResponse.success(res, "Detalle de la compra", compra)
        } catch (error) {
            return ApiResponse.error(res, error)
        }
    }

    static async listAdmin(_req: Request, res: Response): Promise<Response> {
        try {
            const compras = await service.listAdmin(res.locals.query as ListCompraAdminQuery)
            return ApiResponse.success(res, "Ventas", compras)
        } catch (error) {
            return ApiResponse.error(res, error)
        }
    }

    static async getByIdAdmin(_req: Request, res: Response): Promise<Response> {
        try {
            const { id } = res.locals.params as IdParam
            const compra = await service.getByIdAdmin(id)
            return ApiResponse.success(res, "Detalle de la venta", compra)
        } catch (error) {
            return ApiResponse.error(res, error)
        }
    }
}
