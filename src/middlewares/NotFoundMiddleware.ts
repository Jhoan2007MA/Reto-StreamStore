import { Request, Response } from "express"
import { ApiResponse } from "../utils/apiResponse"

export const NotFoundMiddleware = (req: Request, res: Response): void => {
    ApiResponse.notFound(res, `Ruta no encontrada: ${req.method} ${req.originalUrl}`)
}
