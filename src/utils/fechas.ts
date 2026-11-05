import { config } from "../config/config"
import { formatDate } from "./formatters"

const DIA_MS = 24 * 60 * 60 * 1000

export const hoy = (ahora = new Date()): string => formatDate(ahora)

export const sumarDias = (fecha: string, dias: number): string =>
    new Date(Date.parse(fecha) + dias * DIA_MS).toISOString().slice(0, 10)

export const inicioDelDia = (fecha: string): Date => new Date(`${fecha}T00:00:00${config.db.timezone}`)

export const inicioDelMes = (fecha: string): string => `${fecha.slice(0, 7)}-01`

export const inicioDelMesSiguiente = (fecha: string): string => {
    const [anio, mes] = fecha.split("-").map(Number)
    const siguiente = new Date(Date.UTC(anio ?? 1970, mes ?? 1, 1))
    return siguiente.toISOString().slice(0, 10)
}
