export type TipoNotificacionNombre = "3_dias" | "1_dia" | "vencido"

export interface CorreoEnviado {
    servicioId: number
    tipo: TipoNotificacionNombre
    correo: string
}

export interface CorreoFallido extends CorreoEnviado {
    motivo: string
}

export interface ResultadoRevision {
    ejecutadaAt: Date
    revisados: number
    enviados: CorreoEnviado[]
    omitidos: number
    fallidos: CorreoFallido[]
    vencidosMarcados: number
}
