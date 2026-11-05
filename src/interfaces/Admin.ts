import { TipoProductoNombre } from "./Catalogo"
import { CompraDetalle, CompraResumen } from "./Compra"

export interface PlataformaAdmin {
    id: number
    nombre: string
    descripcion: string | null
    logoUrl: string | null
    maxPantallas: number
    estado: number
    stock: {
        cuenta: number
        pantalla: number
    }
    createdAt: Date
    updatedAt: Date
}

export interface ProductoAdmin {
    id: number
    plataforma: {
        id: number
        nombre: string
        estado: number
    }
    tipo: TipoProductoNombre
    duracionDias: number
    precio: number
    estado: number
    stock: number
    createdAt: Date
    updatedAt: Date
}

export interface ClienteCompra {
    id: number
    nombre: string
    correo: string
}

export interface CompraAdmin extends CompraResumen {
    cliente: ClienteCompra
}

export interface CompraDetalleAdmin extends CompraDetalle {
    cliente: ClienteCompra
}

export interface VentasPeriodo {
    compras: number
    total: number
}

export interface ResumenAdmin {
    fecha: string
    ventas: {
        hoy: VentasPeriodo
        mes: VentasPeriodo
    }
    plataformas: {
        id: number
        nombre: string
        estado: number
        stock: {
            cuenta: number
            pantalla: number
        }
        cuentas: {
            total: number
            disponibles: number
            parciales: number
            vendidas: number
            inactivas: number
        }
    }[]
    servicios: {
        activos: number
        porVencer: number
        vencidos: number
    }
    clientes: number
}
