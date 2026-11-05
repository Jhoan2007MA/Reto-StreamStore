import { NextFunction, Request, Response } from "express"
import { ApiResponse } from "../utils/apiResponse"

const isJsonSyntaxError = (error: unknown): boolean =>
    error instanceof SyntaxError && "status" in error && error.status === 400

export const ErrorMiddleware = (error: unknown, _req: Request, res: Response, _next: NextFunction): void => {
    if (isJsonSyntaxError(error)) {
        ApiResponse.badRequest(res, "El cuerpo de la petición no es un JSON válido")
        return
    }
    ApiResponse.error(res, error)
}
