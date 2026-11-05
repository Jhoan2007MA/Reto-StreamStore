export type EstadoCuentaNombre = "disponible" | "parcial" | "vendida" | "inactiva"

export type EstadoPantallaNombre = "disponible" | "vendida"

export interface PantallaInventario {
    id: number
    nombrePerfil: string
    pin: string
    estado: EstadoPantallaNombre
}

export interface CuentaInventario {
    id: number
    plataforma: {
        id: number
        nombre: string
    }
    correoAcceso: string
    estado: EstadoCuentaNombre
    pantallasTotal: number
    pantallasDisponibles: number
    pantallasVendidas: number
    pantallas: PantallaInventario[]
    createdAt: Date
}
