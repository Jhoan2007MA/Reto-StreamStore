export type TipoProductoNombre = "cuenta" | "pantalla"

export interface PlataformaPublica {
    id: number
    nombre: string
    descripcion: string | null
    logoUrl: string | null
    maxPantallas: number
}

export interface StockPlataforma {
    cuenta: number
    pantalla: number
}

export interface ProductoCatalogo {
    id: number
    plataforma: {
        id: number
        nombre: string
        logoUrl: string | null
    }
    tipo: TipoProductoNombre
    duracionDias: number
    precio: number
    stock: number
    agotado: boolean
}
