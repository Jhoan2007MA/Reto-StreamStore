import { Response } from "express"
import { HttpError } from "./httpError"
import { logger } from "./logger"

export class ApiResponse {
    static success<T>(res: Response, message: string, data?: T, status = 200): Response {
        return res.status(status).json({ message, data: data ?? null })
    }

    static created<T>(res: Response, message: string, data?: T): Response {
        return ApiResponse.success(res, message, data, 201)
    }

    static badRequest(res: Response, error: string, errors?: Record<string, string[] | undefined>): Response {
        return res.status(400).json(errors ? { error, errors } : { error })
    }

    static unauthorized(res: Response, error = "No autorizado"): Response {
        return res.status(401).json({ error })
    }

    static forbidden(res: Response, error = "No tienes permiso para realizar esta acción"): Response {
        return res.status(403).json({ error })
    }

    static notFound(res: Response, error = "Recurso no encontrado"): Response {
        return res.status(404).json({ error })
    }

    static error(res: Response, error: unknown): Response {
        if (error instanceof HttpError) {
            const body = error.data === undefined ? { error: error.message } : { error: error.message, data: error.data }
            return res.status(error.status).json(body)
        }
        logger.error(error instanceof Error ? error.stack ?? error.message : String(error))
        return res.status(500).json({ error: "Error interno del servidor" })
    }
}
