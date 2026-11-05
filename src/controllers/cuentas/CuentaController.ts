import { Request, Response } from "express"
import { CuentaRepository } from "../../repositories/cuentas/CuentaRepository"
import { CuentaService } from "../../services/cuentas/CuentaService"
import { ApiResponse } from "../../utils/apiResponse"
import { CreateCuentaInput, ListCuentaQuery } from "../../validators/cuentas/CuentaValidators"

const service = new CuentaService(new CuentaRepository())

export class CuentaController {
    static async create(req: Request, res: Response): Promise<Response> {
        try {
            const cuenta = await service.create(req.body as CreateCuentaInput, req.user!.id)
            return ApiResponse.created(res, `Cuenta cargada con ${cuenta.pantallasTotal} pantallas`, cuenta)
        } catch (error) {
            return ApiResponse.error(res, error)
        }
    }

    static async list(_req: Request, res: Response): Promise<Response> {
        try {
            const cuentas = await service.list(res.locals.query as ListCuentaQuery)
            return ApiResponse.success(res, "Inventario de cuentas", cuentas)
        } catch (error) {
            return ApiResponse.error(res, error)
        }
    }
}
