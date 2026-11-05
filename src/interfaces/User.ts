export interface AuthUser {
    id: number
    nombre: string
    correo: string
    telefono: string | null
    rolId: number
    rol: string
}

export interface TokenPayload {
    id: number
}
