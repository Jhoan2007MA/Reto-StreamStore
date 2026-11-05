import { Request, Response } from "express"
import { PlataformaRepository } from "../../repositories/plataformas/PlataformaRepository"
import { ProductoRepository } from "../../repositories/productos/ProductoRepository"
import { PlataformaService } from "../../services/plataformas/PlataformaService"
import { ApiResponse } from "../../utils/apiResponse"
import { EstadoInput, IdParam } from "../../validators/CommonValidators"
import { CreatePlataformaInput, ListPlataformaQuery, UpdatePlataformaInput } from "../../validators/plataformas/PlataformaValidators"

const service = new PlataformaService(new PlataformaRepository(), new ProductoRepository())

export class PlataformaController {
    static async list(_req: Request, res: Response): Promise<Response> {
        try {
            const plataformas = await service.listActivas()
            return ApiResponse.success(res, "Plataformas disponibles", plataformas)
        } catch (error) {
            return ApiResponse.error(res, error)
        }
    }

    static async listAdmin(_req: Request, res: Response): Promise<Response> {
        try {
            const plataformas = await service.listAdmin(res.locals.query as ListPlataformaQuery)
            return ApiResponse.success(res, "Plataformas", plataformas)
        } catch (error) {
            return ApiResponse.error(res, error)
        }
    }

    static async getAdmin(_req: Request, res: Response): Promise<Response> {
        try {
            const { id } = res.locals.params as IdParam
            const plataforma = await service.getAdmin(id)
            return ApiResponse.success(res, "Detalle de la plataforma", plataforma)
        } catch (error) {
            return ApiResponse.error(res, error)
        }
    }

    static async create(req: Request, res: Response): Promise<Response> {
        try {
            const plataforma = await service.create(req.body as CreatePlataformaInput, req.user!.id)
            return ApiResponse.created(res, "Plataforma creada", plataforma)
        } catch (error) {
            return ApiResponse.error(res, error)
        }
    }

    static async update(req: Request, res: Response): Promise<Response> {
        try {
            const { id } = res.locals.params as IdParam
            const plataforma = await service.update(id, req.body as UpdatePlataformaInput, req.user!.id)
            return ApiResponse.success(res, "Plataforma actualizada", plataforma)
        } catch (error) {
            return ApiResponse.error(res, error)
        }
    }

    static async cambiarEstado(req: Request, res: Response): Promise<Response> {
        try {
            const { id } = res.locals.params as IdParam
            const plataforma = await service.cambiarEstado(id, req.body as EstadoInput, req.user!.id)
            return ApiResponse.success(res, plataforma.estado === 1 ? "Plataforma activada" : "Plataforma inactivada", plataforma)
        } catch (error) {
            return ApiResponse.error(res, error)
        }
    }
}
