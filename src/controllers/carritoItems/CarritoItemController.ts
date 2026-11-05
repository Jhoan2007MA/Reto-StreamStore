import { Request, Response } from "express"
import { CarritoItemRepository } from "../../repositories/carritoItems/CarritoItemRepository"
import { ProductoRepository } from "../../repositories/productos/ProductoRepository"
import { CarritoItemService } from "../../services/carritoItems/CarritoItemService"
import { ApiResponse } from "../../utils/apiResponse"
import { CreateCarritoItemInput, RenovarCarritoItemInput, UpdateCarritoItemInput } from "../../validators/carritoItems/CarritoItemValidators"
import { IdParam } from "../../validators/CommonValidators"

const service = new CarritoItemService(new CarritoItemRepository(), new ProductoRepository())

export class CarritoItemController {
    static async get(req: Request, res: Response): Promise<Response> {
        try {
            const carrito = await service.get(req.user!.id)
            return ApiResponse.success(res, "Tu carrito", carrito)
        } catch (error) {
            return ApiResponse.error(res, error)
        }
    }

    static async add(req: Request, res: Response): Promise<Response> {
        try {
            const { creado, carrito } = await service.add(req.body as CreateCarritoItemInput, req.user!.id)
            return creado
                ? ApiResponse.created(res, "Producto agregado al carrito", carrito)
                : ApiResponse.success(res, "Se actualizó la cantidad en el carrito", carrito)
        } catch (error) {
            return ApiResponse.error(res, error)
        }
    }

    static async renovar(req: Request, res: Response): Promise<Response> {
        try {
            const carrito = await service.renovar(req.body as RenovarCarritoItemInput, req.user!.id)
            return ApiResponse.created(res, "Renovación agregada al carrito", carrito)
        } catch (error) {
            return ApiResponse.error(res, error)
        }
    }

    static async update(req: Request, res: Response): Promise<Response> {
        try {
            const { id } = res.locals.params as IdParam
            const carrito = await service.update(id, req.body as UpdateCarritoItemInput, req.user!.id)
            return ApiResponse.success(res, "Cantidad actualizada", carrito)
        } catch (error) {
            return ApiResponse.error(res, error)
        }
    }

    static async remove(req: Request, res: Response): Promise<Response> {
        try {
            const { id } = res.locals.params as IdParam
            const carrito = await service.remove(id, req.user!.id)
            return ApiResponse.success(res, "Producto quitado del carrito", carrito)
        } catch (error) {
            return ApiResponse.error(res, error)
        }
    }

    static async clear(req: Request, res: Response): Promise<Response> {
        try {
            const carrito = await service.clear(req.user!.id)
            return ApiResponse.success(res, "Carrito vaciado", carrito)
        } catch (error) {
            return ApiResponse.error(res, error)
        }
    }
}
