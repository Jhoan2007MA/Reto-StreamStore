import { TipoProductoNombre } from "./Catalogo"

export interface CarritoLinea {
    id: number
    producto: {
        id: number
        plataforma: {
            id: number
            nombre: string
            logoUrl: string | null
        }
        tipo: TipoProductoNombre
        duracionDias: number
        precio: number
        disponible: boolean
    }
    cantidad: number
    subtotal: number
    stock: number
    stockSuficiente: boolean
}

export interface CarritoResumen {
    items: CarritoLinea[]
    cantidadTotal: number
    total: number
    puedePagar: boolean
}
