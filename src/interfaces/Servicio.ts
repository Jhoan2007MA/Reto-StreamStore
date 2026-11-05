import { EstadoVencimiento } from "../utils/vencimiento"
import { TipoProductoNombre } from "./Catalogo"

export interface ServicioCliente {
    id: number
    compraId: number
    producto: {
        id: number
        tipo: TipoProductoNombre
        duracionDias: number
    }
    plataforma: {
        id: number
        nombre: string
        logoUrl: string | null
    }
    credenciales: {
        correo: string
        contrasena: string | null
        perfil: string | null
        pin: string | null
    }
    fechaCompra: Date
    fechaInicio: Date
    fechaVencimiento: Date
    diasRestantes: number
    estado: EstadoVencimiento
    renovable: boolean
}
