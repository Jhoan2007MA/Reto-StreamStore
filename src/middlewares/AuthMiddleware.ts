import { NextFunction, Request, Response } from "express"
import { AuthRepository } from "../repositories/AuthRepository"
import { AuthService } from "../services/AuthService"
import { ApiResponse } from "../utils/apiResponse"

const service = new AuthService(new AuthRepository())

const getAccessToken = (req: Request): string | undefined => {
    const header = req.headers.authorization
    if (header?.startsWith("Bearer ")) return header.slice(7)
    const cookie: unknown = req.cookies?.accessToken
    return typeof cookie === "string" ? cookie : undefined
}

export const AuthMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        req.user = await service.authenticate(getAccessToken(req))
        next()
    } catch (error) {
        ApiResponse.error(res, error)
    }
}
