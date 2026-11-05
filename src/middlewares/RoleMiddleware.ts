import { NextFunction, Request, Response } from "express"
import { ROLES } from "../constants/estados"
import { ApiResponse } from "../utils/apiResponse"

export const RoleMiddleware = (...roles: number[]) =>
    (req: Request, res: Response, next: NextFunction): void => {
        if (!req.user) {
            ApiResponse.unauthorized(res)
            return
        }
        if (!roles.includes(req.user.rolId)) {
            ApiResponse.forbidden(res)
            return
        }
        next()
    }

export const soloAdmin = RoleMiddleware(ROLES.SUPERADMIN, ROLES.ADMINISTRADOR)

export const soloCliente = RoleMiddleware(ROLES.CLIENTE)
