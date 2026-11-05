import { TipoProductoNombre } from "./Catalogo"

export type EstadoCompraNombre = "pendiente" | "pagada" | "cancelada"

export interface CompraResumen {
    id: number
    estado: EstadoCompraNombre
    total: number
    metodoPago: string | null
    cantidadItems: number
    createdAt: Date
    pagadaAt: Date | null
}

export interface CompraItemDetalle {
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
    }
    renovacionDe: number | null
    cantidad: number
    precioUnitario: number
    subtotal: number
    servicios: {
        id: number
        fechaInicio: Date
        fechaVencimiento: Date
    }[]
}

export interface CompraDetalle extends CompraResumen {
    items: CompraItemDetalle[]
}
