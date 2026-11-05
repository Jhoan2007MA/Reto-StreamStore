import { formatDate } from "./formatters"

export type EstadoVencimiento = "activo" | "por_vencer" | "vencido"

const DIA_MS = 24 * 60 * 60 * 1000
const DIAS_AVISO = 3

export const diasRestantes = (fechaVencimiento: Date, ahora = new Date()): number =>
    Math.round((Date.parse(formatDate(fechaVencimiento)) - Date.parse(formatDate(ahora))) / DIA_MS)

export const estadoVencimiento = (fechaVencimiento: Date, ahora = new Date()): EstadoVencimiento => {
    if (fechaVencimiento.getTime() <= ahora.getTime()) return "vencido"
    return diasRestantes(fechaVencimiento, ahora) <= DIAS_AVISO ? "por_vencer" : "activo"
}
