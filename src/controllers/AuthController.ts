import { CookieOptions, Request, Response } from "express"
import { config } from "../config/config"
import { AuthRepository } from "../repositories/AuthRepository"
import { AuthService, AuthSession } from "../services/AuthService"
import { ApiResponse } from "../utils/apiResponse"
import { LoginInput, RegisterInput } from "../validators/AuthValidators"

const service = new AuthService(new AuthRepository())

const ACCESS_COOKIE = "accessToken"
const REFRESH_COOKIE = "refreshToken"

const baseCookie: CookieOptions = {
    httpOnly: true,
    secure: config.isProduction,
    sameSite: config.isProduction ? "none" : "lax",
    path: "/"
}

const setSessionCookies = (res: Response, session: AuthSession): void => {
    res.cookie(ACCESS_COOKIE, session.accessToken, { ...baseCookie, expires: session.accessTokenExpires })
    res.cookie(REFRESH_COOKIE, session.refreshToken, { ...baseCookie, expires: session.refreshTokenExpires })
}

const clearSessionCookies = (res: Response): void => {
    res.clearCookie(ACCESS_COOKIE, baseCookie)
    res.clearCookie(REFRESH_COOKIE, baseCookie)
}

const getRefreshToken = (req: Request): string | undefined => {
    const cookie: unknown = req.cookies?.[REFRESH_COOKIE]
    return typeof cookie === "string" ? cookie : undefined
}

export class AuthController {
    static async login(req: Request, res: Response): Promise<Response> {
        try {
            const session = await service.login(req.body as LoginInput)
            setSessionCookies(res, session)
            return ApiResponse.success(res, `Bienvenido, ${session.user.nombre}`, {
                accessToken: session.accessToken,
                user: session.user
            })
        } catch (error) {
            return ApiResponse.error(res, error)
        }
    }

    static async register(req: Request, res: Response): Promise<Response> {
        try {
            const session = await service.register(req.body as RegisterInput)
            setSessionCookies(res, session)
            return ApiResponse.created(res, `Cuenta creada. Bienvenido, ${session.user.nombre}`, {
                accessToken: session.accessToken,
                user: session.user
            })
        } catch (error) {
            return ApiResponse.error(res, error)
        }
    }

    static async refresh(req: Request, res: Response): Promise<Response> {
        try {
            const session = await service.refresh(getRefreshToken(req))
            setSessionCookies(res, session)
            return ApiResponse.success(res, "Sesión renovada", {
                accessToken: session.accessToken,
                user: session.user
            })
        } catch (error) {
            clearSessionCookies(res)
            return ApiResponse.error(res, error)
        }
    }

    static async logout(req: Request, res: Response): Promise<Response> {
        try {
            await service.logout(getRefreshToken(req))
            clearSessionCookies(res)
            return ApiResponse.success(res, "Sesión cerrada")
        } catch (error) {
            return ApiResponse.error(res, error)
        }
    }

    static async me(req: Request, res: Response): Promise<Response> {
        try {
            return ApiResponse.success(res, "Usuario autenticado", req.user)
        } catch (error) {
            return ApiResponse.error(res, error)
        }
    }
}
