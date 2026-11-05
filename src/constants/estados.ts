export const ROLES = {
    SUPERADMIN: 1,
    ADMINISTRADOR: 2,
    CLIENTE: 3
} as const

export const ESTADO_REGISTRO = {
    INACTIVO: 0,
    ACTIVO: 1
} as const

export const TIPO_PRODUCTO = {
    CUENTA: 1,
    PANTALLA: 2
} as const

export const ESTADO_CUENTA = {
    INACTIVA: 0,
    DISPONIBLE: 1,
    PARCIAL: 2,
    VENDIDA: 3
} as const

export const ESTADO_PANTALLA = {
    DISPONIBLE: 1,
    VENDIDA: 2
} as const

export const ESTADO_COMPRA = {
    PENDIENTE: 1,
    PAGADA: 2,
    CANCELADA: 3
} as const

export const ESTADO_SERVICIO = {
    ACTIVO: 1,
    VENCIDO: 2
} as const

export const TIPO_NOTIFICACION = {
    TRES_DIAS: 1,
    UN_DIA: 2,
    VENCIDO: 3
} as const
