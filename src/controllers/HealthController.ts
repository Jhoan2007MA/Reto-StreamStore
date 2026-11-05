import { Request, Response } from "express"
import { sequelize } from "../config/database"
import { ApiResponse } from "../utils/apiResponse"
import { logger } from "../utils/logger"

export class HealthController {
    static async check(_req: Request, res: Response): Promise<Response> {
        try {
            await sequelize.authenticate()
            return ApiResponse.success(res, "Servidor operativo", { server: "ok", database: "ok" })
        } catch (error) {
            logger.error(error instanceof Error ? error.message : String(error))
            return res.status(503).json({ error: "Base de datos no disponible", data: { server: "ok", database: "error" } })
        }
    }
}
