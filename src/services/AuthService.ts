import bcrypt from "bcrypt"
import jwt, { SignOptions } from "jsonwebtoken"
import { config } from "../config/config"
import { ROLES } from "../constants/estados"
import { AuthUser, TokenPayload } from "../interfaces/User"
import { User } from "../models/User"
import { AuthRepository } from "../repositories/AuthRepository"
import { HttpError } from "../utils/httpError"
import { LoginInput, RegisterInput } from "../validators/AuthValidators"

export interface AuthSession {
    accessToken: string
    accessTokenExpires: Date
    refreshToken: string
    refreshTokenExpires: Date
    user: AuthUser
}

const ACTIVO = 1

export class AuthService {
    constructor(private readonly repository: AuthRepository) {}

    async login(input: LoginInput): Promise<AuthSession> {
        const user = await this.repository.findByCorreo(input.correo)
        const valid = user ? await bcrypt.compare(input.contrasena, user.contrasenaHash) : false
        if (!user || !valid) throw new HttpError("Correo o contraseña incorrectos", 401)
        this.ensureActive(user)
        return this.createSession(user)
    }

    async register(input: RegisterInput): Promise<AuthSession> {
        if (await this.repository.existsByCorreo(input.correo)) {
            throw new HttpError("Ya existe una cuenta con ese correo", 409)
        }
        const id = await this.repository.create({
            nombre: input.nombre,
            correo: input.correo,
            telefono: input.telefono ?? null,
            contrasenaHash: input.contrasena,
            rolId: ROLES.CLIENTE
        })
        const user = await this.repository.findById(id)
        if (!user) throw new HttpError("No se pudo crear la cuenta", 500)
        return this.createSession(user)
    }

    async refresh(refreshToken: string | undefined): Promise<AuthSession> {
        if (!refreshToken) throw new HttpError("Sesión no encontrada", 401)
        const payload = this.verify(refreshToken, config.jwt.refreshSecret)
        const user = await this.repository.findRefreshTokenById(payload.id)
        if (!user || user.refreshToken !== refreshToken) throw new HttpError("Sesión inválida o expirada", 401)
        this.ensureActive(user)
        return this.createSession(user)
    }

    async logout(refreshToken: string | undefined): Promise<void> {
        if (!refreshToken) return
        const decoded = jwt.decode(refreshToken)
        if (this.isTokenPayload(decoded)) {
            await this.repository.updateRefreshToken(decoded.id, null)
        }
    }

    async authenticate(accessToken: string | undefined): Promise<AuthUser> {
        if (!accessToken) throw new HttpError("Token no proporcionado", 401)
        const payload = this.verify(accessToken, config.jwt.secret)
        const user = await this.repository.findById(payload.id)
        if (!user) throw new HttpError("Usuario no encontrado", 401)
        this.ensureActive(user)
        return this.toAuthUser(user)
    }

    private async createSession(user: User): Promise<AuthSession> {
        const payload: TokenPayload = { id: user.id }
        const accessToken = this.sign(payload, config.jwt.secret, config.jwt.accessExpiresIn)
        const refreshToken = this.sign(payload, config.jwt.refreshSecret, config.jwt.refreshExpiresIn)
        await this.repository.updateRefreshToken(user.id, refreshToken)
        return {
            accessToken,
            accessTokenExpires: this.getExpiration(accessToken),
            refreshToken,
            refreshTokenExpires: this.getExpiration(refreshToken),
            user: this.toAuthUser(user)
        }
    }

    private ensureActive(user: User): void {
        if (user.estado !== ACTIVO) throw new HttpError("Usuario inactivo", 403)
    }

    private sign(payload: TokenPayload, secret: string, expiresIn: string): string {
        return jwt.sign(payload, secret, { expiresIn: expiresIn as SignOptions["expiresIn"] })
    }

    private verify(token: string, secret: string): TokenPayload {
        try {
            const decoded = jwt.verify(token, secret)
            if (this.isTokenPayload(decoded)) return { id: decoded.id }
        } catch {
            throw new HttpError("Token inválido o expirado", 401)
        }
        throw new HttpError("Token inválido o expirado", 401)
    }

    private isTokenPayload(value: unknown): value is TokenPayload {
        return typeof value === "object" && value !== null && "id" in value && typeof value.id === "number"
    }

    private getExpiration(token: string): Date {
        const decoded = jwt.decode(token)
        const exp = typeof decoded === "object" && decoded !== null ? decoded.exp : undefined
        return exp ? new Date(exp * 1000) : new Date()
    }

    private toAuthUser(user: User): AuthUser {
        return {
            id: user.id,
            nombre: user.nombre,
            correo: user.correo,
            telefono: user.telefono,
            rolId: user.rolId,
            rol: user.rol?.nombre ?? ""
        }
    }
}
