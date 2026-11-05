export interface AuthUser {
    id: number
    nombre: string
    correo: string
    rolId: number
    rol: string
}

export interface TokenPayload {
    id: number
}
